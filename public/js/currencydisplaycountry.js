document.addEventListener("DOMContentLoaded", () => {
  const balanceElement = document.getElementById("balanceAmount");
  if (!balanceElement) return;

  const rawBalance = balanceElement.dataset.balance;
  const balanceVal = Number(rawBalance || 0);
  const currencyCode = balanceElement.dataset.currency || "USD";
  const currencySymbol = balanceElement.dataset.symbol || "$";

  // If element currently has "Loading..." or is empty, format immediately
  if (balanceElement.textContent.trim() === "Loading..." || !balanceElement.textContent.trim()) {
    try {
      balanceElement.textContent = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(balanceVal);
    } catch (e) {
      balanceElement.textContent = currencySymbol + balanceVal.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  }
});
