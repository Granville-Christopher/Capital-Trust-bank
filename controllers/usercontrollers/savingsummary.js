const mongoose = require("mongoose");
const Savings = require("../../models/usermodels/savings");
const User = require("../../models/usermodels/userSignup");
const SavingsHistory = require("../../models/usermodels/savingshistory");
const Notification = require("../../models/usermodels/notifications");
const sendEmail = require("../../config/loanremindermailer");

const DAILY_INTEREST_RATE = 0.1 / 365;

const getSavingsSummary = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.session.user.id;
    const savings = await Savings.find({ userId });

    if (!savings || savings.length === 0) {
      return res.status(200).json({
        totalPrincipal: 0,
        totalInterest: 0,
        todayInterest: 0,
      });
    }

    let totalPrincipal = 0;
    let totalInterest = 0;
    let todayInterest = 0;

    savings.forEach((s) => {
      totalPrincipal += s.amount;
      totalInterest += s.totalInterest;
      todayInterest += s.amount * DAILY_INTEREST_RATE;
    });

    res.status(200).json({
      totalPrincipal: totalPrincipal.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
      todayInterest: todayInterest.toFixed(2),
    });
  } catch (error) {
    console.error("❌ Summary Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const compoundAllSavings = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.session.user || !req.session.user.id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.session.user.id;

    const savings = await Savings.find({ userId }).session(session);

    if (!savings || savings.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "No savings found" });
    }

    const totalInterestToCompound = savings.reduce(
      (sum, s) => sum + s.interestBalance,
      0
    );

    if (totalInterestToCompound <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ error: "No interest available to compound at this time." });
    }

    let compoundedLogs = [];

    for (const s of savings) {
      if (s.interestBalance > 0) {
        const interest = s.interestBalance;

        s.amount += interest;
        s.interestBalance = 0;
        await s.save({ session });

        compoundedLogs.push({
          userId,
          type: "compound_interest",
          amount: interest,
          balanceAfter: s.amount,
          referenceId: s.referenceId,
        });
      }
    }

    if (compoundedLogs.length > 0) {
      await SavingsHistory.insertMany(compoundedLogs, { session });
    }

    await session.commitTransaction();
    session.endSession();

    // Get user for email
    const user = await User.findById(userId);
    if (user && totalInterestToCompound > 0) {
      // Create notification
      const compoundMessage = `You have successfully compounded $${totalInterestToCompound.toFixed(2)} interest into your savings account.`;
      await Notification.create({
        userId,
        type: "success",
        message: compoundMessage,
      });

      // Send email
      const subject = "Savings Interest Compounded";
      const text = compoundMessage;
      const htmlContent = `
        <p style="font-size: 16px; color: #374151;">Dear <strong>${user.Name}</strong>,</p>
        <p style="font-size: 15px; color: #374151;">
          Your interest has been successfully compounded into your savings account.
        </p>
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <p style="margin: 0; font-size: 14px; color: #1e40af;"><strong>Compounding Details:</strong></p>
          <p style="margin: 5px 0; font-size: 14px; color: #374151;">Interest Compounded: <strong>$${totalInterestToCompound.toFixed(2)}</strong></p>
          <p style="margin: 5px 0; font-size: 14px; color: #374151;">Savings Plans Updated: <strong>${compoundedLogs.length}</strong></p>
        </div>
        <p style="font-size: 15px; color: #374151;">
          The compounded interest has been added to your savings principal, which will help your savings grow faster through compound interest.
        </p>
        <p style="margin-top: 20px; font-size: 14px; color: #111827;">
          Thank you for banking with us.<br><strong>CTBank Team</strong>
        </p>
      `;
      sendEmail(user.Email, subject, text, htmlContent).catch(e => console.error("Email failed:", e.message));
    }

    res.status(200).json({
      message: `Successfully compounded $${totalInterestToCompound.toFixed(
        2
      )} into your savings.`,
      totalCompounded: totalInterestToCompound,
      logsCreated: compoundedLogs.length,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Compound All Error (Transaction):", error);
    res.status(500).json({ error: "Server error. Transaction rolled back." });
  }
};

const withdrawAllSavings = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.session.user || !req.session.user.id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.session.user.id;
    const savings = await Savings.find({ userId }).session(session);
    const user = await User.findById(userId).session(session);

    if (!savings || savings.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "No savings found" });
    }

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "User not found" });
    }

    let totalWithdrawableInterest = savings.reduce(
      (sum, s) => sum + s.interestBalance,
      0
    );

    if (totalWithdrawableInterest <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ error: "No interest available to withdraw at this time." });
    }

    for (const s of savings) {
      s.interestBalance = 0;
      await s.save({ session });

      SavingsHistory.create({
        userId,
        type: "withdraw_interest",
        amount: s.interestBalance,
        balanceAfter: user.AccountBalance,
        referenceId: s.referenceId,
      });
    }

    user.AccountBalance += totalWithdrawableInterest;
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Create notification
    const withdrawalMessage = `You have successfully withdrawn $${totalWithdrawableInterest.toFixed(2)} interest from all your savings accounts. Your new balance is $${user.AccountBalance.toFixed(2)}.`;
    await Notification.create({
      userId,
      type: "success",
      message: withdrawalMessage,
    });

    // Send email
    const subject = "Savings Interest Withdrawal Successful";
    const text = withdrawalMessage;
    const htmlContent = `
      <p style="font-size: 16px; color: #374151;">Dear <strong>${user.Name}</strong>,</p>
      <p style="font-size: 15px; color: #374151;">
        Your interest withdrawal from all savings accounts has been processed successfully.
      </p>
      <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb;">
        <p style="margin: 0; font-size: 14px; color: #1e40af;"><strong>Withdrawal Details:</strong></p>
        <p style="margin: 5px 0; font-size: 14px; color: #374151;">Total Interest Withdrawn: <strong>$${totalWithdrawableInterest.toFixed(2)}</strong></p>
        <p style="margin: 5px 0; font-size: 14px; color: #374151;">New Account Balance: <strong>$${user.AccountBalance.toFixed(2)}</strong></p>
      </div>
      <p style="font-size: 15px; color: #374151;">
        The funds have been successfully credited to your account and are now available for use.
      </p>
      <p style="margin-top: 20px; font-size: 14px; color: #111827;">
        Thank you for banking with us.<br><strong>CTBank Team</strong>
      </p>
    `;
    sendEmail(user.Email, subject, text, htmlContent).catch(e => console.error("Email failed:", e.message));

    return res.status(200).json({
      message: `Successfully withdrew $${totalWithdrawableInterest.toFixed(
        2
      )} interest to your account.`,
      totalWithdrawn: totalWithdrawableInterest,
      newBalance: user.AccountBalance,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Withdraw All Error (Transaction):", error);
    res.status(500).json({ error: "Server error. Transaction rolled back." });
  }
};

module.exports = {
  getSavingsSummary,
  compoundAllSavings,
  withdrawAllSavings,
};
