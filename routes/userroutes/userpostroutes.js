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
} = require("../../controllers/usercontrollers/financecontroller");

router.get("/lookupaccount", lookupAccount);
router.get("/viewsavings", viewSavings);

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
router.post("/withdraw-interest", withdrawInterest);
router.post("/compound-interest", compoundInterest);
router.post("/cancel-savings", cancelSavings);

module.exports = router;
