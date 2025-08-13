document.addEventListener("DOMContentLoaded", () => {
  const loanContainer = document.getElementById("loanContainer");

  const loanModal = document.createElement("div");
  loanModal.innerHTML = `
    <div id="loanProcessingModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center relative">
        <div id="loanSpinner" class="mb-4">
          <i class="fa-solid fa-spinner fa-spin text-blue-600 text-4xl mb-4"></i>
          <h3 class="text-lg font-semibold text-gray-800">Processing...</h3>
          <p class="text-sm text-gray-500">Please wait...</p>
        </div>
        <div id="loanSuccess" class="mb-4 hidden">
          <i class="fa-solid fa-circle-check text-green-500 text-5xl animate-bounce"></i>
          <h3 class="mt-2 text-xl font-semibold text-gray-800">Success</h3>
          <p class="text-sm text-gray-500">Your action was successful.</p>
        </div>
        <div id="loanFailure" class="mb-4 hidden">
          <i class="fa-solid fa-circle-xmark text-red-500 text-5xl animate-shake"></i>
          <h3 class="mt-2 text-xl font-semibold text-gray-800">Failed</h3>
          <p class="text-sm text-gray-500">Something went wrong. Please try again.</p>
        </div>
        <button id="closeLoanModalBtn"
          class="mt-6 w-full py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
          Close
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(loanModal);

  const repayModal = document.createElement("div");
  repayModal.innerHTML = `
    <div id="repayModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center relative">
        <h3 class="text-xl font-semibold text-gray-800">Repay Loan</h3>
        <p class="text-sm text-gray-500 mb-4">Enter the amount you want to repay:</p>
        <input type="number" id="repayAmountInput" placeholder="Enter amount"
          class="w-full p-2 border rounded mb-4 text-center" />
        <div class="flex gap-3">
          <button id="confirmRepayBtn"
            class="flex-1 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition">
            Confirm
          </button>
          <button id="cancelRepayBtn"
            class="flex-1 py-2 bg-gray-400 text-white rounded-full hover:bg-gray-500 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(repayModal);

  const processingModal = document.getElementById("loanProcessingModal");
  const spinnerDiv = document.getElementById("loanSpinner");
  const successDiv = document.getElementById("loanSuccess");
  const failureDiv = document.getElementById("loanFailure");
  const closeModalBtn = document.getElementById("closeLoanModalBtn");

  const repayModalEl = document.getElementById("repayModal");
  const repayAmountInput = document.getElementById("repayAmountInput");
  const confirmRepayBtn = document.getElementById("confirmRepayBtn");
  const cancelRepayBtn = document.getElementById("cancelRepayBtn");

  let currentLoanId = null;

  function showProcessing() {
    spinnerDiv.classList.remove("hidden");
    successDiv.classList.add("hidden");
    failureDiv.classList.add("hidden");
    processingModal.classList.remove("hidden");
  }

  function showSuccess(message) {
    spinnerDiv.classList.add("hidden");
    successDiv.classList.remove("hidden");
    failureDiv.classList.add("hidden");
    successDiv.querySelector("p").textContent = message;
  }

  function showFailure(message) {
    spinnerDiv.classList.add("hidden");
    successDiv.classList.add("hidden");
    failureDiv.classList.remove("hidden");
    failureDiv.querySelector("p").textContent = message;
  }

  closeModalBtn.addEventListener("click", () => {
    processingModal.classList.add("hidden");
  });

  function openRepayModal(loanId) {
    currentLoanId = loanId;
    repayAmountInput.value = "";
    repayModalEl.classList.remove("hidden");
  }

  function closeRepayModal() {
    repayModalEl.classList.add("hidden");
  }

  cancelRepayBtn.addEventListener("click", closeRepayModal);

  confirmRepayBtn.addEventListener("click", async () => {
    const amount = repayAmountInput.value.trim();

    if (!amount || isNaN(amount) || amount <= 0) {
      showFailure("Enter a valid repayment amount.");
      closeRepayModal();
      return;
    }

    showProcessing();
    closeRepayModal();

    try {
      const repayRes = await fetch("/user/secure/ctb/repay-loan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId: currentLoanId, amount }),
      });

      const repayData = await repayRes.json();
      if (repayRes.ok) {
        showSuccess(repayData.message);
        fetchLoans();
      } else {
        showFailure(repayData.error || "Repayment failed.");
      }
    } catch (err) {
      console.error(err);
      showFailure("Server error processing repayment");
    }
  });

  async function fetchLoans() {
    try {
      const res = await fetch("/user/secure/ctb/loans");
      const data = await res.json();

      if (!res.ok) {
        return showFailure(data.error || "Error loading loans");
      }

      loanContainer.innerHTML = "";

      if (data.loans.length === 0) {
        loanContainer.innerHTML = `<p class="text-gray-600">No loan history found.</p>`;
        return;
      }

      data.loans.forEach((loan) => {
        const card = document.createElement("div");
        card.className = "bg-white rounded-xl shadow p-4 relative";

        card.innerHTML = `
          <div class="flex justify-between items-center mb-2">
            <p class="text-lg font-semibold">Loan: $${loan.amount}</p>
            <span class="text-xs px-2 py-1 rounded ${
              loan.status === "approved"
                ? "bg-green-200 text-green-800"
                : loan.status === "pending"
                ? "bg-yellow-200 text-yellow-800"
                : "bg-gray-200 text-gray-700"
            }">${loan.status}</span>
          </div>

          <p class="text-sm text-gray-600">Interest: $${loan.interest}</p>
          <p class="text-sm text-gray-600">Reason: ${loan.reason}</p>
          <p class="text-sm text-gray-600">Due: ${
            loan.dueDate
              ? new Date(loan.dueDate).toLocaleDateString()
              : "No due date"
          }</p>
          <p class="mt-2 text-red-600 font-semibold">Outstanding: $${
            loan.outstanding
          }</p>

          ${
            loan.status === "approved" && loan.outstanding > 0
              ? `<button class="mt-3 w-full py-2 bg-red-600 text-white rounded-full hover:bg-red-700 repayBtn" data-id="${loan.id}">
                   Repay Loan
                 </button>`
              : ""
          }
        `;

        loanContainer.appendChild(card);
      });

      document.querySelectorAll(".repayBtn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const loanId = e.target.dataset.id;
          openRepayModal(loanId);
        });
      });
    } catch (err) {
      console.error("❌ Error fetching loans:", err);
      showFailure("Failed to load loans.");
    }
  }

  fetchLoans();
});
