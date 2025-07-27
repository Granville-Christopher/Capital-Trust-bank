const mongoose = require("mongoose");

const internationalTransferSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ReferenceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
    Address: {
      type: String,
      required: true,
    },
    Iban: {
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

internationalTransferSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 3600 }
);

const InternationalTransfer = mongoose.model(
  "InternationalTransfer",
  internationalTransferSchema
);

module.exports = InternationalTransfer;
