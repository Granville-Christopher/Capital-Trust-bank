const mongoose = require("mongoose");

const LoanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  amount: {
    type: Number,
    required: true,
    min: 1,
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

  interestRate: {
    type: Number,
    required: true,
  },

  totalRepayment: {
    type: Number,
    required: true,
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "repaid", "defaulted"],
    default: "pending",
  },

  dueDate: {
    type: Date,
    required: true,
  },

  principalPaid: {
    type: Number,
    default: 0,
  },

  interestPaid: {
    type: Number,
    default: 0,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

LoanSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  if (!this.totalRepayment && this.amount && this.interestRate) {
    this.totalRepayment = this.amount + (this.amount * this.interestRate) / 100;
    console.log(`✅ Auto-calculated totalRepayment: ${this.totalRepayment}`);
  }

  next();
});

module.exports = mongoose.model("Loan", LoanSchema);
