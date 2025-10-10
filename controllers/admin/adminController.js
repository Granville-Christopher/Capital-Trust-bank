const Admin = require("../../models/admin/Admin");
const User = require("../../models/usermodels/userSignup");
const KYC = require("../../models/usermodels/kyc");
const Loan = require("../../models/usermodels/loans");
const Notification = require("../../models/usermodels/notifications");
const TransactionHistory = require("../../models/usermodels/transactionhistory");
const sendEmail = require("../../config/loanremindermailer");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

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
    .isLength({ min: 6, max: 6 })
    .withMessage("Password must be 6 digits")
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
    .isLength({ min: 6, max: 6 })
    .withMessage("Password must be 6 digits")
    .isNumeric()
    .withMessage("Password must contain only numbers"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
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
      console.error(err);
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
    const users = await User.find({ role: "user" }).select(
      "Name Email AccountBalance AccountNumber"
    );
    // For status, we can add later if needed
    res.render("admin/users", { users, admin: req.session.admin });
  } catch (err) {
    console.error(err);
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
    res.render("admin/user-details", { user, kyc, admin: req.session.admin });
  } catch (err) {
    console.error(err);
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
    const description =
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
      message: description,
    });

    // Send email
    const subject = action === "add" ? "Account Credited" : "Account Debited";
    const text = description;
    const htmlContent = `<p>Dear ${user.Name},</p><p>${description}.</p><p>Thank you for banking with us.</p>`;
    await sendEmail(user.Email, subject, text, htmlContent);

    res.json({ message: "Balance updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
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

module.exports = {
  registerAdmin,
  loginAdmin,
  getDashboardStats,
  getUsers,
  getUserDetails,
  deleteUser,
  updateBalance,
  getKYCs,
  getKYCDetails,
  approveKYC,
  declineKYC,
  getLoans,
  getLoanDetails,
};
