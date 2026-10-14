const express = require("express");
const router = express.Router();
const {
  transferPage,
} = require("../../controllers/usercontrollers/transfercontroller");
const {
  getDepositPage,
  submitDepositRequest,
} = require("../../controllers/usercontrollers/depositcontroller");
const User = require("../../models/usermodels/userSignup");
const internationalTransferModel = require("../../models/usermodels/internationaltf");
const TransactionHistory = require("../../models/usermodels/transactionhistory");
const Notification = require("../../models/usermodels/notifications");
const TotalSavings = require("../../models/usermodels/savingshistory");
const LoanHistory = require("../../models/usermodels/loanhistory");
const DebitCard = require("../../models/usermodels/debitcard");
const CreditCard = require("../../models/usermodels/creditcard");
const KYC = require("../../models/usermodels/kyc");
const {
  getUserCurrency,
  getCurrencySymbol,
  formatUserBalance,
} = require("../../utils/currencyHelper");

router.get("/savings", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.redirect("/secure/ctb/login");
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).render("user/login", { error: "User not found" });
    }

    const kyc = await KYC.findOne({ userId }).lean();
    const currencyCode = getUserCurrency(user, kyc);
    const currencySymbol = getCurrencySymbol(currencyCode);

    return res.status(200).render("user/savings", {
      user,
      kyc: kyc || null,
      currencyCode,
      currencySymbol,
    });
  } catch (error) {
    res.status(500).render("user/login", {
      error: "Server error",
      user: null,
      kyc: null,
      currencyCode: "USD",
      currencySymbol: "$",
    });
  }
});

router.get("/loantc", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.redirect("/secure/ctb/login");
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).render("user/login", { error: "User not found" });
    }

    return res.status(200).render("user/loantc", { user });
  } catch (error) {
    res.status(500).render("user/login", { error: "Server error", user: null });
  }
});

router.get("/loans", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.redirect("/secure/ctb/login");
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).render("user/login", { error: "User not found" });
    }

    return res.status(200).render("user/loans", { user });
  } catch (error) {
    res.status(500).render("user/login", { error: "Server error", user: null });
  }
});

router.get("/financehistory", async (req, res) => {
  try {
    const userSession = req.session.user;
    if (!userSession?.id) return res.redirect("/secure/ctb/login");

    const userId = userSession.id;

    const user = await User.findById(userId).lean();
    if (!user) return res.redirect("/secure/ctb/login");

    const savingsHistory = await TotalSavings.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    const loanHistory = await LoanHistory.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    const totalSavings = savingsHistory.reduce(
      (sum, entry) => sum + (entry.amount || 0),
      0
    );
    const totalLoans = loanHistory.reduce(
      (sum, entry) => sum + (entry.amount || 0),
      0
    );

    const kyc = await KYC.findOne({ userId }).lean();
    const currencyCode = getUserCurrency(user, kyc);
    const currencySymbol = getCurrencySymbol(currencyCode);

    return res.status(200).render("user/financehistory", {
      user,
      savingsHistory: savingsHistory.slice(0, 100),
      loanHistory: loanHistory.slice(0, 100),
      totalSavings,
      totalLoans,
      currencyCode,
      currencySymbol,
      kyc: kyc || null,
    });
  } catch (error) {
    console.error("❌ Finance History Error:", error.stack || error);
    res.status(500).render("user/login", {
      error: "Server error",
      user: null,
      kyc: null,
      currencyCode: "USD",
      currencySymbol: "$",
    });
  }
});

router.get("/financehistory/load", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { type, skip } = req.query;
    const limit = 100;

    let data;
    if (type === "savings") {
      data = await TotalSavings.find({ userId })
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(limit)
        .lean();
    } else if (type === "loans") {
      data = await LoanHistory.find({ userId })
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(limit)
        .lean();
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error("❌ Load More Error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.get("/cards", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) return res.redirect("/secure/ctb/login");

    const creditCard = await CreditCard.findOne({ userId }).lean();
    const debitCard = await DebitCard.findOne({ userId }).lean();
    const user = await User.findById(userId).lean();
    const kyc = await KYC.findOne({ userId }).lean();
    const currencyCode = getUserCurrency(user, kyc);
    const currencySymbol = getCurrencySymbol(currencyCode);

    res.render("user/cards", {
      creditCard,
      debitCard,
      userName: user?.Name || "",
      currencyCode,
      currencySymbol,
    });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

router.get("/notifications", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.redirect("/secure/ctb/login");
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    return res
      .status(200)
      .render("user/notifications", { notifications: notifications });
  } catch (error) {
    console.error("notifications error:", error);
    return res.status(500).render("user/notifications", {
      error: "server error",
      notifications: [],
    });
  }
});

router.get("/confirmtransfer/:transferId", transferPage);

router.get("/creditcard", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.redirect("/secure/ctb/login");
    }
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).render("user/login", { error: "User not found" });
    }
    return res.status(200).render("user/creditcard", { user });
  } catch (error) {
    console.error("Credit card error:", error);
    return res.status(500).render("user/login", { error: "Server error" });
  }
});

router.get("/debitcard", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.redirect("/secure/ctb/login");
    }
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).render("user/login", { error: "User not found" });
    }
    return res.status(200).render("user/debitcard", { user });
  } catch (error) {
    console.error("Debit card error:", error);
    return res.status(500).render("user/login", { error: "Server error" });
  }
});

