const cron = require("node-cron");
const Savings = require("../../models/usermodels/savings");


const ANNUAL_INTEREST_RATE = 0.1;
const DAILY_INTEREST_RATE = ANNUAL_INTEREST_RATE / 365;

cron.schedule("0 0 * * *", async () => {
  console.log("📆 Running daily savings interest job...");

  try {
    const allSavings = await Savings.find();

    for (let saving of allSavings) {
      const today = new Date();
      const lastDate = saving.lastInterestDate || saving.createdAt;

      if (lastDate.toDateString() === today.toDateString()) continue;

      const dailyInterest = saving.amount * DAILY_INTEREST_RATE;

      saving.totalInterest += dailyInterest;
      saving.interestBalance += dailyInterest;
      saving.lastInterestDate = today;

      await saving.save();

      console.log(
        `✅ Interest of ${dailyInterest.toFixed(2)} added for saving ID: ${
          saving._id
        }`
      );
    }

    console.log("🎉 Daily savings interest job completed.");
  } catch (error) {
    console.error("❌ Error running interest job:", error);
  }
});
