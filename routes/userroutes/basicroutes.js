const express = require("express");
const router = express.Router();
const {
  transferPage,
  localTransferPage,
} = require("../../controllers/usercontrollers/transfercontroller");
const User = require("../../models/usermodels/userSignup");
const internationalTransferModel = require("../../models/usermodels/internationaltf");
const TransactionHistory = require("../../models/usermodels/transactionhistory");

router.get("/cards", async (req, res) => {
  return res.status(200).render("user/cards");
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

    res.status(200).render("user/dashboard", { user });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).render("user/dashboard", { error: "Server error" });
  }
});
router.get("/finance", async (req, res) => {
  return res.status(200).render("user/finance");
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

    return res.status(200).render("user/transactionhistory", {
      internationalTransfers: internationalTransfers,
      transactionHistory: transactionHistory,
    });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return res.status(500).render("user/transactionhistory", {
      internationalTransfers: [],
      transactionHistory: [],
    });
  }
});

router.get("/profile", async (req, res) => {
  return res.status(200).render("user/profile");
});

module.exports = router;
