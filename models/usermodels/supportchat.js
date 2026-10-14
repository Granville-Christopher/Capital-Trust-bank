const mongoose = require("mongoose");

const supportChatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    adminName: {
      type: String,
      default: "Support Specialist",
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    readByUser: {
      type: Boolean,
      default: false,
    },
    readByAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

supportChatSchema.index({ userId: 1, createdAt: 1 });

module.exports = mongoose.model("SupportChat", supportChatSchema);
