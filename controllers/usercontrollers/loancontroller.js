const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const Loan = require("../../models/usermodels/loans");
const LoanHistory = require("../../models/usermodels/loanhistory");
const Transactions = require("../../models/usermodels/transactionhistory");
const User = require("../../models/usermodels/userSignup");
const Notification = require("../../models/usermodels/notifications");
const sendEmail = require("../../config/loanremindermailer");

const CREDIT_SCORE_BASE = [
  { min: 300, max: 500, base: 0 },
  { min: 501, max: 650, base: 100 },
  { min: 651, max: 750, base: 300 },
  { min: 751, max: 900, base: 500 },
];

const LOAN_INTEREST_RATES = {
  7: 0.05,
  10: 0.05,
  30: 0.2,
  90: 0.25,
  180: 0.3,
  365: 0.4,
};

function getBaseLoanAmount(creditScore) {
  const tier = CREDIT_SCORE_BASE.find(
    (t) => creditScore >= t.min && creditScore <= t.max
  );
  return tier ? tier.base : 0;
}

async function getRolling30DaysTransactions(userId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await Transactions.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
  ]);

  return result.length > 0 ? result[0].totalAmount : 0;
}

const checkLoanEligibility = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const userId = req.session.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    const baseLoan = getBaseLoanAmount(user.CreditScore);
    if (baseLoan === 0) {
      return res
        .status(400)
        .json({ message: "Your credit score is too low for a loan." });
    }

    const rolling30Days = await getRolling30DaysTransactions(userId);
    const boost = rolling30Days * 0.1;
    const eligibleAmount = baseLoan + boost;

    const activeLoans = await Loan.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: { $in: ["approved", "pending"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const activeLoanTotal = activeLoans.length ? activeLoans[0].total : 0;
    const remainingEligibility = eligibleAmount - activeLoanTotal;

    return res.status(200).json({
      eligibleAmount: eligibleAmount.toFixed(2),
      remainingEligibility: remainingEligibility.toFixed(2),
      activeLoanTotal,
      baseLoan,
      transactionBoost: boost.toFixed(2),
      creditScore: user.CreditScore,
    });
  } catch (error) {
    console.error("❌ Loan Eligibility Error:", error);
    return res
      .status(500)
      .json({ error: "Server error calculating loan eligibility." });
  }
};

