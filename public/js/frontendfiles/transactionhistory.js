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

  function showReceiptModal(data) {
    const {
      amount,
      description,
      type,
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

    if (referenceIdElement && referenceId) {
      referenceIdElement.textContent = referenceId;
    } else if (referenceIdElement) {
      referenceIdElement.textContent = "N/A";
    }
    receiptDescription.textContent = description;
    receiptType.textContent = type;

    let formattedAmount = `$${parseFloat(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    receiptAmount.textContent = formattedAmount;
    receiptAmount.className = "font-bold text-lg";
    if (type === "debit") {
      receiptAmount.textContent = `-${formattedAmount}`;
      receiptAmount.classList.add("text-red-600");
    } else {
      receiptAmount.classList.add("text-green-600");
    }

    receiptStatus.textContent = status;
    receiptStatus.className = "capitalize";
    if (status === "successful") {
      receiptStatus.classList.add("text-green-600");
    } else if (status === "failed") {
      receiptStatus.classList.add("text-red-600");
    } else {
      receiptStatus.classList.add("text-yellow-600");
    }

    if (type === "debit") {
      recipientDetails.classList.remove("hidden");
      senderDetails.classList.add("hidden");
      receiptRelatedName.textContent = relatedName;
      receiptRelatedAccount.textContent = relatedAccount;
    } else if (type === "credit") {
      recipientDetails.classList.add("hidden");
      senderDetails.classList.remove("hidden");
      receiptRelatedNameSender.textContent = relatedName;
      receiptRelatedAccountSender.textContent = relatedAccount;
    } else {
      recipientDetails.classList.add("hidden");
      senderDetails.classList.add("hidden");
    }

    receiptModal.classList.remove("hidden");
  }

  document.querySelectorAll(".view-receipt-btn").forEach((button) => {
    button.addEventListener("click", function () {
      showReceiptModal({
        amount: this.dataset.amount,
        description: this.dataset.description,
        type: this.dataset.type,
        status: this.dataset.status,
        dateString: this.dataset.date,
        relatedName: this.dataset.relatedname,
        relatedAccount: this.dataset.relatedaccount,
        referenceId: this.dataset.referenceId,
      });
    });
  });

  document.querySelectorAll(".view-international-receipt-btn").forEach((button) => {
    button.addEventListener("click", function () {
      showReceiptModal({
        amount: this.dataset.amount,
        description: this.dataset.description,
        type: this.dataset.type,
        status: this.dataset.status,
        dateString: this.dataset.date,
        relatedName: this.dataset.relatedname,
        relatedAccount: this.dataset.relatedaccount,
        referenceId: this.dataset.referenceId,
      });
    });
  });

  closeReceiptModalBtn.addEventListener("click", function () {
    receiptModal.classList.add("hidden");
  });

  receiptModal.addEventListener("click", function (event) {
    if (event.target === receiptModal) {
      receiptModal.classList.add("hidden");
    }
  });

  downloadReceiptPdfBtn.addEventListener("click", function () {
    const element = receiptContent;

    const options = {
      margin: 0.5,
      filename: "CTBank_transaction_receipt.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, logging: true, dpi: 192, letterRendering: true },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      html2canvas: {
        onrendered: function (canvas) {},
        useCORS: true,
        scale: 2,
        ignoreElements: (element) =>
          element.classList.contains("receipt-exclude"),
      },
    };

    html2pdf().set(options).from(element).save();
  });
});
