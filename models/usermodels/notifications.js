const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "transfer_credit",
        "transfer_debit",
        "system_alert",
        "info",
        "warning",
        "success",
      ],
      default: "info",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    relatedEntity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "localTransfer",
      default: null,
    },
    relatedReferenceId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

module.exports = Notification;
