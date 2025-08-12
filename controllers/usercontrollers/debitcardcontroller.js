const DebitCard = require("../../models/usermodels/debitcard");
const generateCardDetails =
  require("../../utils/cardgenerator").generateCardDetails;
const bcrypt = require("bcrypt");
const User = require("../../models/usermodels/userSignup");

const createDebitCard = async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    const { cardType } = req.body;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!["visa", "mastercard"].includes(cardType))
      return res.status(400).json({ error: "Invalid card type" });

    const { cardNumber, cvv, expiryDate } = generateCardDetails(cardType);

    const card = new DebitCard({
      userId,
      cardType,
      cardNumber,
      cvv,
      expiryDate,
      status: "active",
      selectedAt: new Date(),
    });

    await card.save();

    return res.status(201).json({
      message: "Card created",
      card: {
        cardNumber,
        cvv,
        expiryDate,
        cardType,
      },
    });
  } catch (error) {
    console.error("❌ Card creation error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const checkAndExpireCards = async () => {
  const now = new Date();
  const result = await DebitCard.deleteMany({ expiryDate: { $lt: now } });

  console.log(`🗑️ Deleted ${result.deletedCount} expired cards`);
};

const freezeCard = async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    const card = await DebitCard.findOne({ userId, status: "active" });

    if (!card) return res.status(404).json({ error: "No active card found" });

    card.status = "frozen";
    await card.save();

    res.status(200).json({ message: "Card frozen" });
  } catch (error) {
    console.error("❌ Freeze error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const terminateCard = async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    const card = await DebitCard.findOneAndDelete({ userId });

    if (!card) return res.status(404).json({ error: "Card not found" });

    res.status(200).json({ message: "Card terminated and deleted" });
  } catch (error) {
    console.error("❌ Termination error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const fetchDebitCard = async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const card = await DebitCard.findOne({ userId }).lean();
    const user = await User.findById(userId).lean();

    if (!card) {
      return res.json({ card: null });
    }

    res.json({
      card: {
        cardType: card.cardType,
        cardNumber: card.cardNumber,
        expiryDate: card.expiryDate,
        cvv: card.cvv,
      },
      userName: user?.Name || "",
    });

  } catch (error) {
    console.error("Error fetching card:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const setDebitCardPin = async (req, res) => {
  const userId = req.session.user?.id;
  const { pin } = req.body;

  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return res.status(400).json({ message: "Invalid PIN format." });
  }

  try {
    const card = await DebitCard.findOne({ userId });

    if (!card) {
      return res.status(404).json({ message: "Debit card not found." });
    }

    const saltRounds = 10;
    const hashedPin = await bcrypt.hash(pin, saltRounds);

    card.pin = hashedPin;
    await card.save();

    res.status(200).json({ message: "PIN set successfully." });
  } catch (error) {
    console.error("Error setting PIN:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  createDebitCard,
  freezeCard,
  terminateCard,
  checkAndExpireCards,
  fetchDebitCard,
  setDebitCardPin,
};
