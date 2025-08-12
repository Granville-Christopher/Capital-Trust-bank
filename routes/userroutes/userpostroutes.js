const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  registerUser,
  loginUser,
  changeLoginPassword,
} = require("../../controllers/usercontrollers/authController");
const {
  internationalTransfer,
  setTransactionPin,
  changeTransactionPin,
  verifyTransfer,
  verifyLocalTransfer,
  localTransfer,
} = require("../../controllers/usercontrollers/transfercontroller");
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

// router.post(
//   "/submit-kyc",
//   (req, res, next) => {
//     console.log("📂 KYC Upload Middleware Triggered");
//     upload.fields([
//       { name: "idFront", maxCount: 1 },
//       { name: "idBack", maxCount: 1 },
//     ])(req, res, function (err) {
//       if (err instanceof multer.MulterError) {
//         return res.status(400).json({ error: err.message });
//       } else if (err) {
//         return res.status(400).json({ error: err.message });
//       }
//       next();
//     });
//   },
//   submitKYC
// );
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
router.post("/changeaccountpassword", changeLoginPassword);
router.post("/internationaltransfer", internationalTransfer);
router.post("/setpaymentpin", setTransactionPin);
router.post("/changepaymentpin", changeTransactionPin);
router.post("/confirmtransfer", verifyTransfer);
router.post("/localtransfer", localTransfer);
router.post("/confirmlocaltransfer", verifyLocalTransfer);
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

module.exports = router;
