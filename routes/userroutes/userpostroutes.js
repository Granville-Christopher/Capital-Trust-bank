const express = require("express");
const router = express.Router();
const multer = require("multer");
const Notification = require("../../models/usermodels/notifications");

const {
  registerUser,
  loginUser,
  verifyLoginOtp,
  resendLoginOtp,
  changeLoginPassword,
} = require("../../controllers/usercontrollers/authController");
const {
  internationalTransfer,
  localTransfer,
  setTransactionPin,
  changeTransactionPin,
  verifyTransfer,
  verifyLocalTransfer,
} = require("../../controllers/usercontrollers/transfercontroller");
const {
  submitDepositRequest,
} = require("../../controllers/usercontrollers/depositcontroller");
const lookupAccount = require("../../controllers/usercontrollers/lookupaccount");
const {
  depositToSavings,
  withdrawInterest,
  compoundInterest,
  viewSavings,
  cancelSavings,
  getCreditScore,
} = require("../../controllers/usercontrollers/financecontroller");
const {
  getSavingsSummary,
  compoundAllSavings,
  withdrawAllSavings,
} = require("../../controllers/usercontrollers/savingsummary");
const {
  requestLoan,
  repayLoan,
  checkLoanEligibility,
  getLoanDetails,
  getAllLoans,
} = require("../../controllers/usercontrollers/loancontroller");
const {
  createDebitCard,
  fetchDebitCard,
  setDebitCardPin,
  freezeCard,
  terminateCard,
} = require("../../controllers/usercontrollers/debitcardcontroller");
const {
  fetchCreditCard,
  createCreditCard,
  setCreditCardPin,
  freezeCreditCard,
  terminateCreditCard,
} = require("../../controllers/usercontrollers/creditcardcontroller");

const upload = require("../../config/imageuploads");
const {
  submitKYC,
} = require("../../controllers/usercontrollers/kyccontroller");

router.post(
  "/submit-kyc",
  upload.fields([
    { name: "idFront", maxCount: 1 },
    { name: "idBack", maxCount: 1 },
  ]),
  submitKYC
);

router.get("/lookupaccount", lookupAccount);
router.get("/viewsavings", viewSavings);
router.get("/creditscore", getCreditScore);
router.get("/eligibility", checkLoanEligibility);
router.get("/loan-details", getLoanDetails);
router.get("/loans", getAllLoans);
router.get("/debitcard-details", fetchDebitCard);
router.get("/creditcard-details", fetchCreditCard);

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/verify-login-otp", verifyLoginOtp);
router.post("/resend-login-otp", resendLoginOtp);
router.post("/changeaccountpassword", changeLoginPassword);
router.post("/transfer", internationalTransfer);
router.post("/localtransfer", localTransfer);
router.post("/setpaymentpin", setTransactionPin);
router.post("/changepaymentpin", changeTransactionPin);
router.post("/confirmtransfer", verifyTransfer);
router.post("/confirmlocaltransfer", verifyLocalTransfer);
router.post("/submit-deposit", submitDepositRequest);
router.post("/savings", depositToSavings);

router.post("/:id/withdraw-interest", withdrawInterest);
router.post("/:id/compound-interest", compoundInterest);
router.post("/:id/cancel-savings", cancelSavings);

router.get("/summary-savings", getSavingsSummary);
router.post("/compound-all", compoundAllSavings);
router.post("/withdraw-all", withdrawAllSavings);

router.post("/request-loan", requestLoan);
router.post("/repay-loan", repayLoan);

router.post("/create-debit-card", createDebitCard);
router.post("/set-debit-card-pin", setDebitCardPin);
router.post("/create-credit-card", createCreditCard);
router.post("/set-credit-card-pin", setCreditCardPin);

router.post("/freeze-debit-card", freezeCard);
router.delete("/terminate-debit-card", terminateCard);

router.post("/freeze-credit-card", freezeCreditCard);
router.delete("/terminate-credit-card", terminateCreditCard);

router.post("/dismiss-status-popup/:notificationId", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { notificationId } = req.params;
    await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: { popupDismissed: true, read: true } }
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("Error dismissing status popup:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
