// jobs/cronJobs.js
const cron = require("node-cron");
const Savings = require("../models/usermodels/savings");
const User = require("../models/usermodels/userSignup");

async function processMaturedSavings() {
  try {
    const now = new Date();

    const maturedSavings = await Savings.find({ maturityDate: { $lte: now } });

    for (const saving of maturedSavings) {
      const user = await User.findById(saving.userId);
      if (user) {
        user.AccountBalance += saving.amount + saving.totalInterest;
        await user.save();

        saving.amount = 0;
        saving.totalInterest = 0;
        saving.interestBalance = 0;
        saving.maturityDate = null;
        await saving.save();
      }
    }

    console.log("✅ Processed matured savings at", now.toISOString());
  } catch (error) {
    console.error("❌ Cron Job Error:", error);
  }
}

cron.schedule("0 0 * * *", () => {
  console.log("⏳ Running daily cron job...");
  processMaturedSavings();
});

module.exports = { processMaturedSavings };
