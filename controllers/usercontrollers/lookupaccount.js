const User = require("../../models/usermodels/userSignup");
const { query, validationResult } = require("express-validator");

const lookupAccount = [
  query("accountNumber")
    .isLength({ min: 9, max: 9 })
    .withMessage("Account Number must be 9 digits")
    .isNumeric()
    .withMessage("Account Number must be numeric")
    .trim()
    .escape(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { accountNumber } = req.query;

      const recipientUser = await User.findOne({
        AccountNumber: accountNumber,
      }).select("Name AccountNumber");

      if (!recipientUser) {
        return res.status(404).json({ error: "Account number not found." });
      }

      res.status(200).json({
        fullName: recipientUser.Name,
        accountNumber: recipientUser.AccountNumber,
      });
    } catch (err) {
      console.error("Error during account lookup:", err);
      res.status(500).json({ error: "Server error during account lookup." });
    }
  },
];

module.exports = lookupAccount;
