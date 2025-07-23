let creditInfoVisible = false;
let debitInfoVisible = false;

const creditCardNumber = document.getElementById("creditCardNumber");
const debitCardNumber = document.getElementById("debitCardNumber");
const creditCardCVV = document.getElementById("creditCardCVV");
const debitCardCVV = document.getElementById("debitCardCVV");
const toggleCreditInfoBtn = document.getElementById("toggleCreditInfo");
const toggleDebitInfoBtn = document.getElementById("toggleDebitInfo");
const creditEyeIcon = document.getElementById("creditEyeIcon");
const debitEyeIcon = document.getElementById("debitEyeIcon");

function toggleCreditInfo() {
  creditInfoVisible = !creditInfoVisible;
  if (creditInfoVisible) {
    creditCardNumber.style.filter = "none";
    creditCardCVV.style.filter = "none";
    creditEyeIcon.classList.remove("fa-eye");
    creditEyeIcon.classList.add("fa-eye-slash");
    toggleCreditInfoBtn.querySelector("span").textContent = "Hide Credit Card Info";
  } else {
    creditCardNumber.style.filter = "blur(6px)";
    creditCardCVV.style.filter = "blur(6px)";
    creditEyeIcon.classList.remove("fa-eye-slash");
    creditEyeIcon.classList.add("fa-eye");
    toggleCreditInfoBtn.querySelector("span").textContent = "Show Credit Card Info";
  }
}

function toggleDebitInfo() {
  debitInfoVisible = !debitInfoVisible;
  if (debitInfoVisible) {
    debitCardNumber.style.filter = "none";
    debitCardCVV.style.filter = "none";
    debitEyeIcon.classList.remove("fa-eye");
    debitEyeIcon.classList.add("fa-eye-slash");
    toggleDebitInfoBtn.querySelector("span").textContent = "Hide Debit Card Info";
  } else {
    debitCardNumber.style.filter = "blur(6px)";
    debitCardCVV.style.filter = "blur(6px)";
    debitEyeIcon.classList.remove("fa-eye-slash");
    debitEyeIcon.classList.add("fa-eye");
    toggleDebitInfoBtn.querySelector("span").textContent = "Show Debit Card Info";
  }
}

toggleCreditInfoBtn.addEventListener("click", toggleCreditInfo);
toggleDebitInfoBtn.addEventListener("click", toggleDebitInfo);

// Initialize masked numbers and CVVs on page load
window.onload = () => {
  creditCardNumber.style.filter = "blur(6px)";
  creditCardCVV.style.filter = "blur(6px)";
  debitCardNumber.style.filter = "blur(6px)";
  debitCardCVV.style.filter = "blur(6px)";
};
