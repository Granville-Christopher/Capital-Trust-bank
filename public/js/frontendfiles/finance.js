const savingsBtn = document.getElementById("savingsBtn");
const loansBtn = document.getElementById("loansBtn");
const savingsSection = document.getElementById("savingsSection");
const loansSection = document.getElementById("loansSection");
const openSavingsFormBtn = document.getElementById("openSavingsFormBtn");
const savingsForm = document.getElementById("savingsForm");
const openLoanFormBtn = document.getElementById("openLoanFormBtn");
const loanForm = document.getElementById("loanForm");

const loanProcessingModal = document.getElementById("loanProcessingModal");
const loanSpinner = document.getElementById("loanSpinner");
const loanSuccess = document.getElementById("loanSuccess");
const loanFailure = document.getElementById("loanFailure");
const closeLoanModalBtn = document.getElementById("closeLoanModalBtn");

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

openSavingsFormBtn.addEventListener("click", () => {
  savingsForm.classList.toggle("hidden");
});

openLoanFormBtn.addEventListener("click", () => {
  loanForm.classList.toggle("hidden");
});

loanForm.addEventListener("submit", (e) => {
  e.preventDefault();
  loanSpinner.classList.remove("hidden");
  loanSuccess.classList.add("hidden");
  loanFailure.classList.add("hidden");
  loanProcessingModal.classList.remove("hidden");

  // Simulate loan processing delay
  setTimeout(() => {
    loanSpinner.classList.add("hidden");
    // Randomly show success or failure for demo
    if (Math.random() < 0.8) {
      loanSuccess.classList.remove("hidden");
    } else {
      loanFailure.classList.remove("hidden");
    }
  }, 3000);
});

closeLoanModalBtn.addEventListener("click", () => {
  loanProcessingModal.classList.add("hidden");
});
