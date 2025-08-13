document.addEventListener("DOMContentLoaded", function () {
  const receiptModal = document.getElementById("receiptModal");
  const closeReceiptModalBtn = document.getElementById("closeReceiptModal");
  const receiptDate = document.getElementById("receiptDate");
  const referenceIdElement = document.getElementById("referenceId");
  const receiptDescription = document.getElementById("receiptDescription");
  const receiptType = document.getElementById("receiptType");
  const receiptAmount = document.getElementById("receiptAmount");
  const receiptStatus = document.getElementById("receiptStatus");
  const recipientDetails = document.getElementById("recipientDetails");
  const senderDetails = document.getElementById("senderDetails");
  const receiptRelatedName = document.getElementById("receiptRelatedName");
  const receiptRelatedAccount = document.getElementById(
    "receiptRelatedAccount"
  );
  const receiptRelatedNameSender = document.getElementById(
    "receiptRelatedNameSender"
  );
  const receiptRelatedAccountSender = document.getElementById(
    "receiptRelatedAccountSender"
  );
  const downloadReceiptPdfBtn = document.getElementById(
    "downloadReceiptPdfBtn"
  );
  const receiptContent = document.getElementById("receiptContent");

  // ✅ Read currency from DOM (set in EJS) so external JS can use it
  const currencyCode = (
    document.body.dataset.currencyCode || "USD"
  ).toUpperCase();

  let rateCache = null;
  async function getUsdToLocalRate() {
    if (currencyCode === "USD") return 1;
    if (rateCache) return rateCache;
    try {
      const res = await fetch(
        `https://api.exchangerate.host/latest?base=USD&symbols=${encodeURIComponent(
          currencyCode
        )}`
      );
      const data = await res.json();
      rateCache = data?.rates?.[currencyCode] || 1;
      return rateCache;
    } catch (e) {
      console.error("FX fetch failed:", e);
      return 1;
    }
  }

  async function formatLocalCurrency(amountUsdAbs) {
    const rate = await getUsdToLocalRate();
    const local = Number(amountUsdAbs) * rate;
    return local.toLocaleString(undefined, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  async function showReceiptModal(data) {
    const {
      amount, // assumed USD numeric string/number
      description,
      type, // "debit" | "credit"
      status,
      dateString,
      relatedName,
      relatedAccount,
      referenceId,
    } = data;

    const transactionDate = new Date(dateString);
    receiptDate.textContent = transactionDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    referenceIdElement.textContent = referenceId || "N/A";
    receiptDescription.textContent = description;
    receiptType.textContent = type;

    const amtNum = Number(amount) || 0;
    const formattedAbs = await formatLocalCurrency(Math.abs(amtNum));
    receiptAmount.textContent =
      type === "debit" ? `-${formattedAbs}` : formattedAbs;
    receiptAmount.className =
      "font-bold text-lg " +
      (type === "debit" ? "text-red-600" : "text-green-600");

    receiptStatus.textContent = status;
    receiptStatus.className =
      "capitalize " +
      (status === "successful"
        ? "text-green-600"
        : status === "failed"
        ? "text-red-600"
        : "text-yellow-600");

    if (type === "debit") {
      recipientDetails.classList.remove("hidden");
      senderDetails.classList.add("hidden");
      receiptRelatedName.textContent = relatedName || "N/A";
      receiptRelatedAccount.textContent = relatedAccount || "N/A";
    } else if (type === "credit") {
      recipientDetails.classList.add("hidden");
      senderDetails.classList.remove("hidden");
      receiptRelatedNameSender.textContent = relatedName || "N/A";
      receiptRelatedAccountSender.textContent = relatedAccount || "N/A";
    } else {
      recipientDetails.classList.add("hidden");
      senderDetails.classList.add("hidden");
    }

    receiptModal.classList.remove("hidden");
  }

  // ✅ Use the correct dataset key for hyphenated attributes: data-reference-id => dataset.referenceId
  document
    .querySelectorAll(".view-receipt-btn, .view-international-receipt-btn")
    .forEach((button) => {
      button.addEventListener("click", function () {
        showReceiptModal({
          amount: this.dataset.amount,
          description: this.dataset.description,
          type: this.dataset.type,
          status: this.dataset.status,
          dateString: this.dataset.date,
          relatedName: this.dataset.relatedname,
          relatedAccount: this.dataset.relatedaccount,
          referenceId: this.dataset.referenceId, // <-- camelCase
        });
      });
    });

  closeReceiptModalBtn.addEventListener("click", () =>
    receiptModal.classList.add("hidden")
  );
  receiptModal.addEventListener("click", (e) => {
    if (e.target === receiptModal) receiptModal.classList.add("hidden");
  });

  downloadReceiptPdfBtn.addEventListener("click", function () {
    const options = {
      margin: 0.5,
      filename: "CTBank_transaction_receipt.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        ignoreElements: (el) => el.classList.contains("receipt-exclude"),
      },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };
    html2pdf().set(options).from(receiptContent).save();
  });
});
