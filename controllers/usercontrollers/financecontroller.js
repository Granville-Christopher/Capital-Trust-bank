const Savings = require("../../models/usermodels/savings");
const User = require("../../models/usermodels/userSignup");
const SavingsHistory = require("../../models/usermodels/savingshistory");
const { body, validationResult } = require("express-validator");
const escape = require("escape-html");
const cron = require("node-cron");

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
      const safeSavingsTerm = escape(savingsTerm);

      if (isNaN(safeAmount) || safeAmount <= 0) {
        return res.status(400).json({ error: "Invalid amount." });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      if (user.AccountBalance < safeAmount) {
        return res.status(400).json({ error: "Insufficient funds." });
      }

      user.AccountBalance -= safeAmount;
      await user.save();

      const maturityDate = new Date();
      maturityDate.setDate(maturityDate.getDate() + safeSavingsTerm);

      const referenceId = generateNumericReferenceId();

      let savings = await Savings.findOne({ userId });
      if (savings) {
        savings.amount += safeAmount;
        savings.maturityDate = maturityDate;
      } else {
        savings = new Savings({
          userId,
          amount: safeAmount,
          savingsTerm: safeSavingsTerm,
          referenceId,
          totalInterest: 0,
          interestBalance: 0,
          createdAt: new Date(),
          maturityDate,
        });
      }

      await savings.save();

      await SavingsHistory.create({
        userId,
        type: "deposit",
        amount: safeAmount,
        balanceAfter: savings.amount,
        referenceId,
      });

      res.status(200).json({
        message: "Deposit successful",
        newSavingsAmount: savings.amount,
        newUserBalance: user.AccountBalance,
        referenceId,
      });
    } catch (error) {
      console.error("❌ Deposit Error:", error);
      res.status(500).json({ error: "Server error" });
    }
  },
];

const withdrawInterest = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.session.user.id;
    const savings = await Savings.findOne({ userId });
    if (!savings) {
      return res.status(404).json({ error: "No savings account found" });
    }

    if (savings.interestBalance <= 0) {
      return res
        .status(400)
        .json({ error: "No interest available to withdraw." });
    }

    await User.findByIdAndUpdate(
      userId,
      { $inc: { AccountBalance: savings.interestBalance } },
      { new: true }
    );

    const withdrawnAmount = savings.interestBalance;

    savings.interestBalance = 0;
    await savings.save();

    await SavingsHistory.create({
      userId,
      type: "withdraw_interest",
      amount: withdrawnAmount,
      balanceAfter: savings.amount,
    });

    res.status(200).json({
      message: `Successfully withdrew $${withdrawnAmount.toFixed(2)} interest.`,
      withdrawnAmount,
    });
  } catch (error) {
    console.error("❌ Withdraw Interest Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const compoundInterest = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.session.user.id;
    const savings = await Savings.findOne({ userId });
    if (!savings) {
      return res.status(404).json({ error: "No savings account found" });
    }

    if (savings.interestBalance <= 0) {
      return res
        .status(400)
        .json({ error: "No interest available to compound." });
    }

    savings.amount += savings.interestBalance;
    const compoundedAmount = savings.interestBalance;

    savings.interestBalance = 0;
    await savings.save();

    await SavingsHistory.create({
      userId,
      type: "compound_interest",
      amount: compoundedAmount,
      balanceAfter: savings.amount,
    });

    res.status(200).json({
      message: `Successfully compounded $${compoundedAmount.toFixed(
        2
      )} into your savings.`,
      newPrincipal: savings.amount,
    });
  } catch (error) {
    console.error("❌ Compound Interest Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const viewSavings = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.session.user.id;
    const savings = await Savings.findOne({ userId });

    if (!savings) {
      return res.status(404).json({ error: "No savings account found" });
    }

    const DAILY_INTEREST_RATE = 0.1 / 365;
    const todayInterest = savings.amount * DAILY_INTEREST_RATE;

    res.status(200).json({
      principal: savings.amount.toFixed(2),
      totalInterest: savings.totalInterest.toFixed(2),
      interestBalance: savings.interestBalance.toFixed(2),
      todayInterest: todayInterest.toFixed(2),
    });
  } catch (error) {
    console.error("❌ View Savings Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const cancelSavings = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const userId = req.session.user.id;

    const savings = await Savings.findOne({ userId });
    if (!savings) {
      return res.status(404).json({ error: "No savings found." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const principalAmount = savings.amount;

    user.AccountBalance += principalAmount;
    await user.save();

    await SavingsHistory.create({
      userId,
      type: "cancel",
      amount: principalAmount,
      balanceAfter: user.AccountBalance,
      referenceId: savings.referenceId,
    });

    await Savings.deleteOne({ userId });

    return res.status(200).json({
      message:
        "Savings canceled successfully. Interest removed. Principal refunded to your account.",
      refundedAmount: principalAmount,
      newBalance: user.AccountBalance,
    });
  } catch (error) {
    console.error("❌ Cancel Savings Error:", error);
    return res.status(500).json({ error: "Server error." });
  }
};

module.exports = {
  depositToSavings,
  withdrawInterest,
  compoundInterest,
  viewSavings,
  cancelSavings,
};
