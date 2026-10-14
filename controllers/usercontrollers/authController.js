const User = require("../../models/usermodels/userSignup");
const { body, validationResult } = require("express-validator");
const escape = require("escape-html");
const bcrypt = require("bcrypt");
const generateAccountNumber = require("../../config/accountnumbergenerator");
const KYC = require("../../models/usermodels/kyc");
const { sendEmail, getEmailFromName } = require("../../config/loanremindermailer");
const { generateOtp } = require("../../config/transferotpmailer");

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
    .isLength({ min: 4 })
    .withMessage("Password must be at least 4 characters"),

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

      // Send admin notification email
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const adminSubject = "🆕 New User Registration - CTBank";
        const adminText = `New user registered: ${safeName} (${safeEmail}), Account: ${accountNumber}`;
        const adminHtml = `
          <h3 style="color: #2563eb;">New User Registration</h3>
          <p>A new user has registered on CTBank:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px; font-weight: 600; color: #374151;">Name</td>
              <td style="padding: 8px; color: #111827;">${safeName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px; font-weight: 600; color: #374151;">Email</td>
              <td style="padding: 8px; color: #111827;">${safeEmail}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px; font-weight: 600; color: #374151;">Account Number</td>
              <td style="padding: 8px; color: #111827;">${accountNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: 600; color: #374151;">Date</td>
              <td style="padding: 8px; color: #111827;">${new Date().toLocaleString()}</td>
            </tr>
          </table>
          <p style="margin-top: 15px; font-size: 13px; color: #6b7280;">Please review the user's KYC once submitted.</p>
        `;
        sendEmail(adminEmail, adminSubject, adminText, adminHtml).catch(err => 
          console.error("Failed to send admin signup notification:", err)
        );
      }

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
          return res.status(500).json({ error: "Session save error" });
        } else {
          console.log("Session user set:", req.session.user);
          return res.status(201).json({
            message: "Signup Successful",
            redirectUrl: "/udp/dashboard?newAccount=true",
          });
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
    .isLength({ min: 4 })
    .withMessage("Password must be at least 4 characters"),

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

      if (user.loginBlocked) {
        return res.status(403).json({
          error: "Login access blocked. Please contact support.",
          loginBlocked: true,
        });
      }

      // Generate 6-digit numeric OTP for login verification
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      req.session.pendingLogin = {
        userId: user._id,
        email: user.Email,
        otp: otp,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      };

      req.session.save(async (err) => {
        if (err) {
          console.error("Error saving session for login OTP:", err);
          return res.status(500).json({ error: "Server error preparing login OTP." });
        }

        const brandName = getEmailFromName();
        const subject = `${otp} is your ${brandName} verification code`;
        const text = `${brandName}\n\nHi ${user.Name || "there"},\n\nUse this verification code to complete your sign-in:\n\n${otp}\n\nThis code expires in 10 minutes.\nIf you did not make this request, you can safely ignore this email.\n\n${brandName} Team`;
        const html = `
          <p style="font-size: 14px; line-height: 1.5; margin: 0 0 12px 0; color: #24292f;">
            Hi ${user.Name || "there"},
          </p>
          <p style="font-size: 14px; line-height: 1.5; margin: 0 0 18px 0; color: #24292f;">
            Use this verification code to complete your sign-in:
          </p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-family: monospace; font-size: 30px; font-weight: 700; letter-spacing: 5px; color: #0969da; background: #f6f8fa; border: 1px solid #d0d7de; padding: 10px 22px; border-radius: 6px; display: inline-block;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 13px; line-height: 1.5; margin: 0 0 10px 0; color: #57606a;">
            This code expires in 10 minutes.
          </p>
          <p style="font-size: 13px; line-height: 1.5; margin: 0; color: #57606a;">
            If you did not make this request, you can safely ignore this email.
          </p>
        `;

        sendEmail(user.Email, subject, text, html).catch((mailErr) => {
          console.error("Failed to send OTP email:", mailErr);
        });

        return res.status(200).json({
          requiresOtp: true,
          message: "OTP sent to your email for authentication.",
          email: user.Email,
        });
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
];

const verifyLoginOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const pending = req.session.pendingLogin;

    if (!pending) {
      return res.status(400).json({ error: "No pending login session found. Please sign in again." });
    }

    if (!otp || otp.trim() !== pending.otp) {
      return res.status(400).json({ error: "Invalid OTP code. Please check your email and try again." });
    }

    if (Date.now() > pending.expiresAt) {
      return res.status(400).json({ error: "OTP code has expired. Please click Resend Code." });
    }

    const user = await User.findById(pending.userId);
    if (!user) {
      return res.status(404).json({ error: "User account not found." });
    }

    req.session.user = {
      id: user._id,
      name: user.Name,
      email: user.Email,
      accountNumber: user.AccountNumber,
      accountBalance: user.AccountBalance,
      role: user.role,
    };

    delete req.session.pendingLogin;

    req.session.save((err) => {
      if (err) {
        console.error("Error saving session after OTP verify:", err);
        return res.status(500).json({ error: "Failed to establish session." });
      }
      return res.status(200).json({ success: true, redirect: "/udp/dashboard" });
    });
  } catch (err) {
    console.error("Error verifying login OTP:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

const resendLoginOtp = async (req, res) => {
  try {
    const pending = req.session.pendingLogin;
    if (!pending) {
      return res.status(400).json({ error: "No pending login session found. Please sign in again." });
    }

    const user = await User.findById(pending.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    req.session.pendingLogin.otp = newOtp;
    req.session.pendingLogin.expiresAt = Date.now() + 10 * 60 * 1000;

    req.session.save((err) => {
      if (err) {
        console.error("Error updating pending login session:", err);
        return res.status(500).json({ error: "Failed to update OTP code." });
      }

      const brandName = getEmailFromName();
      const subject = `Your ${brandName} new verification code is ${newOtp}`;
      const text = `${brandName}\n\nHello ${user.Name || "Customer"},\n\nYour new login verification code is: ${newOtp}\n\nThis code will expire in 10 minutes.\n\n${brandName} Security`;
      const html = `
        <p style="font-size: 14px; line-height: 1.5; margin: 0 0 16px 0; color: #24292f;">
          Hello ${user.Name || "Customer"},
        </p>
        <p style="font-size: 14px; line-height: 1.5; margin: 0 0 20px 0; color: #24292f;">
          You requested a new verification code to sign in to your ${brandName} account:
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0969da; background: #f6f8fa; border: 1px solid #d0d7de; padding: 10px 24px; border-radius: 6px; display: inline-block;">
            ${newOtp}
          </span>
        </div>
        <p style="font-size: 13px; line-height: 1.5; margin: 0 0 16px 0; color: #57606a;">
          This code is valid for 10 minutes. For your security, never share this code with anyone.
        </p>
      `;

      sendEmail(user.Email, subject, text, html).catch((mailErr) => {
        console.error("Failed to send OTP email:", mailErr);
      });

      return res.status(200).json({ message: "A new OTP code has been sent to your email address." });
    });
  } catch (err) {
    console.error("Error resending OTP:", err);
    return res.status(500).json({ error: "Failed to resend OTP code." });
  }
};

const changeLoginPassword = [
  body("oldPassword")
    .isLength({ min: 4 })
    .withMessage("Old Password must be at least 4 characters")
    .trim()
    .escape(),

  body("newPassword")
    .isLength({ min: 4 })
    .withMessage("New Password must be at least 4 characters"),

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
  verifyLoginOtp,
  resendLoginOtp,
  changeLoginPassword,
};
