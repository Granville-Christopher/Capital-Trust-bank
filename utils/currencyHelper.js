/**
 * Comprehensive Currency Helper & Country Mapping Engine
 */

const COUNTRY_TO_CURRENCY = {
  // North America
  "united states": "USD",
  "united states of america": "USD",
  "usa": "USD",
  "us": "USD",
  "canada": "CAD",
  "mexico": "MXN",

  // Europe (Eurozone)
  "austria": "EUR",
  "belgium": "EUR",
  "cyprus": "EUR",
  "estonia": "EUR",
  "finland": "EUR",
  "france": "EUR",
  "germany": "EUR",
  "greece": "EUR",
  "ireland": "EUR",
  "italy": "EUR",
  "latvia": "EUR",
  "lithuania": "EUR",
  "luxembourg": "EUR",
  "malta": "EUR",
  "netherlands": "EUR",
  "portugal": "EUR",
  "slovakia": "EUR",
  "slovenia": "EUR",
  "spain": "EUR",

  // Europe (Non-Eurozone)
  "united kingdom": "GBP",
  "uk": "GBP",
  "great britain": "GBP",
  "england": "GBP",
  "scotland": "GBP",
  "wales": "GBP",
  "switzerland": "CHF",
  "norway": "NOK",
  "sweden": "SEK",
  "denmark": "DKK",
  "poland": "PLN",
  "czech republic": "CZK",
  "hungary": "HUF",
  "romania": "RON",
  "bulgaria": "BGN",
  "turkey": "TRY",
  "ukraine": "UAH",
  "russia": "RUB",

  // Asia & Oceania
  "japan": "JPY",
  "china": "CNY",
  "india": "INR",
  "australia": "AUD",
  "new zealand": "NZD",
  "singapore": "SGD",
  "hong kong": "HKD",
  "south korea": "KRW",
  "taiwan": "TWD",
  "indonesia": "IDR",
  "malaysia": "MYR",
  "philippines": "PHP",
  "thailand": "THB",
  "vietnam": "VND",
  "pakistan": "PKR",
  "bangladesh": "BDT",
  "sri lanka": "LKR",
  "united arab emirates": "AED",
  "uae": "AED",
  "dubai": "AED",
  "saudi arabia": "SAR",
  "qatar": "QAR",
  "kuwait": "KWD",
  "bahrain": "BHD",
  "oman": "OMR",
  "israel": "ILS",

  // Africa
  "nigeria": "NGN",
  "south africa": "ZAR",
  "ghana": "GHS",
  "kenya": "KES",
  "egypt": "EGP",
  "uganda": "UGX",
  "tanzania": "TZS",
  "rwanda": "RWF",
  "cameroon": "XAF",
  "senegal": "XOF",
  "ivory coast": "XOF",
  "morocco": "MAD",
  "algeria": "DZD",
  "ethiopia": "ETB",
  "zambia": "ZMW",
  "zimbabwe": "USD",

  // Latin America
  "brazil": "BRL",
  "argentina": "ARS",
  "chile": "CLP",
  "colombia": "COP",
  "peru": "PEN",
};

const CURRENCY_SYMBOLS = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "CA$",
  AUD: "A$",
  NGN: "₦",
  JPY: "¥",
  INR: "₹",
  ZAR: "R",
  CHF: "CHF",
  CNY: "¥",
  AED: "AED",
  SAR: "SAR",
  NZD: "NZ$",
  SGD: "S$",
  HKD: "HK$",
  BRL: "R$",
  MXN: "MX$",
  GHS: "GH₵",
  KES: "KSh",
  PHP: "₱",
  EGP: "E£",
  TRY: "₺",
  PKR: "₨",
  BDT: "৳",
  VND: "₫",
  THB: "฿",
  IDR: "Rp",
  MYR: "RM",
  ILS: "₪",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  PLN: "zł",
  CZK: "Kč",
  HUF: "Ft",
  QAR: "QR",
  KWD: "KD",
  BHD: "BD",
  OMR: "OMR",
  UGX: "USh",
  TZS: "TSh",
  RWF: "RF",
  MAD: "DH",
  DZD: "DA",
  COP: "COL$",
  CLP: "CLP$",
  PEN: "S/",
  ARS: "AR$",
};

const SUPPORTED_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "AED", name: "UAE Dirham", symbol: "AED" },
  { code: "SAR", name: "Saudi Riyal", symbol: "SAR" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "ILS", name: "Israeli New Shekel", symbol: "₪" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł" },
  { code: "QAR", name: "Qatari Riyal", symbol: "QR" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "KD" },
];

/**
 * Get currency code from country name
 */
function getCurrencyFromCountry(country) {
  if (!country || typeof country !== "string") return "USD";
  const normalized = country.trim().toLowerCase();

  if (COUNTRY_TO_CURRENCY[normalized]) {
    return COUNTRY_TO_CURRENCY[normalized];
  }

  // Fallback to country-currency-map npm package if installed
  try {
    const { getCurrencyAbbreviation } = require("country-currency-map");
    const mapped = getCurrencyAbbreviation(country);
    if (mapped) return mapped.toUpperCase();
  } catch (err) {
    // ignore
  }

  return "USD";
}

/**
 * Get currency symbol for a currency code
 */
function getCurrencySymbol(currencyCode) {
  if (!currencyCode) return "$";
  const upper = currencyCode.trim().toUpperCase();
  return CURRENCY_SYMBOLS[upper] || upper;
}

/**
 * Determine active currency code for a user
 */
function getUserCurrency(user, kyc) {
  // If user has an explicit currency set by admin
  if (user && user.currency && typeof user.currency === "string") {
    const trimmed = user.currency.trim().toUpperCase();
    if (trimmed && trimmed !== "COUNTRY_DEFAULT") {
      return trimmed;
    }
  }

  // Fallback to Country currency from KYC
  if (kyc && kyc.country) {
    return getCurrencyFromCountry(kyc.country);
  }

  return "USD";
}

/**
 * Format currency amount with symbol
 */
function formatUserBalance(amount, currencyCode) {
  const num = Number(amount || 0);
  const code = (currencyCode || "USD").toUpperCase();
  const symbol = getCurrencySymbol(code);
  const formattedNum = num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // If symbol is multi-character text (e.g. AED, CHF), place code after number
  if (symbol.length > 3) {
    return `${formattedNum} ${symbol}`;
  }
  return `${symbol}${formattedNum}`;
}

module.exports = {
  getCurrencyFromCountry,
  getCurrencySymbol,
  getUserCurrency,
  formatUserBalance,
  SUPPORTED_CURRENCIES,
  COUNTRY_TO_CURRENCY,
  CURRENCY_SYMBOLS,
};
