function toggleBalance() {
  const balance = document.getElementById("balanceAmount");
  const icon = document.getElementById("balanceIcon");
  if (balance.innerText !== "••••••••") {
    balance.innerText = "••••••••";
    icon.classList.replace("fa-eye", "fa-eye-slash");
  } else {
    balance.innerText = "$12,340.75";
    icon.classList.replace("fa-eye-slash", "fa-eye");
  }
}
