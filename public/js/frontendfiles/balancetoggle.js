let balanceVisible = true;

const balance = document.getElementById("balanceAmount");
const icon = document.getElementById("balanceIcon");

function toggleBalance() {
  balanceVisible = !balanceVisible;
  if (balanceVisible) {
    balance.style.filter = "none";
    icon.classList.replace("fa-eye-slash", "fa-eye");
  } else {
    balance.style.filter = "blur(6px)";
    icon.classList.replace("fa-eye", "fa-eye-slash");
  }
}

window.onload = () => {
  balance.style.filter = "none";
};
