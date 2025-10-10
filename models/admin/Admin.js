const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "admin",
    },
    permissions: [
      {
        type: String,
      },
    ],
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Admin = mongoose.model("Admin", AdminSchema);

module.exports = Admin;
