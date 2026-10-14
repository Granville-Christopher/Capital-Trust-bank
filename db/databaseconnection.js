require("dotenv").config();
const mongoose = require("mongoose");

const db = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URL ||
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      process.env.DATABASE_URL ||
      "mongodb+srv://christophergranville2_db_user:0gIEP0xwNMwpP8RA@cluster0.jx7kqcg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log("✅ MongoDB Connected successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
  }
};

module.exports = db;
