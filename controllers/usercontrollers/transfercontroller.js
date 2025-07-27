// const { v4: uuidv4 } = require("uuid");
const internationalTransferModel = require("../../models/usermodels/internationaltf");
const localTransferModel = require("../../models/usermodels/localtf");
const mongoose = require("mongoose");
const User = require("../../models/usermodels/userSignup");
const transactionPinModel = require("../../models/usermodels/transactionpin");
const TransactionHistory = require("../../models/usermodels/transactionhistory");
const { body, validationResult } = require("express-validator");
const escape = require("escape-html");
const bcrypt = require("bcrypt");
const { generateOtp, sendOtpEmail } = require("../../config/transferotpmailer");

function generateNumericReferenceId() {
  const timestamp = Date.now().toString();
  const remainingDigits = 18 - timestamp.length;

  let randomPart = "";
  for (let i = 0; i < remainingDigits; i++) {
    randomPart += Math.floor(Math.random() * 10);
  }

  return timestamp + randomPart;
}

const internationalTransfer = [
  body("FullName")
    .isLength({ min: 2 })
    .withMessage("Full Name must be at least 2 characters")
    .trim()
    .escape(),
  body("Amount")
    .isFloat({ min: 100 })
    .withMessage("Amount must be a number not less than 100")
    .trim()
    .escape(),
  body("AccountNumber")
    .isLength({ min: 5 })
    .withMessage("Account Number must be at least 5 characters")
    .trim()
    .escape(),
  body("BankName")
    .isLength({ min: 2 })
    .withMessage("Bank Name must be at least 2 characters")
    .trim()
    .escape(),
  body("Address")
    .isLength({ min: 5 })
    .withMessage("Address must be at least 5 characters")
    .trim()
    .escape(),
  body("Iban")
    .isLength({ min: 5 })
    .withMessage("IBAN must be at least 5 characters")
    .trim()
    .escape(),

  async (req, res) => {
    if (req.sanitize) {
      req.body.FullName = req.sanitize(req.body.FullName);
      req.body.Amount = req.sanitize(req.body.Amount);
      req.body.AccountNumber = req.sanitize(req.body.AccountNumber);
      req.body.BankName = req.sanitize(req.body.BankName);
      req.body.Address = req.sanitize(req.body.Address);
      req.body.Iban = req.sanitize(req.body.Iban);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { FullName, Amount, AccountNumber, BankName, Address, Iban } =
        req.body;

      console.log("International Transfer Request Received.");
      console.log("req.session:", req.session);
      console.log(
        "req.session.user:",
        req.session ? req.session.user : "req.session is undefined"
      );
      console.log(
        "req.session.user._id:",
        req.session && req.session.user ? req.session.user.id : "N/A"
      );
      console.log(
        "req.session.user.email:",
        req.session && req.session.user ? req.session.user.email : "N/A"
      );

      if (
        !req.session.user ||
        !req.session.user.id ||
        !req.session.user.email
      ) {
        return res
          .status(401)
          .json({ error: "Authentication required or user email/ID missing." });
      }

      const userId = req.session.user.id;
      const userEmail = req.session.user.email;

      const safeFullName = escape(FullName);
      const safeAmount = escape(Amount);
      const safeAccountNumber = escape(AccountNumber);
      const safeBankName = escape(BankName);
      const safeAddress = escape(Address);
      const safeIban = escape(Iban);

      const otp = generateOtp();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

      const newTransfer = new internationalTransferModel({
        userId: userId,
        FullName: safeFullName,
        Amount: safeAmount,
        AccountNumber: safeAccountNumber,
        BankName: safeBankName,
        Address: safeAddress,
        Iban: safeIban,
        otp: otp,
        otpExpires: otpExpires,
        status: "pending_otp",
      });

      await newTransfer.save();

      const emailResult = await sendOtpEmail(userEmail, otp);
      if (!emailResult.success) {
        console.error("Failed to send OTP email:", emailResult.error);
        await internationalTransferModel.deleteOne({ _id: newTransfer._id });
        return res.status(500).json({
          error:
            "Failed to send OTP email. Please try Initiate the transaction again.",
        });
      }

      res.status(200).json({
        message:
          "OTP sent to your email. Please verify to complete the transfer.",
        transferId: newTransfer._id,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },
];

const localTransfer = [
  body("FullName")
    .isLength({ min: 2 })
    .withMessage("Full Name must be at least 2 characters")
    .trim()
    .escape(),
  body("Amount")
    .isFloat({ min: 100 })
    .withMessage("Amount must be a number not less than 100")
    .trim(),
  body("AccountNumber")
    .isLength({ min: 9, max: 9 })
    .withMessage("Account Number must be 9 digits")
    .isNumeric()
    .withMessage("Account Number must be numeric")
    .trim()
    .escape(),
  body("BankName")
    .isLength({ min: 2 })
    .withMessage("Bank Name must be at least 2 characters")
    .trim()
    .escape(),

  async (req, res) => {
    if (req.sanitize) {
      req.body.FullName = req.sanitize(req.body.FullName);
      req.body.Amount = req.sanitize(req.body.Amount);
      req.body.AccountNumber = req.sanitize(req.body.AccountNumber);
      req.body.BankName = req.sanitize(req.body.BankName);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { FullName, Amount, AccountNumber, BankName } = req.body;

      if (
        !req.session.user ||
        !req.session.user.id ||
        !req.session.user.email
      ) {
        return res
          .status(401)
          .json({ error: "Authentication required or user email/ID missing." });
      }

      const senderId = req.session.user.id;
      const senderEmail = req.session.user.email;

      const transferAmount = parseFloat(Amount);
      if (isNaN(transferAmount) || transferAmount < 1) {
        return res.status(400).json({ error: "Invalid transfer amount." });
      }

      const senderUser = await User.findById(senderId);
      if (!senderUser) {
        return res.status(404).json({ error: "Sender user not found." });
      }

      const recipientUser = await User.findOne({
        AccountNumber: AccountNumber,
      });
      if (!recipientUser) {
        return res
          .status(404)
          .json({ error: "Recipient account number not found." });
      }

      if (senderUser.AccountNumber === recipientUser.AccountNumber) {
        return res
          .status(400)
          .json({ error: "Cannot transfer to your own account." });
      }

      if (senderUser.AccountBalance < transferAmount) {
        return res.status(400).json({ error: "Insufficient funds." });
      }

      const otp = generateOtp();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

      const referenceId = generateNumericReferenceId();

      const newTransfer = new localTransferModel({
        userId: senderId,
        FullName: escape(FullName),
        Amount: transferAmount,
        AccountNumber: escape(AccountNumber),
        BankName: escape(BankName),
        ReferenceId: referenceId,
        otp: otp,
        otpExpires: otpExpires,
        status: "pending_otp",
        recipientId: recipientUser._id,
      });

      await newTransfer.save();

      const emailResult = await sendOtpEmail(senderEmail, otp);
      if (!emailResult.success) {
        console.error("Failed to send OTP email:", emailResult.error);
        await localTransferModel.deleteOne({ _id: newTransfer._id });
        return res.status(500).json({
          error:
            "Failed to send OTP email. Please try initiating the transaction again.",
        });
      }

      res.status(200).json({
        message:
          "OTP sent to your email. Please verify to complete the transfer.",
        transferId: newTransfer._id,
        referenceId: newTransfer.ReferenceId,
      });
    } catch (err) {
      console.error("Error during local transfer initiation:", err);
      if (err.code === 11000 && err.message.includes("referenceId")) {
        return res.status(500).json({
          error:
            "A unique transaction reference could not be generated. Please try again.",
        });
      }
      res
        .status(500)
        .json({ error: "Server error during local transfer initiation." });
    }
  },
];

const setTransactionPin = [
  body("Pin")
    .isLength({ min: 4, max: 4 })
    .withMessage("Pin must be exactly 4 characters")
    .trim()
    .escape(),

  async (req, res) => {
    if (req.sanitize) {
      req.body.Pin = req.sanitize(req.body.Pin);
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

      const { Pin } = req.body;
      const safePin = escape(Pin);

      const existingPin = await transactionPinModel.findOne({ userId });
      if (existingPin) {
        return res.status(400).json({ error: "Transaction PIN already set" });
      }

      const hashedPin = await bcrypt.hash(safePin, 10);

      const newPin = new transactionPinModel({
        userId,
        Pin: hashedPin,
      });

      await newPin.save();

      res.status(201).json({
        message: "Transaction PIN set successfully",
        pinId: newPin._id,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },
];

const changeTransactionPin = [
  body("oldPin")
    .isLength({ min: 4, max: 4 })
    .withMessage("Old PIN must be exactly 4 characters")
    .trim()
    .escape(),
  body("newPin")
    .isLength({ min: 4, max: 4 })
    .withMessage("New PIN must be exactly 4 characters")
    .trim()
    .escape(),

  async (req, res) => {
    if (req.sanitize) {
      req.body.oldPin = req.sanitize(req.body.oldPin);
      req.body.newPin = req.sanitize(req.body.newPin);
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

      const { oldPin, newPin } = req.body;
      const safeOldPin = escape(oldPin);
      const safeNewPin = escape(newPin);

      const existingPin = await transactionPinModel.findOne({ userId });
      if (!existingPin) {
        return res
          .status(400)
          .json({ error: "No existing transaction PIN found" });
      }

      const isMatch = await bcrypt.compare(safeOldPin, existingPin.Pin);
      if (!isMatch) {
        return res.status(400).json({ error: "Old PIN is incorrect" });
      }

      const hashedNewPin = await bcrypt.hash(safeNewPin, 10);
      existingPin.Pin = hashedNewPin;
      await existingPin.save();

      res.status(200).json({ message: "Transaction PIN changed successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },
];

const transferPage = async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.redirect("/secure/ctb/login");
    }

    const transferId = req.params.transferId;

    const transferDetails = await internationalTransferModel.findById(
      transferId
    );

    if (!transferDetails) {
      return res.status(404).render("user/confirmtransfer", {
        message: "Transfer not found.",
      });
    }

    return res.status(200).render("user/confirmtransfer", {
      transferDetails,
    });
  } catch (error) {
    console.error("Error loading transfer confirmation:", error);
    return res.status(500).render("user/login");
  }
};
const localTransferPage = async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.redirect("/secure/ctb/login");
    }

    const transferId = req.params.transferId;

    const transferDetails = await localTransferModel.findById(transferId);

    if (!transferDetails) {
      return res.status(404).render("user/confirmlocaltransfer", {
        message: "Transfer not found.",
      });
    }

    return res.status(200).render("user/confirmlocaltransfer", {
      transferDetails,
    });
  } catch (error) {
    console.error("Error loading transfer confirmation:", error);
    return res.status(500).render("user/login");
  }
};

const MAX_PIN_ATTEMPTS = 3;
const LOCKOUT_DURATION_MINUTES = 5;

const verifyTransfer = [
  body("transferId")
    .isMongoId()
    .withMessage("Invalid Transfer ID")
    .trim()
    .escape(),
  body("otp")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
    .isNumeric()
    .withMessage("OTP must be numeric")
    .trim(),
  body("paymentPin")
    .isLength({ min: 4, max: 4 })
    .withMessage("Payment PIN must be 4 digits")
    .isNumeric()
    .withMessage("Payment PIN must be numeric")
    .trim(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { transferId, otp, paymentPin } = req.body;

      if (!req.session.user || !req.session.user.id) {
        return res
          .status(401)
          .json({ error: "Unauthorized: User not authenticated." });
      }

      const userId = req.session.user.id;

      const userPinRecord = await transactionPinModel.findOne({
        userId: userId,
      });

      if (!userPinRecord) {
        return res
          .status(404)
          .json({ error: "Payment PIN not set for this user." });
      }

      if (userPinRecord.lockedUntil && userPinRecord.lockedUntil > Date.now()) {
        const remainingLockTime = Math.ceil(
          (userPinRecord.lockedUntil - Date.now()) / (1000 * 60)
        );
        return res.status(423).json({
          error: `Payment PIN is locked. Please try again in ${remainingLockTime} minute(s).`,
        });
      }

      const transfer = await internationalTransferModel.findOne({
        _id: transferId,
        userId: userId,
        status: "pending_otp",
      });

      if (!transfer) {
        return res
          .status(404)
          .json({ error: "Transfer not found or not awaiting verification." });
      }

      if (
        !transfer.otp ||
        transfer.otp !== otp ||
        transfer.otp === null ||
        transfer.otpExpires === null
      ) {
        return res.status(400).json({
          error: "Invalid OTP.",
        });
      }

      if (transfer.otpExpires && transfer.otpExpires < Date.now()) {
        transfer.otp = null;
        transfer.otpExpires = null;
        transfer.status = "failed";
        await transfer.save();
        return res
          .status(400)
          .json({ error: "OTP has expired. Please re-initiate the transfer." });
      }

      const isPinMatch = await bcrypt.compare(paymentPin, userPinRecord.Pin);

      if (!isPinMatch) {
        userPinRecord.failedAttempts += 1;

        if (userPinRecord.failedAttempts >= MAX_PIN_ATTEMPTS) {
          userPinRecord.lockedUntil = new Date(
            Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000
          );
          userPinRecord.failedAttempts = 0;
          await userPinRecord.save();
          return res.status(400).json({
            error: `Incorrect Payment PIN. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes due to too many failed attempts.`,
          });
        } else {
          await userPinRecord.save();
          const attemptsLeft = MAX_PIN_ATTEMPTS - userPinRecord.failedAttempts;
          return res.status(400).json({
            error: `Incorrect Payment PIN. You have ${attemptsLeft} attempt(s) left before your account is locked.`,
          });
        }
      }

      userPinRecord.failedAttempts = 0;
      userPinRecord.lockedUntil = null;
      await userPinRecord.save();

      transfer.status = "completed";
      transfer.otp = null;
      transfer.otpExpires = null;
      await transfer.save();

      res.status(200).json({
        message: "International Transfer Successful!",
        transferId: transfer._id,
        status: transfer.status,
      });
    } catch (err) {
      console.error("Error during transfer verification:", err);
      res
        .status(500)
        .json({ error: "Server error during transfer verification." });
    }
  },
];

const verifyLocalTransfer = [
  body("transferId")
    .isMongoId()
    .withMessage("Invalid Transfer ID")
    .trim()
    .escape(),
  body("otp")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
    .isNumeric()
    .withMessage("OTP must be numeric")
    .trim(),
  body("paymentPin")
    .isLength({ min: 4, max: 4 })
    .withMessage("Payment PIN must be 4 digits")
    .isNumeric()
    .withMessage("Payment PIN must be numeric")
    .trim(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { transferId, otp, paymentPin } = req.body;

      if (!req.session.user || !req.session.user.id) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(401)
          .json({ error: "Unauthorized: User not authenticated." });
      }
      const senderId = req.session.user.id;

      const userPinRecord = await transactionPinModel
        .findOne({ userId: senderId })
        .session(session);
      if (!userPinRecord) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(404)
          .json({ error: "Payment PIN not set for this user." });
      }

      if (userPinRecord.lockedUntil && userPinRecord.lockedUntil > Date.now()) {
        await session.abortTransaction();
        session.endSession();
        const remainingLockTime = Math.ceil(
          (userPinRecord.lockedUntil - Date.now()) / (1000 * 60)
        );
        return res.status(423).json({
          error: `Payment PIN is locked. Please try again in ${remainingLockTime} minute(s).`,
        });
      }

      const transfer = await localTransferModel
        .findOne({
          _id: transferId,
          userId: senderId,
          status: "pending_otp",
        })
        .session(session);

      if (!transfer) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(404)
          .json({ error: "Transfer not found or not awaiting verification." });
      }

      if (!transfer.otp || transfer.otp !== otp) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json({ error: "Invalid OTP. Please try again." });
      }

      if (transfer.otpExpires && transfer.otpExpires < Date.now()) {
        transfer.status = "failed";
        transfer.otp = null;
        transfer.otpExpires = null;
        await transfer.save({ session });
        await session.commitTransaction();
        session.endSession();
        return res
          .status(400)
          .json({ error: "OTP has expired. Please re-initiate the transfer." });
      }

      const isPinMatch = await bcrypt.compare(paymentPin, userPinRecord.Pin);

      if (!isPinMatch) {
        userPinRecord.failedAttempts += 1;
        if (userPinRecord.failedAttempts >= MAX_PIN_ATTEMPTS) {
          userPinRecord.lockedUntil = new Date(
            Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000
          );
          userPinRecord.failedAttempts = 0;
          await userPinRecord.save({ session });
          await session.commitTransaction();
          session.endSession();
          return res.status(400).json({
            error: `Incorrect Payment PIN. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes due to too many failed attempts.`,
          });
        } else {
          await userPinRecord.save({ session });
          await session.commitTransaction();
          session.endSession();
          const attemptsLeft = MAX_PIN_ATTEMPTS - userPinRecord.failedAttempts;
          return res.status(400).json({
            error: `Incorrect Payment PIN. You have ${attemptsLeft} attempt(s) left before your account is locked.`,
          });
        }
      }

      userPinRecord.failedAttempts = 0;
      userPinRecord.lockedUntil = null;
      await userPinRecord.save({ session });

      const senderUser = await User.findById(senderId).session(session);
      const recipientUser = await User.findById(transfer.recipientId).session(
        session
      );

      if (!senderUser || !recipientUser) {
        console.error(
          "Error: Sender or recipient user not found during final verification step."
        );
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
          error:
            "Sender or recipient user not found during final verification. Please try again.",
        });
      }

      if (senderUser.AccountBalance < transfer.Amount) {
        transfer.status = "failed";
        await transfer.save({ session });
        await session.commitTransaction();
        session.endSession();
        return res.status(400).json({
          error: "Insufficient funds. Balance changed during verification.",
        });
      }

      senderUser.AccountBalance -= transfer.Amount;
      recipientUser.AccountBalance += transfer.Amount;

      await senderUser.save({ session });
      await recipientUser.save({ session });

      const senderDebitHistory = new TransactionHistory({
        userId: senderId,
        type: "debit",
        amount: transfer.Amount,
        currency: "USD",
        description: `Transfer to ${transfer.FullName} (${transfer.AccountNumber})`,
        transferId: transfer._id,
        referenceId: transfer.ReferenceId,
        relatedUserId: transfer.recipientId,
        relatedAccount: transfer.AccountNumber,
        relatedFullName: transfer.FullName,
        status: "successful",
      });
      await senderDebitHistory.save({ session });

      const recipientCreditHistory = new TransactionHistory({
        userId: transfer.recipientId,
        type: "credit",
        amount: transfer.Amount,
        currency: "USD",
        description: `Transfer from ${senderUser.Name} (${senderUser.AccountNumber})`,
        transferId: transfer._id,
        referenceId: transfer.ReferenceId,
        relatedUserId: senderId,
        relatedAccount: senderUser.AccountNumber,
        relatedFullName: senderUser.Name,
        status: "successful",
      });
      await recipientCreditHistory.save({ session });

      transfer.status = "completed";
      transfer.otp = null;
      transfer.otpExpires = null;
      await transfer.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        message: "Local Transfer Successful!",
        transferId: transfer._id,
        status: transfer.status,
      });
    } catch (err) {
      if (session && session.inTransaction()) {
        await session.abortTransaction();
      }
      if (session) {
        session.endSession();
      }
      console.error("Error during local transfer verification:", err);
      res
        .status(500)
        .json({ error: "Server error during local transfer verification." });
    }
  },
];

module.exports = {
  internationalTransfer,
  setTransactionPin,
  changeTransactionPin,
  transferPage,
  localTransferPage,
  verifyTransfer,
  localTransfer,
  verifyLocalTransfer,
};
