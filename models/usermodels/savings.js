const mongoose = require("mongoose");

const savingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    savingsTerm: {
      type: String,
      required: true
    },
    referenceId: {
      type: String,
      required: false,
      index: true,
    },
    totalInterest: {
      type: Number,
      default: 0,
    },
    interestBalance: {
      type: Number,
      default: 0,
    },
    lastInterestDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Savings = mongoose.model("Savings", savingSchema);
module.exports = Savings;
