const User = require("../../models/usermodels/userSignup");
const { body, validationResult } = require("express-validator");
const escape = require("escape-html");
const bcrypt = require("bcrypt");
const { ExplainVerbosity } = require("mongodb");
const generateAccountNumber = require("../../config/accountnumbergenerator");
const KYC = require("../../models/usermodels/kyc");

const registerUser = [
  body("Email")
    .isEmail()
    .withMessage("Enter a valid email")
    .normalizeEmail()
    .trim(),
  body("Name")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters")
    .trim()
    .escape(),
  body("Password")
    .isLength({ min: 6, max: 6 })
    .withMessage("Password must be 6 digits")
    .isNumeric()
    .withMessage("Password must contain only numbers")
    .custom((value) => {
      if (/(\d)\1\1/.test(value)) {
        throw new Error(
          "Password cannot contain the same digit three times in a row"
        );
      }
      for (let i = 0; i < value.length - 2; i++) {
        const a = parseInt(value[i]);
        const b = parseInt(value[i + 1]);
        const c = parseInt(value[i + 2]);
        if (b === a + 1 && c === b + 1) {
          throw new Error(
            "Password cannot contain ascending sequences like 123"
          );
        }
        if (b === a - 1 && c === b - 1) {
          throw new Error(
            "Password cannot contain descending sequences like 987"
          );
        }
      }
      return true;
    }),

  async (req, res) => {
    if (req.sanitize) {
      req.body.Email = req.sanitize(req.body.Email);
      req.body.Name = req.sanitize(req.body.Name);
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { Email, Name, Password } = req.body;

      const safeEmail = escape(Email);
      const safeName = escape(Name);

      const existingUser = await User.findOne({ Email: safeEmail });
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use" });
      }

      const hashedPassword = await bcrypt.hash(Password, 10);
      const Role = "user";
      const accountNumber = await generateAccountNumber();
      const initialAccountBalance = 0;

      const newUser = new User({
        Email: safeEmail,
        Name: safeName,
        Password: hashedPassword,
        AccountNumber: accountNumber,
        AccountBalance: initialAccountBalance,
        role: Role,
      });

      await newUser.save();

      req.session.user = {
        id: newUser._id,
        name: newUser.Name,
        email: newUser.Email,
        accountNumber: newUser.AccountNumber,
        accountBalance: newUser.AccountBalance,
        role: newUser.role,
      };

      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
        } else {
          console.log("Session user set:", req.session.user);
          res.status(201).json({ message: "Signup Successful" });
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },
];
const loginUser = [
  body("Email")
    .isEmail()
    .withMessage("Enter a valid email")
    .normalizeEmail()
    .trim(),
  body("Password")
    .isLength({ min: 6, max: 6 })
    .withMessage("Password must be 6 digits")
    .isNumeric()
    .withMessage("Password must contain only numbers"),

  async (req, res) => {
    if (req.sanitize) {
      req.body.Email = req.sanitize(req.body.Email);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { Email, Password } = req.body;
      const safeEmail = escape(Email);

      const user = await User.findOne({ Email: safeEmail });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(Password, user.Password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid password" });
      }

      const kyc = await KYC.findOne({ userId: user._id });

      req.session.user = {
        id: user._id,
        name: user.Name,
        email: user.Email,
        role: user.role,
      };

      if (!kyc) {
        return res.status(403).json({
          error: "Please update your KYC",
          kycStatus: "not_submitted",
        });
      }

      if (!kyc.verified) {
        return res.status(403).json({
          error:
            "Please wait, your KYC is under review. This process could take up to 24 hours. If you do not get an email within 24 hours, please contact support.",
          kycStatus: "under_review",
        });
      }
      req.session.user.kycStatus = "verified";

      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
        } else {
          console.log("Session user set:", req.session.user);
          return res.status(200).json({ message: "Login successful" });
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },
];

const changeLoginPassword = [
  body("oldPassword")
    .isLength({ min: 6, max: 6 })
    .withMessage("Old Password must be exactly 6 characters")
    .trim()
    .escape(),

  body("newPassword")
    .isLength({ min: 6, max: 6 })
    .withMessage("Password must be 6 digits")
    .isNumeric()
    .withMessage("Password must contain only numbers"),

  async (req, res) => {
    if (req.sanitize) {
      req.body.oldPassword = req.sanitize(req.body.oldPassword);
      req.body.newPassword = req.sanitize(req.body.newPassword);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.session.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { oldPassword, newPassword } = req.body;
      const safeoldPassword = escape(oldPassword);
      const safenewPassword = escape(newPassword);

      const user = await User.findById(userId);
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      const isMatch = await bcrypt.compare(safeoldPassword, user.Password);
      if (!isMatch) {
        return res.status(400).json({ error: "Old Password is incorrect" });
      }

      if (/(\d)\1\1/.test(safenewPassword)) {
        return res.status(400).json({
          error: "Password cannot contain the same digit three times in a row",
        });
      }

      for (let i = 0; i < safenewPassword.length - 2; i++) {
        const a = parseInt(safenewPassword[i]);
        const b = parseInt(safenewPassword[i + 1]);
        const c = parseInt(safenewPassword[i + 2]);

        if (b === a + 1 && c === b + 1) {
          return res.status(400).json({
            error: "Password cannot contain ascending sequences like 123",
          });
        }

        if (b === a - 1 && c === b - 1) {
          return res.status(400).json({
            error: "Password cannot contain descending sequences like 987",
          });
        }
      }

      const hashedNewPassword = await bcrypt.hash(safenewPassword, 10);
      user.Password = hashedNewPassword;
      await user.save();

      res.status(200).json({ message: "Login Password changed successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },
];
module.exports = {
  registerUser,
  loginUser,
  changeLoginPassword,
};
