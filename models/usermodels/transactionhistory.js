const mongoose = require("mongoose");

const transactionHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "NGN",
    },
    description: {
      type: String,
      required: true,
    },
    bankName: {
      type: String,
      required: false,
      default: "",
    },
    transferId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "localTransfer",
      required: false,
    },
    referenceId: {
      type: String,
      required: false,
      index: true,
    },
    relatedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    relatedAccount: {
      type: String,
      required: false,
    },
    relatedFullName: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "successful",
        "completed",
        "on hold",
        "on-hold",
        "reversed",
        "failed",
      ],
      default: "pending",
      required: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const TransactionHistory =
  mongoose.models.TransactionHistory ||
  mongoose.model("TransactionHistory", transactionHistorySchema);

module.exports = TransactionHistory;
