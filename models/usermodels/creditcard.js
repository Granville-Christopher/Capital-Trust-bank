const mongoose = require("mongoose");

const CreditCardSelectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cardType: {
      type: String,
      enum: ["visa", "mastercard"],
      required: true,
    },
    cardNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "frozen"],
      default: "active",
    },
    cvv: {
      type: String,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    selectedAt: {
      type: Date,
      default: Date.now,
    },
    pin: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CreditCardSelection", CreditCardSelectionSchema);
