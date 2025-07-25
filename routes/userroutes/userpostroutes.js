const express = require("express");
const router = express.Router();
const { registerUser, loginUser, changeLoginPassword } = require("../../controllers/usercontrollers/authController");
const { internationalTransfer, setTransactionPin,changeTransactionPin } = require("../../controllers/usercontrollers/transfercontroller");

// post routes
router.post("/signup", registerUser);
router.post("/login", loginUser);

router.post("/internationaltransfer", internationalTransfer);
router.post("/setpaymentpin", setTransactionPin);
router.post("/changepaymentpin", changeTransactionPin);
router.post("/changeaccountpassword", changeLoginPassword);

module.exports = router;
