const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/admin/adminController");

// Middleware to check admin session
const requireAdmin = (req, res, next) => {
  if (!req.session.admin) {
    return res.redirect("/admin/login");
  }
  next();
};

// Auth routes
router.get("/login", (req, res) => {
  return res.render("admin/auth/login");
});
router.get("/signup", (req, res) => {
  return res.render("admin/auth/signup");
});
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

// Protected routes
router.get("/dashboard", requireAdmin, getDashboardStats);
router.get("/users", requireAdmin, getUsers);
router.get("/users/:id", requireAdmin, getUserDetails);
router.post("/users/:id/delete", requireAdmin, deleteUser);
router.post("/users/update-balance", requireAdmin, updateBalance);
router.get("/kyc", requireAdmin, getKYCs);
router.get("/kyc/:id", requireAdmin, getKYCDetails);
router.post("/kyc/:id/approve", requireAdmin, approveKYC);
router.post("/kyc/:id/decline", requireAdmin, declineKYC);
router.get("/loans", requireAdmin, getLoans);
router.get("/loans/:id", requireAdmin, getLoanDetails);

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.redirect("/admin/login");
  });
});

module.exports = router;