const requestLoan = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await body("amount")
      .isFloat({ gt: 0 })
      .withMessage("Amount must be greater than 0")
      .run(req);
    await body("term")
      .isInt({ gt: 0 })
      .withMessage("Loan term must be a number")
      .run(req);
    await body("reason")
      .trim()
      .escape()
      .notEmpty()
      .withMessage("Reason is required")
      .run(req);
    await body("guarantor")
      .trim()
      .escape()
      .notEmpty()
      .withMessage("Guarantor is required")
      .run(req);
    await body("guarantorContact")
      .trim()
      .escape()
      .notEmpty()
      .withMessage("Guarantor contact is required")
      .run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.session.user || !req.session.user.id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({ error: "Authentication required." });
    }

    const { amount, term, reason, guarantor, guarantorContact } = req.body;
    const userId = req.session.user.id;

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "User not found." });
    }

    await LoanHistory.create(
      [
        {
          userId,
          action: "requested",
          amount,
          reason,
          term,
          guarantor,
          guarantorContact,
          statusNote: `Loan request of $${amount} for ${term} days submitted.`,
        },
      ],
      { session }
    );

    const baseLoan = getBaseLoanAmount(user.CreditScore);
    const rolling30Days = await getRolling30DaysTransactions(userId);
    const boost = rolling30Days * 0.1;
    const eligibleAmount = baseLoan + boost;

    const activeLoans = await Loan.find({
      userId,
      status: { $in: ["approved", "pending"] },
    }).session(session);

    const activeLoanTotal = activeLoans.reduce(
      (sum, loan) => sum + loan.amount,
      0
    );
    const remainingEligibility = eligibleAmount - activeLoanTotal;

    if (activeLoans.length >= 2) {
      await LoanHistory.create(
        [
          {
            userId,
            loanId: null,
            action: "rejected",
            amount,
            reason,
            term,
            guarantor,
            guarantorContact,
            statusNote: `Loan request of $${amount} rejected — user already has 2 active loans.`,
          },
        ],
        { session }
      );

      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        error:
          "You already have 2 active loans. Please repay one or both before requesting another loan.",
      });
    }

    let maxAllowed = remainingEligibility;
    if (activeLoans.length === 1) {
      maxAllowed = remainingEligibility * 0.5;
    }

    if (amount > maxAllowed) {
      await LoanHistory.create(
        [
          {
            userId,
            loanId: null,
            action: "rejected",
            amount,
            reason,
            term,
            guarantor,
            guarantorContact,
            statusNote: `Loan request of $${amount} rejected. Max you can take now is $${maxAllowed.toFixed(
              2
            )}.`,
          },
        ],
        { session }
      );

      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        error: `You only qualify for up to $${maxAllowed.toFixed(
          2
        )} at this time.`,
      });
    }

    const interestRate = LOAN_INTEREST_RATES[term] || 0.4;
    const interest = amount * interestRate;
    const totalRepayment = amount + interest;

    const loan = await Loan.create(
      [
        {
          userId,
          amount,
          interest,
          totalRepayment,
          interestRate: interestRate * 100,
          term,
          reason,
          guarantor,
          guarantorContact,
          amountRepaid: 0,
          principalPaid: 0,
          interestPaid: 0,
          status: "approved",
          dueDate: new Date(Date.now() + term * 24 * 60 * 60 * 1000),
        },
      ],
      { session }
    );

    user.AccountBalance += amount;
    await user.save({ session });

    await LoanHistory.create(
      [
        {
          userId,
          loanId: loan[0]._id,
          action: "approved",
          amount,
          reason,
          term,
          guarantor,
          guarantorContact,
          statusNote: `Loan of $${amount} approved for ${term} days.`,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // Send notification and email for loan approval
    const approvalMessage = `Your loan of $${amount} has been approved and credited to your account.`;
    await Notification.create({
      userId,
      type: "success",
      message: approvalMessage,
    });
    const subject = "Loan Approved";
    const text = approvalMessage;
    const htmlContent = `<p>Dear ${user.Name},</p><p>${approvalMessage}</p><p>Thank you for banking with us.</p>`;
    sendEmail(user.Email, subject, text, htmlContent).catch(e => console.error("Email failed:", e.message));

    return res.status(200).json({
      message: "Loan approved and credited to your account.",
      loan: loan[0],
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Loan Request Error:", error);
    return res
      .status(500)
      .json({ error: "Loan request failed. Transaction rolled back." });
  }
};

const repayLoan = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await body("loanId").notEmpty().withMessage("Loan ID is required").run(req);
    await body("amount")
      .isFloat({ gt: 0 })
      .withMessage("Amount must be greater than 0")
      .run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.session.user || !req.session.user.id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({ error: "Authentication required." });
    }

    const { loanId, amount } = req.body;
    const repaymentAmount = Number(amount);
    const userId = req.session.user.id;

    const user = await User.findById(userId).session(session);
    const loan = await Loan.findOne({ _id: loanId, userId }).session(session);

    if (!loan) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "Loan not found." });
    }

    if (!loan.totalRepayment) {
      loan.totalRepayment =
        loan.amount + (loan.amount * loan.interestRate) / 100;
    }

    if (loan.status === "repaid") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: "Loan already repaid." });
    }

    if (user.AccountBalance < repaymentAmount) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ error: "Insufficient balance to repay loan." });
    }

    const totalRepayment = Number(loan.totalRepayment) || 0;
    const interestPaid = Number(loan.interestPaid) || 0;
    const principalPaid = Number(loan.principalPaid) || 0;
    const loanAmount = Number(loan.amount) || 0;
    const interestRate = Number(loan.interestRate) || 0;

    const totalInterest = (loanAmount * interestRate) / 100;
    const remainingInterest = Math.max(totalInterest - interestPaid, 0);
    const remainingPrincipal = Math.max(loanAmount - principalPaid, 0);
    const totalRemaining = remainingInterest + remainingPrincipal;

    let overpayment = 0;
    let amountToApply = repaymentAmount;

    if (repaymentAmount > totalRemaining) {
      overpayment = repaymentAmount - totalRemaining;
      amountToApply = totalRemaining;
      user.AccountBalance += overpayment;
    }

    user.AccountBalance -= repaymentAmount;

    let interestPayment = 0;
    let principalPayment = 0;

    if (amountToApply <= remainingInterest) {
      interestPayment = amountToApply;
    } else {
      interestPayment = remainingInterest;
      principalPayment = amountToApply - remainingInterest;
    }

    loan.interestPaid = interestPaid + interestPayment;
    loan.principalPaid = principalPaid + principalPayment;

    if (loan.interestPaid + loan.principalPaid >= totalRepayment) {
      loan.status = "repaid";
      loan.interestPaid = totalInterest;
      loan.principalPaid = loanAmount;
      user.CreditScore = Math.min(user.CreditScore + 10, 900);
    }

    await loan.save({ session });
    await user.save({ session });

    await LoanHistory.create(
      [
        {
          userId,
          loanId: loan._id,
          action: "repaid",
          amount: amountToApply,
          reason: loan.reason,
          term: loan.term,
          guarantor: loan.guarantor,
          guarantorContact: loan.guarantorContact,
          statusNote: `Repayment of $${amountToApply} made. Principal: $${principalPayment.toFixed(
            2
          )}, Interest: $${interestPayment.toFixed(2)}.`,
        },
      ],
      { session }
    );

    if (overpayment > 0) {
      await LoanHistory.create(
        [
          {
            userId,
            loanId: loan._id,
            action: "refund",
            amount: overpayment,
            statusNote: `User overpaid by $${overpayment}. Refunded to account balance.`,
          },
        ],
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    // Send notification and email for loan repayment
    const isFullyRepaid = loan.status === "repaid";
    const repaymentMessage = isFullyRepaid
      ? `Your loan has been fully repaid! Thank you for your timely payment. Your credit score has been increased by 10 points.`
      : `Your loan repayment of $${repaymentAmount.toFixed(2)} has been processed successfully. Principal: $${principalPayment.toFixed(2)}, Interest: $${interestPayment.toFixed(2)}.${overpayment > 0 ? ` Overpayment of $${overpayment.toFixed(2)} has been refunded to your account.` : ''}`;
    
    await Notification.create({
      userId,
      type: "success",
      message: repaymentMessage,
    });
    
    const subject = isFullyRepaid ? "Loan Fully Repaid - Congratulations!" : "Loan Repayment Successful";
    const text = repaymentMessage;
    const htmlContent = `
      <p style="font-size: 16px; color: #374151;">Dear <strong>${user.Name}</strong>,</p>
      <p style="font-size: 15px; color: #374151;">
        ${isFullyRepaid ? 'Congratulations! Your loan has been fully repaid.' : 'Your loan repayment has been processed successfully.'}
      </p>
      <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb;">
        <p style="margin: 0; font-size: 14px; color: #1e40af;"><strong>Repayment Details:</strong></p>
        <p style="margin: 5px 0; font-size: 14px; color: #374151;">Amount Paid: <strong>$${repaymentAmount.toFixed(2)}</strong></p>
        <p style="margin: 5px 0; font-size: 14px; color: #374151;">Principal: <strong>$${principalPayment.toFixed(2)}</strong></p>
        <p style="margin: 5px 0; font-size: 14px; color: #374151;">Interest: <strong>$${interestPayment.toFixed(2)}</strong></p>
        ${overpayment > 0 ? `<p style="margin: 5px 0; font-size: 14px; color: #059669;">Overpayment Refunded: <strong>$${overpayment.toFixed(2)}</strong></p>` : ''}
        <p style="margin: 5px 0; font-size: 14px; color: #374151;">Remaining Balance: <strong>$${Math.max(totalRemaining - amountToApply, 0).toFixed(2)}</strong></p>
        ${isFullyRepaid ? '<p style="margin: 5px 0; font-size: 14px; color: #059669;"><strong>✓ Loan Status: Fully Repaid</strong></p>' : ''}
        ${isFullyRepaid ? '<p style="margin: 5px 0; font-size: 14px; color: #059669;"><strong>✓ Credit Score: +10 points</strong></p>' : ''}
      </div>
      <p style="font-size: 15px; color: #374151;">
        ${isFullyRepaid ? 'Thank you for your timely payment. Your credit score has been increased as a reward for completing your loan repayment.' : 'Your account balance has been updated accordingly.'}
      </p>
      <p style="margin-top: 20px; font-size: 14px; color: #111827;">
        Thank you for banking with us.<br><strong>CTBank Team</strong>
      </p>
    `;
    sendEmail(user.Email, subject, text, htmlContent).catch(e => console.error("Email failed:", e.message));

    return res.status(200).json({
      message:
        overpayment > 0
          ? `Loan repayment successful. You overpaid by $${overpayment}, which has been refunded.`
          : "Loan repayment successful.",
      breakdown: {
        principalPaid: principalPayment,
        interestPaid: interestPayment,
      },
      overpayment,
      loan,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Loan Repayment Error:", error);
    return res
      .status(500)
      .json({ error: "Loan repayment failed. Transaction rolled back." });
  }
};

const getLoanDetails = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const userId = req.session.user.id;
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ error: "User not found." });

    const loans = await Loan.find({ userId }).lean();

    const outstandingLoanTotal = loans.reduce((sum, loan) => {
      const unpaid =
        (loan.totalRepayment || 0) -
        ((loan.principalPaid || 0) + (loan.interestPaid || 0));
      return sum + (unpaid > 0 ? unpaid : 0);
    }, 0);

    const baseLoan = getBaseLoanAmount(user.CreditScore);
    const rolling30Days = await getRolling30DaysTransactions(userId);
    const boost = rolling30Days * 0.1;
    const eligibleAmount = baseLoan + boost;

    const availableCredit = eligibleAmount - outstandingLoanTotal;

    const activeLoan = loans.find((loan) =>
      ["approved", "pending"].includes(loan.status)
    );

    res.status(200).json({
      eligibleAmount,
      outstandingLoanTotal,
      availableCredit,
      activeLoan: activeLoan
        ? {
            loanId: activeLoan._id,
            remaining:
              (activeLoan.totalRepayment || 0) -
              ((activeLoan.principalPaid || 0) +
                (activeLoan.interestPaid || 0)),
            dueDate: activeLoan.dueDate,
          }
        : null,
    });
  } catch (error) {
    console.error("❌ Error fetching loan details:", error);
    res.status(500).json({ error: "Server error fetching loan details." });
  }
};

const getAllLoans = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const userId = req.session.user.id;
    const loans = await Loan.find({ userId }).sort({ createdAt: -1 });

    const formattedLoans = loans.map((loan) => ({
      id: loan._id,
      amount: loan.amount,
      interest: loan.interest,
      totalRepayment: loan.totalRepayment,
      amountRepaid: loan.principalPaid + loan.interestPaid,
      status: loan.status,
      dueDate: loan.dueDate,
      reason: loan.reason,
      outstanding:
        (loan.totalRepayment || 0) -
        ((loan.principalPaid || 0) + (loan.interestPaid || 0)),
    }));

    res.status(200).json({ loans: formattedLoans });
  } catch (error) {
    console.error("❌ Error fetching all loans:", error);
    res.status(500).json({ error: "Server error fetching loans." });
  }
};

module.exports = {
  checkLoanEligibility,
  requestLoan,
  repayLoan,
  getLoanDetails,
  getAllLoans,
};
