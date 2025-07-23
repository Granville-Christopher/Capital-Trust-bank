const express = require("express");
const router = express.Router();

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
  return res.status(200).render("user/kyc");
});

router.get("/forgotpaymentpin", async (req, res) => {
  return res.status(200).render("user/forgotpaymentpin");
});

router.get("/changepaymentpin", async (req, res) => {
  return res.status(200).render("user/changepaymentpin");
});

router.get("/changeaccountpassword", async (req, res) => {
  return res.status(200).render("user/changeaccountpassword");
});

router.get("/managecreditcardpin", async (req, res) => {
  return res.status(200).render("user/managecreditcardpin");
});

router.get("/managedebitcardpin", async (req, res) => {
  return res.status(200).render("user/managedebitcardpin");
});

router.get("/setcreditcardpin", async (req, res) => {
  return res.status(200).render("user/setcreditcardpin");
});

router.get("/setdebitcardpin", async (req, res) => {
  return res.status(200).render("user/setdebitcardpin");
});

module.exports = router;
