document.addEventListener("DOMContentLoaded", function () {
  const savingsBtn = document.getElementById("savingsBtn");
  const loansBtn = document.getElementById("loansBtn");
  const savingsSection = document.getElementById("savingsSection");
  const loansSection = document.getElementById("loansSection");

  const openSavingsFormBtn = document.getElementById("openSavingsFormBtn");
  const savingsForm = document.getElementById("savingsForm");
  const saveAmountInput = document.getElementById("saveAmount");
  const savingsTermInput = document.getElementById("savingsTerm");

  const openLoanFormBtn = document.getElementById("openLoanFormBtn");
  const loanForm = document.getElementById("loanForm");
  const loanAmountInput = document.getElementById("loanAmount");
  const loanReasonInput = document.getElementById("loanReason");
  const loanTermInput = document.getElementById("loanTerm");

  const loanProcessingModal = document.getElementById("loanProcessingModal");
  const loanSpinner = document.getElementById("loanSpinner");
  const loanSuccess = document.getElementById("loanSuccess");
  const loanFailure = document.getElementById("loanFailure");
  const closeLoanModalBtn = document.getElementById("closeLoanModalBtn");

  const transferModal = document.createElement("div");
  transferModal.id = "transferModal";
  transferModal.className =
    "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden";

  transferModal.innerHTML = `
    <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center relative animate-fadeIn">
      <div id="successIcon" class="mb-4 hidden">
        <i class="fa-solid fa-circle-check text-green-500 text-5xl animate-bounce"></i>
        <h3 class="mt-2 text-xl font-semibold text-gray-800">Save Successful</h3>
        <p class="text-sm text-gray-500" id="successMessage">Your savings have been updated.</p>
      </div>
      <div id="failureIcon" class="mb-4 hidden">
        <i class="fa-solid fa-circle-xmark text-red-500 text-5xl animate-shake"></i>
        <h3 class="mt-2 text-xl font-semibold text-gray-800">Save Failed</h3>
        <p class="text-sm text-gray-500" id="errorMessage">Something went wrong. Please try again.</p>
      </div>
      <button id="closeModalBtn" class="mt-6 w-full py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
        Close
      </button>
    </div>
  `;

  document.body.appendChild(transferModal);

  const successIcon = transferModal.querySelector("#successIcon");
  const failureIcon = transferModal.querySelector("#failureIcon");
  const closeModalBtn = transferModal.querySelector("#closeModalBtn");

  function showModal(success, message) {
    if (success) {
      successIcon.style.display = "block";
      failureIcon.style.display = "none";
      if (message) {
        successIcon.querySelector("#successMessage").textContent = message;
      }
    } else {
      successIcon.style.display = "none";
      failureIcon.style.display = "block";
      if (message) {
        failureIcon.querySelector("#errorMessage").textContent = message;
      }
    }
    transferModal.classList.remove("hidden");
  }

  function closeModal() {
    transferModal.classList.add("hidden");
  }

  closeModalBtn.addEventListener("click", closeModal);
  transferModal.addEventListener("click", (e) => {
    if (e.target === transferModal) {
      closeModal();
    }
  });

  savingsBtn.addEventListener("click", () => {
    savingsSection.classList.remove("hidden");
    loansSection.classList.add("hidden");
    savingsBtn.classList.add("border-blue-600", "text-blue-600");
    savingsBtn.classList.remove("text-gray-500");
    loansBtn.classList.remove("border-b-blue-600", "text-blue-600");
    loansBtn.classList.add("text-gray-500");
  });

  loansBtn.addEventListener("click", () => {
    loansSection.classList.remove("hidden");
    savingsSection.classList.add("hidden");
    loansBtn.classList.add("border-b-blue-600", "text-blue-600");
    loansBtn.classList.remove("text-gray-500");
    savingsBtn.classList.remove("border-blue-600", "text-blue-600");
    savingsBtn.classList.add("text-gray-500");
  });

  if (openSavingsFormBtn) {
    openSavingsFormBtn.addEventListener("click", () => {
      savingsForm.classList.toggle("hidden");
    });
  }

  if (savingsForm) {
    savingsForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const amount = saveAmountInput.value.trim();
      const savingsTerm = savingsTermInput.value.trim();

      if (!amount || isNaN(amount) || Number(amount) <= 0) {
        showModal(false, "Please enter a valid amount to save.");
        return;
      }
      if (!savingsTerm) {
        showModal(false, "Please select savings term");
        return;
      }

      try {
        const response = await fetch("/user/secure/ctb/savings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: Number(amount),
            term: savingsTerm,
          }),
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok) {
          showModal(true, data.message || "Your savings have been updated.");
          savingsForm.reset();
          savingsForm.classList.add("hidden");
          location.reload();
        } else {
          showModal(false, data.error || "Failed to save amount.");
        }
      } catch (error) {
        showModal(false, "Network error. Please try again.");
      }
    });
  }

  if (openLoanFormBtn) {
    openLoanFormBtn.addEventListener("click", () => {
      loanForm.classList.toggle("hidden");
    });
  }
  if (loanForm) {
    loanForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const amount = loanAmountInput.value.trim();
      const reason = loanReasonInput.value.trim();
      const term = loanTermInput.value.trim();
      const guarantor = document.getElementById("guarantor").value.trim();
      const guarantorContact = document
        .getElementById("guarantorContact")
        .value.trim();
      const agreement = document.getElementById("loanAgreement").checked;

      if (!amount || Number(amount) <= 0 || isNaN(amount)) {
        showModal(false, "Please enter a valid loan amount.");
        return;
      }

      if (!reason) {
        showModal(false, "Please select a loan reason.");
        return;
      }

      if (!term) {
        showModal(false, "Please select a loan term.");
        return;
      }

      if (!guarantor || !guarantorContact) {
        showModal(false, "Please provide guarantor details.");
        return;
      }

      if (!agreement) {
        showModal(false, "You must agree to the loan terms.");
        return;
      }

      loanProcessingModal.classList.remove("hidden");
      loanSpinner.classList.remove("hidden");
      loanSuccess.classList.add("hidden");
      loanFailure.classList.add("hidden");

      try {
        const response = await fetch("/user/secure/ctb/request-loan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Number(amount),
            reason,
            term,
            guarantor,
            guarantorContact,
          }),
          credentials: "include",
        });

        const data = await response.json();

        loanSpinner.classList.add("hidden");

        if (response.ok) {
          loanSuccess.classList.remove("hidden");
          loanFailure.classList.add("hidden");

          loanForm.reset();
          loanForm.classList.add("hidden");

          setTimeout(() => {
            loanProcessingModal.classList.add("hidden");
          }, 5000);
        } else {
          loanFailure.querySelector("p").textContent =
            data.error || "Loan request failed.";
          loanFailure.classList.remove("hidden");
          loanSuccess.classList.add("hidden");
        }
      } catch (error) {
        console.error("Loan Request Error:", error);

        loanSpinner.classList.add("hidden");
        loanFailure.classList.remove("hidden");
        loanSuccess.classList.add("hidden");
      }
    });
  }

  closeLoanModalBtn.addEventListener("click", () => {
    loanProcessingModal.classList.add("hidden");
  });
});
