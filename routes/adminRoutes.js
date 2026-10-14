const express = require("express");
const router = express.Router();
const {
  loginAsUser,
  registerAdmin,
  loginAdmin,
  getDashboardStats,
  getUsers,
  getUserDetails,
  deleteUser,
  updateBalance,
  updateUserDetails,
  updateUserLoginBlock,
  updateUserAccountTier,
  updateUserCurrency,
  updateTransactionLock,
  backdateUserTransaction,
  deleteUserTransaction,
  generateBulkTransactions,
  getKYCs,
  getKYCDetails,
  approveKYC,
  declineKYC,
  getLoans,
  getLoanDetails,
  markLoanAsPaid,
  getCryptoWallets,
  createCryptoWallet,
  updateCryptoWallet,
  deleteCryptoWallet,
  getDepositRequests,
  approveDepositRequest,
  declineDepositRequest,
} = require("../controllers/admin/adminController");

const {
  getSupportChatView,
  getSupportChatConversations,
  getSupportChatUserMessages,
  sendAdminSupportChatMessage,
} = require("../controllers/admin/adminChatController");

// Middleware to check admin session
const requireAdmin = (req, res, next) => {
  if (!req.session.admin) {
    return res.redirect("/admin/login");
  }
  next();
};

// Admin Auth
router.get("/register", (req, res) => res.render("admin/auth/signup"));
router.post("/register", registerAdmin);
router.get("/login", (req, res) => res.render("admin/auth/login"));
router.post("/login", loginAdmin);

// Dashboard
router.get("/dashboard", requireAdmin, getDashboardStats);

// Users
router.get("/users", requireAdmin, getUsers);
router.get("/users/:id", requireAdmin, getUserDetails);
router.post("/users/:id/login-as-user", requireAdmin, loginAsUser);
router.get("/users/:id/login-as-user", requireAdmin, loginAsUser);
router.get("/impersonate/:id", requireAdmin, loginAsUser);
router.post("/users/:id/delete", requireAdmin, deleteUser);
router.post("/update-balance", requireAdmin, updateBalance);
router.post("/users/:id/update-details", requireAdmin, updateUserDetails);
router.post("/users/:id/login-block", requireAdmin, updateUserLoginBlock);
router.post("/users/:id/account-tier", requireAdmin, updateUserAccountTier);
router.post("/users/:id/currency", requireAdmin, updateUserCurrency);
router.post("/users/:id/transaction-lock", requireAdmin, updateTransactionLock);
router.post(
  "/users/:id/transactions/:transactionId/backdate",
  requireAdmin,
  backdateUserTransaction
);
router.post(
  "/users/:id/transactions/:transactionId/delete",
  requireAdmin,
  deleteUserTransaction
);
router.post(
  "/users/:id/generate-transactions",
  requireAdmin,
  generateBulkTransactions
);

// Support Live Chat
router.get("/support-chat", requireAdmin, getSupportChatView);
router.get("/api/support-chat/conversations", requireAdmin, getSupportChatConversations);
router.get("/api/support-chat/messages/:userId", requireAdmin, getSupportChatUserMessages);
router.post("/api/support-chat/send/:userId", requireAdmin, sendAdminSupportChatMessage);

// KYC
router.get("/kyc", requireAdmin, getKYCs);
router.get("/kyc/:id", requireAdmin, getKYCDetails);
router.post("/kyc/:id/approve", requireAdmin, approveKYC);
router.post("/kyc/:id/decline", requireAdmin, declineKYC);

// Loans
router.get("/loans", requireAdmin, getLoans);
router.get("/loans/:id", requireAdmin, getLoanDetails);
router.post("/loans/:id/mark-paid", requireAdmin, markLoanAsPaid);

// Crypto Wallet routes
router.get("/crypto-wallets", requireAdmin, getCryptoWallets);
router.post("/crypto-wallets", requireAdmin, createCryptoWallet);
router.put("/crypto-wallets/:id", requireAdmin, updateCryptoWallet);
router.delete("/crypto-wallets/:id", requireAdmin, deleteCryptoWallet);

// Deposit Request routes
router.get("/deposit-requests", requireAdmin, getDepositRequests);
router.post("/deposit-requests/:id/approve", requireAdmin, approveDepositRequest);
router.post("/deposit-requests/:id/decline", requireAdmin, declineDepositRequest);

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.redirect("/admin/login");
  });
});

module.exports = router;
