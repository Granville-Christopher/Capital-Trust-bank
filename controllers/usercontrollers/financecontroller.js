const Savings = require("../../models/usermodels/savings");
const User = require("../../models/usermodels/userSignup");
const SavingsHistory = require("../../models/usermodels/savingshistory");
const { body, validationResult } = require("express-validator");
const escape = require("escape-html");
const CreditScoreHistory = require("../../models/usermodels/creditscore");
const mongoose = require("mongoose");

function generateNumericReferenceId() {
  const timestamp = Date.now().toString();
  const remainingDigits = 18 - timestamp.length;

  let randomPart = "";
  for (let i = 0; i < remainingDigits; i++) {
    randomPart += Math.floor(Math.random() * 10);
  }

  return timestamp + randomPart;
}

const depositToSavings = [
  body("amount")
    .isLength({ min: 2 })
    .withMessage("Value must not be less than 100")
    .trim()
    .escape(),

  async (req, res) => {
    if (req.sanitize) {
      req.body.amount = req.sanitize(req.body.amount);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { amount, savingsTerm } = req.body;

      if (!req.session.user || !req.session.user.id) {
        return res.status(401).json({ error: "Authentication required." });
      }

      const userId = req.session.user.id;
      const safeAmount = parseFloat(escape(amount));
      const safeSavingsTerm = parseInt(escape(savingsTerm));

      if (isNaN(safeAmount) || safeAmount <= 0) {
        return res.status(400).json({ error: "Invalid amount." });
      }

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found." });

      if (user.AccountBalance < safeAmount) {
        return res.status(400).json({ error: "Insufficient funds." });
      }

      user.AccountBalance -= safeAmount;

      const creditBoost = 2;
      const oldCreditScore = user.CreditScore;
      user.CreditScore = Math.min(user.CreditScore + creditBoost, 900);

      await user.save();

      const maturityDate = new Date();
      maturityDate.setDate(maturityDate.getDate() + safeSavingsTerm);

      const referenceId = generateNumericReferenceId();

      const newSavings = new Savings({
        userId,
        amount: safeAmount,
        savingsTerm: safeSavingsTerm,
        referenceId,
        totalInterest: 0,
        interestBalance: 0,
        createdAt: new Date(),
        maturityDate,
      });

      await newSavings.save();

      await SavingsHistory.create({
        userId,
        type: "deposit",
        amount: safeAmount,
        balanceAfter: safeAmount,
        referenceId,
      });

      await CreditScoreHistory.create({
        userId,
        change: creditBoost,
        reason: "User deposited to savings",
        previousScore: oldCreditScore,
        newScore: user.CreditScore,
      });

      res.status(200).json({
        message: "Deposit successful",
        newSavingsAmount: safeAmount,
        newUserBalance: user.AccountBalance,
        newCreditScore: user.CreditScore,
        referenceId,
      });
    } catch (error) {
      console.error("❌ Deposit Error:", error);
      res.status(500).json({ error: "Server error" });
    }
  },
];

const withdrawInterest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.session.user || !req.session.user.id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.session.user.id;

    const saving = await Savings.findOne({
      _id: req.params.id,
      userId,
    }).session(session);
    if (!saving) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "No saving plan found" });
    }

    if (saving.interestBalance <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ error: "No interest matured for withdrawal." });
    }

    const withdrawnAmount = saving.interestBalance;

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "User not found." });
    }

    user.AccountBalance += withdrawnAmount;

    saving.interestBalance = 0;

    await saving.save({ session });
    await user.save({ session });

    await SavingsHistory.create(
      [
        {
          userId,
          type: "withdraw_interest",
          amount: withdrawnAmount,
          balanceAfter: saving.amount,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: `Successfully withdrew $${withdrawnAmount.toFixed(2)} interest.`,
      withdrawnAmount,
      newBalance: user.AccountBalance,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Withdraw Interest Error (Transaction):", error);
    res.status(500).json({ error: "Server error. Transaction rolled back." });
  }
};

const compoundInterest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.session.user || !req.session.user.id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.session.user.id;

    const saving = await Savings.findOne({
      _id: req.params.id,
      userId,
    }).session(session);
    if (!saving) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "No saving plan found" });
    }

    if (saving.interestBalance <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ error: "No interest available to compound." });
    }

    const compoundedAmount = saving.interestBalance;
    saving.amount += compoundedAmount;

    saving.interestBalance = 0;

    await saving.save({ session });

    await SavingsHistory.create(
      [
        {
          userId,
          type: "compound_interest",
          amount: compoundedAmount,
          balanceAfter: saving.amount,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: `Successfully compounded $${compoundedAmount.toFixed(
        2
      )} into your savings.`,
      newPrincipal: saving.amount,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Compound Interest Error (Transaction):", error);
    res.status(500).json({ error: "Server error. Transaction rolled back." });
  }
};

const viewSavings = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.session.user.id;
    const savings = await Savings.find({ userId });

    if (!savings || savings.length === 0) {
      return res.status(404).json({ error: "No savings found" });
    }

    const DAILY_INTEREST_RATE = 0.1 / 365;

    const savingsData = savings.map((s) => ({
      principal: s.amount.toFixed(2),
      totalInterest: s.totalInterest.toFixed(2),
      interestBalance: s.interestBalance.toFixed(2),
      todayInterest: (s.amount * DAILY_INTEREST_RATE).toFixed(2),
      id: s._id,
    }));

    res.status(200).json(savingsData);
  } catch (error) {
    console.error("❌ View Savings Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const cancelSavings = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.session.user || !req.session.user.id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({ error: "Authentication required." });
    }

    const userId = req.session.user.id;

    const saving = await Savings.findOne({
      _id: req.params.id,
      userId,
    }).session(session);
    if (!saving) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "No savings found." });
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "User not found." });
    }

    const oldScore = user.CreditScore;

    const principalAmount = saving.amount;
    user.AccountBalance += principalAmount;

    const creditDeduction = 5;
    user.CreditScore = Math.max(oldScore - creditDeduction, 300);

    await SavingsHistory.create(
      [
        {
          userId,
          type: "cancel",
          amount: principalAmount,
          balanceAfter: user.AccountBalance,
          referenceId: saving.referenceId,
        },
      ],
      { session }
    );

    await CreditScoreHistory.create(
      [
        {
          userId,
          change: -creditDeduction,
          reason: "Saving plan canceled early (interest forfeited)",
          newScore: user.CreditScore,
          previousScore: oldScore,
        },
      ],
      { session }
    );

    await Savings.deleteOne({ _id: req.params.id, userId }).session(session);

    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message:
        "Saving plan canceled successfully. Interest removed. Principal refunded to your account.",
      refundedAmount: principalAmount,
      newBalance: user.AccountBalance,
      newCreditScore: user.CreditScore,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Cancel Saving Error (Transaction):", error);
    return res
      .status(500)
      .json({ error: "Server error. Transaction rolled back." });
  }
};

const getCreditScore = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const userId = req.session.user.id;
    const user = await User.findById(userId).select("CreditScore");

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json({
      creditScore: user.CreditScore,
    });
  } catch (error) {
    console.error("❌ Credit Score Fetch Error:", error);
    return res.status(500).json({ error: "Server error." });
  }
};

module.exports = {
  depositToSavings,
  withdrawInterest,
  compoundInterest,
  viewSavings,
  cancelSavings,
  getCreditScore,
};
