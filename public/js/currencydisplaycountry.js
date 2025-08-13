document.addEventListener("DOMContentLoaded", () => {
  const balanceElement = document.getElementById("balanceAmount");
  const balanceUSD = Number(balanceElement.dataset.balance);
  const currencyCode = balanceElement.dataset.currency;

  async function displayLocalBalance() {
    try {
      const res = await fetch(
        `https://api.exchangerate.host/latest?base=USD&symbols=${currencyCode}`
      );
      const data = await res.json();
      const rate = data.rates?.[currencyCode] || 1;
      const localAmount = balanceUSD * rate;

      balanceElement.textContent = localAmount.toLocaleString(undefined, {
        style: "currency",
        currency: currencyCode,
      });
    } catch (err) {
      console.error("Error fetching exchange rates:", err);
      balanceElement.textContent = balanceUSD.toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
      });
    }
  }

  displayLocalBalance();
});
