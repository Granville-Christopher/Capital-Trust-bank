const mongoose = require("mongoose");

const CreditScoreHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    change: { type: Number, required: true },
    reason: { type: String, required: true },
    previousScore: { type: Number, required: true },
    newScore: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CreditScoreHistory", CreditScoreHistorySchema);
