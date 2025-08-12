const express = require("express");
const router = express.Router();
const transactionPin = require("../../models/usermodels/transactionpin");
const User = require("../../models/usermodels/userSignup");

router.get("/login", async (req, res) => {
  return res.status(200).render("user/login");
});

router.get("/signup", async (req, res) => {
  return res.status(200).render("user/signup");
});

router.get("/resetpassword", async (req, res) => {
  return res.status(200).render("user/resetpassword");
});

router.get("/setcreditcardpin", async (req, res) => {
  return res.status(200).render("user/setcreditcardpin");
});

router.get("/setdebitcardpin", async (req, res) => {
  return res.status(200).render("user/setdebitcardpin");
});

router.get("/kyc", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.redirect("/secure/ctb/login");
    }
    return res.status(200).render("user/kyc");
  } catch {
    return res.status(500).render("user/login");
  }
});

router.get("/forgotpaymentpin", async (req, res) => {
  return res.status(200).render("user/forgotpaymentpin");
});

router.get("/changepaymentpin", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.redirect("/secure/ctb/login");
    }

    return res.status(200).render("user/changepaymentpin");
  } catch (error) {
    return res.status(500).render("user/login");
  }
});

router.get("/setpaymentpin", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.redirect("/secure/ctb/login");
    }
    const pinRecord = await transactionPin.findOne({ userId });
    const hasPin = !!pinRecord;
    return res.status(200).render("user/setpaymentpin", { hasPin });
  } catch (error) {
    console.error("Error checking transaction pin:", error);
    return res.status(500).send("Server error");
  }
});

router.get("/changeaccountpassword", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.redirect("/secure/ctb/login");
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    return res.status(200).render("user/changeaccountpassword");
  } catch (error) {
    return res.status(200).render("user/login");
  }
});

router.get("/managecreditcardpin", async (req, res) => {
  return res.status(200).render("user/managecreditcardpin");
});

router.get("/managedebitcardpin", async (req, res) => {
  return res.status(200).render("user/managedebitcardpin");
});

router.get("/setcreditcardpin", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.redirect("/secure/ctb/login");
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).redirect("/secure/ctb/login");
    }
    return res.status(200).render("user/setcreditcardpin", { userId });
  } catch (error) {
    console.error("Error checking transaction pin:", error);
    return res.status(500).redirect("/secure/ctb/login");
  }
});

router.get("/setdebitcardpin", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.redirect("/secure/ctb/login");
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).redirect("/secure/ctb/login");
    }

    return res.status(200).render("user/setdebitcardpin", { userId });
  } catch (error) {
    console.error("Error checking transaction pin:", error);
    return res.status(500).redirect("/secure/ctb/login");
  }
});

module.exports = router;
