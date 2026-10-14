const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    Email: {
      type: String,
      unique: true,
      required: true,
    },
    Name: {
      type: String,
      required: true,
    },
    Phone: {
      type: String,
      default: "",
    },
    Password: {
      type: String,
      required: true,
    },
    loginBlocked: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked", "on hold"],
      default: "active",
    },
    AccountNumber: {
      type: String,
      required: true,
      unique: true,
    },
    AccountBalance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    CreditScore: {
      type: Number,
      default: 500,
      min: 300,
      max: 900,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    accountTier: {
      type: String,
      enum: ["tier1", "tier2", "tier3"],
      default: "tier1",
    },
    currency: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },
    transactionLock: {
      isBlocked: {
        type: Boolean,
        default: false,
      },
      reasonCode: {
        type: String,
        default: "",
      },
      reasonTitle: {
        type: String,
        default: "",
      },
      reasonMessage: {
        type: String,
        default: "",
      },
      unlockDepositAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      blockedAt: {
        type: Date,
        default: null,
      },
      blockedByAdminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        default: null,
      },
      blockedByAdminName: {
        type: String,
        default: "",
      },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
