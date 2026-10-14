const mongoose = require("mongoose");

const depositRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cryptoWalletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CryptoWallet",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    cryptocurrency: {
      type: String,
      required: true,
    },
    transactionHash: {
      type: String,
      required: false,
    },
    paymentProof: {
      type: String,
      default: "",
    },
    network: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "declined"],
      default: "pending",
    },
    adminNotes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const DepositRequest = mongoose.model("DepositRequest", depositRequestSchema);

module.exports = DepositRequest;

