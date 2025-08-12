function luhnCheck(cardNumber) {
  let sum = 0;
  let shouldDouble = false;
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

function generateNumber(prefix) {
  while (true) {
    let number = prefix;
    while (number.length < 15) {
      number += Math.floor(Math.random() * 10);
    }

    for (let i = 0; i <= 9; i++) {
      const trial = number + i;
      if (luhnCheck(trial)) return trial;
    }
  }
};

function generateCVV() {
  return String(Math.floor(100 + Math.random() * 900));
};

function generateExpiryDate() {
  const now = new Date();
  const expiry = new Date(now.setFullYear(now.getFullYear() + 3));
  return expiry;
};

function generateCardDetails(cardType = "visa") {
  const prefix =
    cardType === "visa" ? "4" : "5" + Math.floor(Math.random() * 6 + 1);

  return {
    cardNumber: generateNumber(prefix),
    cvv: generateCVV(),
    expiryDate: generateExpiryDate(),
  };
};

module.exports = {
  generateCardDetails,
};
