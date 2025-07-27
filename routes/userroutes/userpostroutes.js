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
router.get("/lookupaccount", lookupAccount);
// post routes
router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/changeaccountpassword", changeLoginPassword);

router.post("/internationaltransfer", internationalTransfer);
router.post("/setpaymentpin", setTransactionPin);
router.post("/changepaymentpin", changeTransactionPin);
router.post("/confirmtransfer", verifyTransfer);

router.post('/localtransfer', localTransfer)
router.post("/confirmlocaltransfer", verifyLocalTransfer);

module.exports = router;
