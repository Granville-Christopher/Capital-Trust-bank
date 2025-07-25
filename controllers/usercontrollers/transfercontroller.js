
const internationalTransferModel = require("../../models/usermodels/internationaltf");
const transactionPinModel = require("../../models/usermodels/transactionpin");
const { body, validationResult } = require("express-validator");
const escape = require("escape-html");

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
      const {
        FullName,
        Amount,
        AccountNumber,
        BankName,
        Address,
        Iban,
      } = req.body;

      const safeFullName = escape(FullName);
      const safeAmount = escape(Amount);
      const safeAccountNumber = escape(AccountNumber);
      const safeBankName = escape(BankName);
      const safeAddress = escape(Address);
      const safeIban = escape(Iban);

      const existingTransfer = await internationalTransferModel.findOne({ FullName: safeFullName });
      if (existingTransfer) {
        return res.status(400).json({ error: "Transfer with this Full Name already exists" });
      }

      const newTransfer = new internationalTransferModel({
        FullName: safeFullName,
        Amount: safeAmount,
        AccountNumber: safeAccountNumber,
        BankName: safeBankName,
        Address: safeAddress,
        Iban: safeIban,
      });

      await newTransfer.save();

      res.status(201).json({ message: "International Transfer Successful", transferId: newTransfer._id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
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

      const newPin = new transactionPinModel({
        userId,
        Pin: safePin,
      });

      await newPin.save();

      res.status(201).json({ message: "Transaction PIN set successfully", pinId: newPin._id });
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
        return res.status(400).json({ error: "No existing transaction PIN found" });
      }

      if (existingPin.Pin !== safeOldPin) {
        return res.status(400).json({ error: "Old PIN is incorrect" });
      }

      existingPin.Pin = safeNewPin;
      await existingPin.save();

      res.status(200).json({ message: "Transaction PIN changed successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },
];

module.exports = {
  internationalTransfer,
  setTransactionPin,
  changeTransactionPin
}
