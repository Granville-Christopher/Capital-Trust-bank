const express = require("express");
const router = express.Router();
const {
  transferPage,
  localTransferPage,
} = require("../../controllers/usercontrollers/transfercontroller");
const User = require("../../models/usermodels/userSignup");
const internationalTransferModel = require("../../models/usermodels/internationaltf");
const TransactionHistory = require("../../models/usermodels/transactionhistory");
const Notification = require("../../models/usermodels/notifications");

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

    return res.status(200).render("user/savings", { user });
  } catch (error) {
    res.status(500).render("user/login", { error: "Server error", user: null });
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

router.get("/cards", async (req, res) => {
  return res.status(200).render("user/cards");
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
router.get("/confirmlocaltransfer/:transferId", localTransferPage);

router.get("/creditcard", async (req, res) => {
  return res.status(200).render("user/creditcard");
});

router.get("/debitcard", async (req, res) => {
  return res.status(200).render("user/debitcard");
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
      return res
        .status(404)
        .render("user/dashboard", { error: "User not found" });
    }

    const recentTransactions = await TransactionHistory.find({ userId })
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(3)
      .lean();

    res.status(200).render("user/dashboard", {
      user,
      recentTransactions,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).render("user/dashboard", {
      error: "Server error",
      user: null,
      recentTransactions: [],
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

    return res.status(200).render("user/finance", { user });
  } catch (error) {
    res.status(500).render("user/login", { error: "Server error", user: null });
  }
});

router.get("/internationaltransfer", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.redirect("/secure/ctb/login");
    }
    return res.status(200).render("user/internationaltransfer");
  } catch (error) {
    return res.status(200).render("user/login");
  }
});

router.get("/localtransfer", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.redirect("/secure/ctb/login");
    }
    return res.status(200).render("user/localtransfer");
  } catch (error) {
    return res.status(200).render("user/login");
  }
});

router.get("/settings", async (req, res) => {
  return res.status(200).render("user/settings");
});

router.get("/transactionhistory", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.redirect("/secure/ctb/login");
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
      if (transaction.type === "credit") {
        totalIncome += transaction.amount;
      } else if (transaction.type === "debit") {
        totalExpenses += transaction.amount;
      }
    });

    return res.status(200).render("user/transactionhistory", {
      internationalTransfers,
      transactionHistory,
      totalIncome,
      totalExpenses,
    });
  } catch (error) {
    console.error("❌ Error fetching transaction history:", error);
    return res.status(500).render("user/transactionhistory", {
      internationalTransfers: [],
      transactionHistory: [],
      totalIncome: 0,
      totalExpenses: 0,
    });
  }
});

router.get("/profile", async (req, res) => {
  return res.status(200).render("user/profile");
});

module.exports = router;
