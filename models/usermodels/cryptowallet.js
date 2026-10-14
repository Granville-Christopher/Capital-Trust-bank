const mongoose = require("mongoose");

const cryptoWalletSchema = new mongoose.Schema(
  {
    walletName: {
      type: String,
      required: true,
    },
    walletAddress: {
      type: String,
      required: true,
    },
    cryptocurrency: {
      type: String,
      required: true,
      enum: ["BTC", "ETH", "USDT", "USDC", "BNB", "SOL", "XRP", "DOGE", "ADA", "DOT", "MATIC", "LTC", "TRX", "BCH", "XLM", "Other"],
    },
    network: {
      type: String,
      required: true,
      enum: ["Bitcoin", "Ethereum", "Binance Smart Chain", "Polygon", "Solana", "Tron", "Litecoin", "Bitcoin Cash", "Stellar", "Other"],
    },
    qrCode: {
      type: String,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const CryptoWallet = mongoose.model("CryptoWallet", cryptoWalletSchema);

module.exports = CryptoWallet;

