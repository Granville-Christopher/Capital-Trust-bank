document.addEventListener("DOMContentLoaded", () => {
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

  // async function fetchLoanDetails() {
  //   try {
  //     const res = await fetch("/user/secure/ctb/loan-details");
  //     const data = await res.json();

  //     if (res.ok) {
  //       qualifiedCreditField.textContent = `$${data.eligibleAmount.toFixed(2)}`;
  //       outstandingLoanField.textContent = `$${data.outstandingLoanTotal.toFixed(
  //         2
  //       )}`;
  //       availableCreditField.textContent = `$${data.availableCredit.toFixed(
  //         2
  //       )}`;

  //       if (data.activeLoan) {
  //         activeLoanId = data.activeLoan.loanId;
  //         const formattedDate = new Date(
  //           data.activeLoan.dueDate
  //         ).toLocaleDateString("en-US", {
  //           year: "numeric",
  //           month: "long",
  //           day: "numeric",
  //         });
  //         dueDateField.textContent = `Outstanding Loan payment Due: ${formattedDate}`;
  //       } else {
  //         activeLoanId = null;
  //         dueDateField.textContent = "No active loan";
  //       }
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     showToast("error", "Error fetching loan details.");
  //   }
  // }

  async function fetchLoanDetails() {
    try {
      const currencyCode =
        document.getElementById("qualifiedCredit").dataset.currency;
      const res = await fetch("/user/secure/ctb/loan-details");
      const data = await res.json();

      if (res.ok) {
        qualifiedCreditField.textContent = await convertAndFormat(
          data.eligibleAmount,
          currencyCode
        );
        outstandingLoanField.textContent = await convertAndFormat(
          data.outstandingLoanTotal,
          currencyCode
        );
        availableCreditField.textContent = await convertAndFormat(
          data.availableCredit,
          currencyCode
        );

        if (data.activeLoan) {
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
          activeLoanId = null;
          dueDateField.textContent = "No active loan";
        }
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error fetching loan details.");
    }
  }

  async function convertAndFormat(amountUSD, currencyCode) {
    if (!currencyCode || currencyCode === "USD") {
      return amountUSD.toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
      });
    }

    try {
      const res = await fetch(
        `https://api.exchangerate.host/latest?base=USD&symbols=${currencyCode}`
      );
      const data = await res.json();
      const rate = data.rates?.[currencyCode] || 1;
      const localAmount = amountUSD * rate;

      return localAmount.toLocaleString(undefined, {
        style: "currency",
        currency: currencyCode,
      });
    } catch (error) {
      console.error("Error converting currency:", error);
      return amountUSD.toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
      });
    }
  }

  fetchLoanDetails();

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
