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
