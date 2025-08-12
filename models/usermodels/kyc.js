const mongoose = require("mongoose");

const kycSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    country: { type: String, required: true },
    nationality: { type: String, required: true },
    residentialAddress: { type: String, required: true },
    occupation: { type: String, required: true },
    accountCategory: {
      type: String,
      enum: ["personal", "retirement", "business"],
      required: true,
    },
    accountType: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    idType: { type: String, enum: ["idcard", "driverlicense"], required: true },
    idFront: { type: String, required: true },
    idBack: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("KYC", kycSchema);
