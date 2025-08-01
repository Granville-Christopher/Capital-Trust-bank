const mongoose = require("mongoose");

const LoanHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  loanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Loan",
    required: false,
  },

  action: {
    type: String,
    enum: ["requested", "approved", "rejected", "repaid"],
    required: true,
  },

  amount: {
    type: Number,
    required: true,
  },

  reason: {
    type: String,
    enum: ["medical", "rent", "education", "business", "other"],
    required: true,
  },

  term: {
    type: Number,
    required: true,
  },

  guarantor: {
    type: String,
    required: true,
  },

  guarantorContact: {
    type: String,
    required: true,
  },

  statusNote: {
    type: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("LoanHistory", LoanHistorySchema);
