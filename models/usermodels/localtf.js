const mongoose = require("mongoose");

const localTransferSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    FullName: {
      type: String,
      required: true,
    },
    Amount: {
      type: Number,
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
    otp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending_otp", "completed", "failed", "cancelled"],
      default: "pending_otp",
    },
  },
  { timestamps: true }
);

localTransferSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

const localTransfer = mongoose.model("localTransfer", localTransferSchema);

module.exports = localTransfer;
