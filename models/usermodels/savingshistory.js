const mongoose = require("mongoose");

const savingsHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["deposit", "withdraw_interest", "compound_interest", "cancel" ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    referenceId: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

const SavingsHistory = mongoose.model("SavingsHistory", savingsHistorySchema);
module.exports = SavingsHistory;
