const express = require("express");
const router = express.Router();
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

router.get("/lookupaccount", lookupAccount);
router.get("/viewsavings", viewSavings);
router.get("/creditscore", getCreditScore);
router.get("/eligibility", checkLoanEligibility);
router.get("/loan-details", getLoanDetails);
router.get("/loans", getAllLoans);

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

module.exports = router;
