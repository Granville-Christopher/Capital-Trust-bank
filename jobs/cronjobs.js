const cron = require("node-cron");
const Savings = require("../models/usermodels/savings");
const User = require("../models/usermodels/userSignup");
const CreditScoreHistory = require("../models/usermodels/creditscore");

async function processMaturedSavings() {
  try {
    const now = new Date();

    const maturedSavings = await Savings.find({
      maturityDate: { $lte: now },
      status: { $ne: "completed" },
    });

    for (const saving of maturedSavings) {
      const user = await User.findById(saving.userId);
      if (user) {
        user.AccountBalance += saving.amount + saving.totalInterest;

        const boostAmount = 10;
        const oldScore = user.CreditScore;
        const newScore = Math.min(user.CreditScore + boostAmount, 900);

        user.CreditScore = newScore;
        await user.save();

        await CreditScoreHistory.create({
          userId: user._id,
          change: boostAmount,
          reason: "Savings matured successfully",
          previousScore: oldScore,
          newScore: newScore,
        });

        saving.status = "completed";
        saving.completedAt = now;
        await saving.save();
      }
    }

    console.log(
      `✅ Processed ${maturedSavings.length} matured savings at`,
      now.toISOString()
    );
  } catch (error) {
    console.error("❌ Cron Job Error:", error);
  }
}

cron.schedule("0 0 * * *", () => {
  console.log("⏳ Running daily cron job...");
  processMaturedSavings();
});

module.exports = { processMaturedSavings };
