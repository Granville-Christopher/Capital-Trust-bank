const mongoose = require("mongoose");

const transactionPinSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    Pin: {
      type: String,
      required: true,
    },
    failedAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const transactionPin = mongoose.model("transactionPin", transactionPinSchema);

module.exports = transactionPin;
