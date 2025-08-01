document.addEventListener("DOMContentLoaded", () => {
  const openPayLoanFormBtn = document.getElementById("openPayLoanFormBtn");
  const qualifiedCreditField = document.getElementById("qualifiedCredit");
  const outstandingLoanField = document.getElementById("outstandingLoan");
  const availableCreditField = document.getElementById("availableCredit");

  const dueDateField = document.getElementById("ddate");

  let activeLoanId = null;

  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    #loanToast {
      animation: fadeIn 0.3s ease-out;
      font-family: Arial, sans-serif;
    }
    .toast-success {
      background-color: #16a34a;
    }
    .toast-error {
      background-color: #dc2626;
    }
  `;
  document.head.appendChild(style);

  async function fetchLoanDetails() {
    try {
      const res = await fetch("/user/secure/ctb/loan-details");
      const data = await res.json();

      if (res.ok) {
        qualifiedCreditField.textContent = `$${data.eligibleAmount}`;
        availableCreditField.textContent = `$${data.availableCredit}`;

        if (data.activeLoan) {
          outstandingLoanField.textContent = `$${data.activeLoan.remaining}`;
          activeLoanId = data.activeLoan.loanId;

          const formattedDate = new Date(
            data.activeLoan.dueDate
          ).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          dueDateField.textContent = `Outstanding Loan payment Due: ${formattedDate}`;
        } else {
          outstandingLoanField.textContent = "$0";
          activeLoanId = null;
          dueDateField.textContent = "No active loan";
        }
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error fetching loan details.");
    }
  }

  fetchLoanDetails();

  openPayLoanFormBtn.addEventListener("click", async () => {
    if (!activeLoanId) {
      return showToast("error", "You have no outstanding loans to repay.");
    }

    const amount = prompt("Enter amount you want to repay:");

    if (!amount || isNaN(amount) || amount <= 0) {
      return showToast("error", "Enter a valid repayment amount.");
    }

    try {
      const res = await fetch("/user/secure/ctb/repay-loan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId: activeLoanId, amount }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("success", data.message);
        fetchLoanDetails();
      } else {
        showToast("error", data.error || "Repayment failed.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Server error processing repayment");
    }
  });

  function showToast(type, message) {
    const existingToast = document.getElementById("loanToast");
    if (existingToast) existingToast.remove();

    const toast = document.createElement("div");
    toast.id = "loanToast";
    toast.className = `
      fixed top-5 right-5 px-4 py-3 rounded shadow-lg text-white z-50 transition-opacity duration-300 ease-in-out
      ${type === "success" ? "toast-success" : "toast-error"}
    `;

    toast.style.maxWidth = "300px";
    toast.style.borderRadius = "8px";
    toast.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
    toast.style.fontSize = "14px";
    toast.style.opacity = "0.95";

    toast.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span style="margin-right: 10px;">${message}</span>
        <button id="closeToastBtn" style="font-weight: bold; border: none; background: none; color: white; cursor: pointer;">✕</button>
      </div>
    `;

    document.body.appendChild(toast);

    document.getElementById("closeToastBtn").addEventListener("click", () => {
      toast.remove();
    });

    setTimeout(() => {
      if (toast) toast.remove();
    }, 3000);
  }
});
