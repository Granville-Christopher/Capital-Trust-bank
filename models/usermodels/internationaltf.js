const mongoose = require("mongoose");

const internationalTransferSchema = new mongoose.Schema(
  {
    FullName: {
      type: String,
      unique: true,
      required: true,
    },
    Amount: {
      type: String,
      required: true,
    },
    AccountNumber: {
      type: String,
      required: true,
    },
    BankName: {
      type: String,
      required: true,
    },
    Address: {
      type: String,
      required: true,
    },
    Iban: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const internationalTransfer = mongoose.model("internationalTransfer", internationalTransferSchema);

module.exports = internationalTransfer;
