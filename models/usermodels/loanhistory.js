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
    required: function () {
      return !["requested", "rejected"].includes(this.action);
    },
  },

  action: {
    type: String,
    enum: ["requested", "approved", "rejected", "repaid", "refund"],
    required: true,
  },
  amount: { type: Number, required: true },
  reason: {
    type: String,
    enum: ["medical", "rent", "education", "business", "other"],
    required: function () {
      return this.action !== "refund";
    },
  },
  term: {
    type: Number,
    required: function () {
      return this.action !== "refund";
    },
  },
  guarantor: {
    type: String,
    required: function () {
      return this.action !== "refund";
    },
  },
  guarantorContact: {
    type: String,
    required: function () {
      return this.action !== "refund";
    },
  },
  statusNote: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("LoanHistory", LoanHistorySchema);
