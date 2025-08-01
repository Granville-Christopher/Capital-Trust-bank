const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const Loan = require("../../models/usermodels/loans");
const LoanHistory = require("../../models/usermodels/loanhistory");
const Transactions = require("../../models/usermodels/transactionhistory");
const User = require("../../models/usermodels/userSignup");

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
          statusNote: `Loan request of $${amount} for ${term} days has been submitted.`,
        },
      ],
      { session }
    );

    const baseLoan = getBaseLoanAmount(user.CreditScore);
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

    if (amount > remainingEligibility) {
      await LoanHistory.create(
        [
          {
            userId,
            action: "rejected",
            amount,
            reason,
            term,
            guarantor,
            guarantorContact,
            statusNote: `Loan request of $${amount} rejected. Eligible only for $${remainingEligibility.toFixed(
              2
            )}.`,
          },
        ],
        { session }
      );

      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        error: `You only qualify for up to $${remainingEligibility.toFixed(
          2
        )} more based on your credit score and transaction history.`,
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
    const userId = req.session.user.id;

    const user = await User.findById(userId).session(session);
    const loan = await Loan.findOne({ _id: loanId, userId }).session(session);

    if (!loan) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "Loan not found." });
    }

    if (loan.status === "repaid") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: "Loan already repaid." });
    }

    if (user.AccountBalance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ error: "Insufficient balance to repay loan." });
    }

    user.AccountBalance -= amount;

    const remainingInterest = loan.interest - (loan.interestPaid || 0);
    const remainingPrincipal = loan.amount - (loan.principalPaid || 0);
    const totalRemaining = remainingInterest + remainingPrincipal;

    let overpayment = 0;
    let repaymentAmount = amount;

    if (amount > totalRemaining) {
      overpayment = amount - totalRemaining;
      repaymentAmount = totalRemaining;
      user.AccountBalance += overpayment;
    }

    let interestPayment = 0;
    let principalPayment = 0;

    if (repaymentAmount <= remainingInterest) {
      interestPayment = repaymentAmount;
    } else {
      interestPayment = remainingInterest;
      principalPayment = repaymentAmount - remainingInterest;
    }

    loan.interestPaid = (loan.interestPaid || 0) + interestPayment;
    loan.principalPaid = (loan.principalPaid || 0) + principalPayment;
    loan.amountRepaid = (loan.amountRepaid || 0) + repaymentAmount;

    if (loan.amountRepaid >= loan.totalRepayment) {
      loan.status = "repaid";
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
          amount: repaymentAmount,
          reason: loan.reason,
          term: loan.term,
          guarantor: loan.guarantor,
          guarantorContact: loan.guarantorContact,
          statusNote: `Repayment of $${repaymentAmount} made. Principal: $${principalPayment.toFixed(
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

    return res.status(200).json({
      message:
        overpayment > 0
          ? `Loan repayment successful. You overpaid by $${overpayment}, which has been refunded to your balance.`
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

    const activeLoan = await Loan.findOne({
      userId,
      status: { $in: ["approved", "pending"] },
    }).sort({ createdAt: -1 });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    const baseLoan = getBaseLoanAmount(user.CreditScore);
    const rolling30Days = await getRolling30DaysTransactions(userId);
    const boost = rolling30Days * 0.1;
    const eligibleAmount = baseLoan + boost;

    const loanRemaining = activeLoan
      ? (activeLoan.totalRepayment || 0) - (activeLoan.amountRepaid || 0)
      : 0;

    const availableCredit =
      eligibleAmount - (activeLoan ? activeLoan.amount : 0);

    res.status(200).json({
      eligibleAmount: eligibleAmount.toFixed(2),
      availableCredit: availableCredit.toFixed(2),
      activeLoan: activeLoan
        ? {
            amount: activeLoan.amount,
            status: activeLoan.status,
            dueDate: activeLoan.dueDate,
            remaining: loanRemaining,
            loanId: activeLoan._id,
          }
        : null,
    });
  } catch (error) {
    console.error("❌ Loan Details Fetch Error:", error);
    res.status(500).json({ error: "Server error fetching loan details." });
  }
};

module.exports = {
  checkLoanEligibility,
  requestLoan,
  repayLoan,
  getLoanDetails,
};
