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
    Password: {
      type: String,
      required: true,
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
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
