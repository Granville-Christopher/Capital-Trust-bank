const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../../controllers/usercontrollers/authController");

// post routes
router.post("/signup", registerUser);
router.post("/login", loginUser);

module.exports = router;
