const DepositRequest = require("../../models/usermodels/depositrequest");
const CryptoWallet = require("../../models/usermodels/cryptowallet");
const User = require("../../models/usermodels/userSignup");
const TransactionHistory = require("../../models/usermodels/transactionhistory");
const Notification = require("../../models/usermodels/notifications");
const { body, validationResult } = require("express-validator");
const escape = require("escape-html");
const depositProofUpload = require("../../config/depositproofupload");
const multerLib = require("multer");
const sendEmail = require("../../config/loanremindermailer");

function handleDepositProofUpload(req, res, next) {
  depositProofUpload.single("paymentProof")(req, res, (err) => {
    if (err) {
      const msg =
        err instanceof multerLib.MulterError
          ? err.code === "LIMIT_FILE_SIZE"
            ? "Payment proof must be 5MB or smaller"
            : err.message
          : err.message || "File upload failed";
      return res.status(400).json({ error: msg });
    }
    next();
  });
}

// Get deposit page with active crypto wallets
const getDepositPage = async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.redirect("/secure/ctb/login");
    }

    const activeWallets = await CryptoWallet.find({ isActive: true }).lean();

    return res.status(200).render("user/deposit", {
      cryptoWallets: activeWallets,
    });
  } catch (error) {
    console.error("Error loading deposit page:", error);
    return res.status(500).render("user/login");
  }
};

// Submit deposit request
const submitDepositRequest = [
  handleDepositProofUpload,
  body("cryptoWalletId")
    .isMongoId()
    .withMessage("Invalid wallet selection")
    .trim()
    .escape(),
  body("amount")
    .custom((value) => {
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        throw new Error("Amount must be a number greater than 0");
      }
      return true;
    })
    .toFloat(),
  body("transactionHash")
    .optional({ values: 'falsy' })
    .custom((value) => {
      if (value && value.trim().length > 0 && value.trim().length < 10) {
        throw new Error("Transaction hash must be at least 10 characters");
      }
      return true;
    })
    .trim()
    .escape(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error("Validation errors:", errors.array());
      return res.status(400).json({ 
        error: "Validation failed",
        errors: errors.array() 
      });
    }

    try {
      if (!req.session.user || !req.session.user.id) {
        return res
          .status(401)
          .json({ error: "Authentication required." });
      }

      const userId = req.session.user.id;
      const { cryptoWalletId, amount, transactionHash } = req.body;

      console.log("Deposit request received:", { cryptoWalletId, amount, transactionHash, userId });

      // Validate cryptoWalletId format
      if (!cryptoWalletId || !cryptoWalletId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ error: "Invalid wallet selection." });
      }

      const cryptoWallet = await CryptoWallet.findById(cryptoWalletId);
      if (!cryptoWallet || !cryptoWallet.isActive) {
        return res.status(404).json({ error: "Crypto wallet not found or inactive." });
      }

      const depositAmount = parseFloat(amount);
      if (isNaN(depositAmount) || depositAmount <= 0) {
        return res.status(400).json({ error: "Invalid deposit amount. Amount must be greater than 0." });
      }

      let paymentProofUrl = "";
      if (req.file) {
        paymentProofUrl = `/uploads/deposit-proofs/${req.file.filename}`;
      } else {
        return res.status(400).json({ error: "Payment proof screenshot is required." });
      }

      const newDepositRequest = new DepositRequest({
        userId: userId,
        cryptoWalletId: cryptoWalletId,
        amount: depositAmount,
        cryptocurrency: cryptoWallet.cryptocurrency,
        transactionHash: (transactionHash && transactionHash.trim()) ? escape(transactionHash.trim()) : "",
        paymentProof: paymentProofUrl,
        network: cryptoWallet.network,
        status: "pending",
      });

      await newDepositRequest.save();

      // Create notification for user
      await Notification.create({
        userId: userId,
        type: "deposit_request",
        message: `Your deposit request of ${cryptoWallet.cryptocurrency} ${depositAmount} has been submitted and is pending approval.`,
        relatedEntity: newDepositRequest._id,
        read: false,
      });

      // Send admin notification email
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const user = await User.findById(userId).lean();
        const userName = user ? user.Name : "Unknown";
        const userEmail = user ? user.Email : "Unknown";

        const adminSubject = `💰 New Deposit Request - ${cryptoWallet.cryptocurrency} ${depositAmount}`;
        const adminText = `New deposit request from ${userName} (${userEmail}): ${cryptoWallet.cryptocurrency} ${depositAmount} on ${cryptoWallet.network}`;
        const adminHtml = `
          <h3 style="color: #2563eb;">New Deposit Request</h3>
          <p>A user has submitted a new deposit request:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px; font-weight: 600; color: #374151;">User</td>
              <td style="padding: 8px; color: #111827;">${userName} (${userEmail})</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px; font-weight: 600; color: #374151;">Cryptocurrency</td>
              <td style="padding: 8px; color: #111827;">${cryptoWallet.cryptocurrency}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px; font-weight: 600; color: #374151;">Amount</td>
              <td style="padding: 8px; color: #111827; font-weight: 700; font-size: 16px;">${depositAmount}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px; font-weight: 600; color: #374151;">Network</td>
              <td style="padding: 8px; color: #111827;">${cryptoWallet.network}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px; font-weight: 600; color: #374151;">Payment Proof</td>
              <td style="padding: 8px; color: #16a34a; font-weight: 600;">Attached ✅</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: 600; color: #374151;">Date</td>
              <td style="padding: 8px; color: #111827;">${new Date().toLocaleString()}</td>
            </tr>
          </table>
          <p style="margin-top: 15px; font-size: 13px; color: #6b7280;">Please review and approve/reject this deposit in the admin dashboard.</p>
        `;
        sendEmail(adminEmail, adminSubject, adminText, adminHtml).catch(err =>
          console.error("Failed to send admin deposit notification:", err)
        );
      }

      res.status(200).json({
        message: "Deposit request submitted successfully. It will be reviewed by admin.",
        depositRequestId: newDepositRequest._id,
      });
    } catch (err) {
      console.error("Error submitting deposit request:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
];

module.exports = {
  getDepositPage,
  submitDepositRequest,
};

