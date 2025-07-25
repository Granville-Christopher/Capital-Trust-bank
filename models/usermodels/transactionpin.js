const mongoose = require("mongoose");

const transactionPinSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    Pin: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const transactionPin = mongoose.model('transactionPin', transactionPinSchema);

module.exports = transactionPin;
