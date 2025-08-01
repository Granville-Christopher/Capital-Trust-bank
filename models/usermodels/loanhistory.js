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
    enum: ["requested", "approved", "rejected", "repaid", "refund"],
    required: true,
  },

  amount: {
    type: Number,
    required: true,
  },

  reason: {
    type: String,
    enum: ["medical", "rent", "education", "business", "other"],
    required: false,
  },

  term: {
    type: Number,
    required: false,
  },

  guarantor: {
    type: String,
    required: false,
  },

  guarantorContact: {
    type: String,
    required: false,
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
