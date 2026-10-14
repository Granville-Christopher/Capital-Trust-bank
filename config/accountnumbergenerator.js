const User = require("../models/usermodels/userSignup");

/**
  @returns {Promise<string>}
 */

async function generateUniqueAccountNumber() {
  let accountNumber;
  let isUnique = false;
  const maxRetries = 10;
  let attempts = 0;

  while (!isUnique && attempts < maxRetries) {
    const min = 100000000;
    const max = 999999999;
    accountNumber = String(Math.floor(Math.random() * (max - min + 1)) + min);

    const existingUser = await User.findOne({ AccountNumber: accountNumber });

    if (!existingUser) {
      isUnique = true;
    }
    attempts++;
    if (!isUnique) {
      console.warn(
        `Generated account number ${accountNumber} already exists. Retrying... (Attempt ${attempts})`
      );
    }
  }

  if (!isUnique) {
    throw new Error(
      "Failed to generate a unique account number after multiple attempts."
    );
  }

  return accountNumber;
}

module.exports = generateUniqueAccountNumber;
