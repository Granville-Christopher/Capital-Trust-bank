const cron = require("node-cron");
const mongoose = require("mongoose");
const Loan = require("../models/usermodels/loans");
const LoanHistory = require("../models/usermodels/loanhistory");
const User = require("../models/usermodels/userSignup");
const sendEmail = require("../config/loanremindermailer");

cron.schedule("0 0 * * *", async () => {
  console.log("⏰ [CRON] Running daily loan reminder & default check...");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const today = new Date();

    const reminderDate = new Date();
    reminderDate.setDate(today.getDate() + 3);

    const dueSoonLoans = await Loan.find({
      status: "approved",
      dueDate: { $lte: reminderDate, $gte: today },
    }).session(session);

    for (const loan of dueSoonLoans) {
      const user = await User.findById(loan.userId).session(session);
      if (!user || !user.email) continue;

      const textVersion = `Hello ${user.fullName || "User"},
        Your loan of $${loan.amount} is due in 3 days.
        Please make arrangements to repay by ${loan.dueDate.toDateString()} to avoid penalties and credit score impact.`;

      const htmlVersion = `
        <p style="font-size: 16px; color: #374151;">
          Hello <strong>${user.fullName || "User"}</strong>,
        </p>
        <p style="font-size: 15px; color: #374151;">
          This is a friendly reminder that your loan of 
          <strong style="color:#2563eb;">$${
            loan.amount
          }</strong> is due in 3 days.
        </p>
        <p style="font-size: 15px; color: #374151;">
          Please make arrangements to repay by <strong>${loan.dueDate.toDateString()}</strong> to avoid penalties and credit score impact.
        </p>
        <p style="margin-top: 20px; font-size: 14px; color: #111827;">
          Thank you,<br><strong>CTBank Loans Team</strong>
        </p>
      `;

      await sendEmail(
        user.email,
        "⚠️ Loan Payment Reminder",
        textVersion,
        htmlVersion
      );
      console.log(
        `📩 Reminder email sent to ${user.email} for loan ${loan._id}`
      );
    }

    const overdueLoans = await Loan.find({
      status: "approved",
      dueDate: { $lt: today },
    }).session(session);

    for (const loan of overdueLoans) {
      const user = await User.findById(loan.userId).session(session);
      if (!user) continue;

      loan.status = "defaulted";
      await loan.save({ session });

      user.CreditScore = Math.max(user.CreditScore - 30, 300);
      await user.save({ session });

      await LoanHistory.create(
        [
          {
            userId: loan.userId,
            loanId: loan._id,
            type: "loan_default",
            amount: loan.totalRepayment - (loan.amountRepaid || 0),
            details: `Loan defaulted. Remaining balance: $${(
              loan.totalRepayment - (loan.amountRepaid || 0)
            ).toFixed(2)}`,
          },
        ],
        { session }
      );

      const textVersion = `Hello ${user.fullName || "User"},
        Your loan of $${
          loan.amount
        } has defaulted as of ${loan.dueDate.toDateString()}.
        Your credit score has been reduced by 30 points.
        Remaining Balance: $${(
          loan.totalRepayment - (loan.amountRepaid || 0)
        ).toFixed(2)}.`;

      const htmlVersion = `
        <p style="font-size: 16px; color: #374151;">
          Hello <strong>${user.fullName || "User"}</strong>,
        </p>
        <p style="font-size: 15px; color: #b91c1c;">
          ⚠️ Your loan of <strong>$${
            loan.amount
          }</strong> has <strong>defaulted</strong> as of ${loan.dueDate.toDateString()}.
        </p>
        <p style="font-size: 15px; color: #374151;">
          Your credit score has been reduced by <strong>30 points</strong>.
          To restore your score and avoid further penalties, please contact our support team immediately.
        </p>
        <p style="font-size: 15px; color: #111827;">
          Remaining Balance: <strong style="color:#b91c1c;">$${(
            loan.totalRepayment - (loan.amountRepaid || 0)
          ).toFixed(2)}</strong>
        </p>
        <p style="margin-top: 20px; font-size: 14px; color: #111827;">
          Thank you,<br><strong>CTBank Loans Team</strong>
        </p>
      `;

      await sendEmail(
        user.email,
        "❌ Loan Default Notice",
        textVersion,
        htmlVersion
      );
      console.log(
        `📩 Default notice sent to ${user.email} for loan ${loan._id}`
      );
    }

    await session.commitTransaction();
    session.endSession();
    console.log("✅ [CRON] Loan reminder & default job completed.");
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("🔥 [CRON ERROR] Loan job failed:", error);
  }
});
