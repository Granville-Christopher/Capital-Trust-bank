const cron = require("node-cron");
const Savings = require("../models/usermodels/savings");
const User = require("../models/usermodels/userSignup");
const CreditScoreHistory = require("../models/usermodels/creditscore");
const Notification = require("../models/usermodels/notifications");
const { sendEmail } = require("../config/loanremindermailer");

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
        const totalMatured = saving.amount + saving.totalInterest;
        user.AccountBalance += totalMatured;

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

        // Create notification
        const maturityMessage = `Your savings plan has matured! $${totalMatured.toFixed(2)} (Principal: $${saving.amount.toFixed(2)} + Interest: $${saving.totalInterest.toFixed(2)}) has been credited to your account. Your credit score has increased by ${boostAmount} points.`;
        await Notification.create({
          userId: user._id,
          type: "success",
          message: maturityMessage,
          relatedEntity: saving._id,
          read: false,
        });

        // Send email notification
        const subject = "Savings Plan Matured - Funds Credited";
        const text = maturityMessage;
        const htmlContent = `
          <p style="font-size: 16px; color: #374151;">Dear <strong>${user.Name}</strong>,</p>
          <p style="font-size: 15px; color: #374151;">
            Congratulations! Your savings plan has reached maturity and the funds have been successfully credited to your account.
          </p>
          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 0; font-size: 14px; color: #059669;"><strong>Maturity Details:</strong></p>
            <p style="margin: 5px 0; font-size: 14px; color: #374151;">Principal Amount: <strong>$${saving.amount.toFixed(2)}</strong></p>
            <p style="margin: 5px 0; font-size: 14px; color: #374151;">Total Interest Earned: <strong>$${saving.totalInterest.toFixed(2)}</strong></p>
            <p style="margin: 5px 0; font-size: 14px; color: #059669;">Total Credited: <strong>$${totalMatured.toFixed(2)}</strong></p>
            <p style="margin: 5px 0; font-size: 14px; color: #374151;">New Account Balance: <strong>$${user.AccountBalance.toFixed(2)}</strong></p>
            <p style="margin: 5px 0; font-size: 14px; color: #059669;">Credit Score Bonus: <strong>+${boostAmount} points</strong></p>
          </div>
          <p style="font-size: 15px; color: #374151;">
            Thank you for saving with us. Your funds are now available in your account for withdrawal or further investment.
          </p>
          <p style="margin-top: 20px; font-size: 14px; color: #111827;">
            Thank you for banking with us.<br><strong>CTBank Team</strong>
          </p>
        `;
        await sendEmail(user.Email, subject, text, htmlContent);
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

const DAILY_INTEREST_RATE = 0.1 / 365;

async function accrueDailyInterest() {
  try {
    const activeSavings = await Savings.find({ status: "active" });

    for (const s of activeSavings) {
      const interest = s.amount * DAILY_INTEREST_RATE;
      s.interestBalance += interest;
      s.totalInterest += interest;
      await s.save();
    }

    console.log(`✅ Accrued interest for ${activeSavings.length} savings`);
  } catch (err) {
    console.error("❌ Interest Accrual Error:", err);
  }
}


cron.schedule("0 0 * * *", () => {
  console.log("📅 Running daily interest accrual job...");
  accrueDailyInterest();
});

module.exports = { processMaturedSavings, accrueDailyInterest };