router.get("/customerservicecenter", async (req, res) => {
  return res.status(200).render("user/customerservicecenter");
});

router.get("/dashboard", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.redirect("/secure/ctb/login");
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      console.log("User not found");
      return res.status(404).render("user/login", { error: "User not found" });
    }

    const kyc = (await KYC.findOne({ userId }).lean()) || null;

    const recentTransactions = (await TransactionHistory.find({ userId })
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(3)
      .lean()) || [];

    const statusPopup = await Notification.findOne({
      userId,
      popupDismissed: false,
      statusType: { $in: ["successful", "completed", "on_hold", "reversed"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    const currencyCode = getUserCurrency(user, kyc);
    const currencySymbol = getCurrencySymbol(currencyCode);
    const formattedBalance = formatUserBalance(user.AccountBalance, currencyCode);

    res.status(200).render("user/dashboard", {
      user,
      recentTransactions,
      kyc,
      currencyCode,
      currencySymbol,
      formattedBalance,
      statusPopup: statusPopup || null,
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    try {
      const userId = req.session.user?.id;
      if (userId) {
        const user = await User.findById(userId).lean();
        if (user) {
          const kyc = (await KYC.findOne({ userId }).lean()) || null;
          const currencyCode = getUserCurrency(user, kyc);
          const currencySymbol = getCurrencySymbol(currencyCode);
          return res.status(200).render("user/dashboard", {
            user,
            recentTransactions: [],
            kyc: null,
            currencyCode,
            currencySymbol,
            formattedBalance: formatUserBalance(user.AccountBalance, currencyCode),
            statusPopup: null,
          });
        }
      }
    } catch (fallbackErr) {
      console.error("Dashboard fallback error:", fallbackErr);
    }

    return res.status(500).render("user/login", {
      error: "An unexpected error occurred loading your dashboard. Please log in again.",
    });
  }
});

router.get("/finance", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.redirect("/secure/ctb/login");
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).render("user/login", { error: "User not found" });
    }

    const kyc = await KYC.findOne({ userId }).lean();
    const currencyCode = getUserCurrency(user, kyc);
    const currencySymbol = getCurrencySymbol(currencyCode);

    return res.status(200).render("user/finance", {
      user,
      kyc: kyc || null,
      currencyCode,
      currencySymbol,
    });
  } catch (error) {
    res.status(500).render("user/login", {
      error: "Server error",
      user: null,
      kyc: null,
      currencyCode: "USD",
      currencySymbol: "$",
    });
  }
});

router.get("/transfer", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.redirect("/secure/ctb/login");
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.redirect("/secure/ctb/login");
    }

    if (user.transactionLock?.isBlocked) {
      return res.redirect("/udp/dashboard");
    }

    return res.status(200).render("user/internationaltransfer");
  } catch (error) {
    return res.status(200).render("user/login");
  }
});

router.get("/deposit", getDepositPage);
router.post("/submit-deposit", submitDepositRequest);

router.get("/settings", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.redirect("/secure/ctb/login");
    }
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).render("user/login", { error: "User not found" });
    }

    const kyc = await KYC.findOne({ userId }).lean();

    return res.status(200).render("user/settings", { user, kyc: kyc || null });
  } catch (error) {
    console.error("Settings error:", error);
    return res
      .status(500)
      .render("user/login", { error: "Server error", user: null, kyc: null });
  }
});

router.get("/transactionhistory", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.redirect("/secure/ctb/login");
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).render("user/login", { error: "User not found" });
    }

    const internationalTransfers = await internationalTransferModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    const transactionHistory = await TransactionHistory.find({ userId })
      .sort({ transactionDate: -1, createdAt: -1 })
      .lean();

    let totalIncome = 0;
    let totalExpenses = 0;

    transactionHistory.forEach((transaction) => {
      const amt = Number(transaction.amount || 0);
      if (transaction.type === "credit") {
        totalIncome += amt;
      } else if (transaction.type === "debit") {
        totalExpenses += amt;
      }
    });

    const kyc = await KYC.findOne({ userId }).lean();
    const currencyCode = getUserCurrency(user, kyc);
    const currencySymbol = getCurrencySymbol(currencyCode);

    return res.status(200).render("user/transactionhistory", {
      user,
      internationalTransfers,
      transactionHistory,
      totalIncome,
      totalExpenses,
      currencyCode,
      currencySymbol,
      kyc: kyc || null,
    });
  } catch (error) {
    console.error("❌ Error fetching transaction history:", error);
    return res.status(500).render("user/transactionhistory", {
      user: null,
      internationalTransfers: [],
      transactionHistory: [],
      totalIncome: 0,
      totalExpenses: 0,
      currencyCode: "USD",
      currencySymbol: "$",
      kyc: null,
    });
  }
});

router.get("/profile", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.redirect("/secure/ctb/login");
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).render("user/login", { error: "User not found" });
    }

    const kyc = await KYC.findOne({ userId }).lean();
    const currencyCode = getUserCurrency(user, kyc);
    const currencySymbol = getCurrencySymbol(currencyCode);

    return res.status(200).render("user/profile", {
      user,
      kyc: kyc || null,
      currencyCode,
      currencySymbol,
    });
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).render("user/login", {
      error: "Server error",
      user: null,
      kyc: null,
      currencyCode: "USD",
      currencySymbol: "$",
    });
  }
});

module.exports = router;
