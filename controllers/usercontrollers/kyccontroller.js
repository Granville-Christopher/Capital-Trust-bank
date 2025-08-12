const KYC = require("../../models/usermodels/kyc");
const User = require("../../models/usermodels/userSignup");

const submitKYC = async (req, res) => {
  try {
    console.log("📄 req.body:", req.body);
    console.log("📂 req.files:", req.files);

    if (!req.session.user || !req.session.user.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.session.user.id;

    const existing = await KYC.findOne({ userId });
    if (existing) {
      return res.status(400).json({ error: "KYC already submitted" });
    }

    if (!req.files || !req.files.idFront || !req.files.idBack) {
      return res
        .status(400)
        .json({ error: "Both front and back ID images are required" });
    }

    const kycData = {
      userId,
      country: req.body.country,
      nationality: req.body.nationality,
      residentialAddress: req.body.residentialAddress,
      occupation: req.body.occupation,
      accountCategory: req.body.accountCategory,
      accountType: req.body.accountType,
      dateOfBirth: req.body.dateOfBirth,
      idType: req.body.idType,
      idFront: req.files.idFront[0].path,
      idBack: req.files.idBack[0].path,
      phoneNumber: req.body.phoneNumber,
    };

    await KYC.create(kycData);

    res.status(201).json({
      message: "KYC submitted successfully. Await admin verification.",
    });
  } catch (error) {
    console.error("❌ KYC Submission Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { submitKYC };
