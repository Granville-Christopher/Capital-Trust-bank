let selectedCard = null;

function showCardTypeSelector() {
  document.getElementById("cardTypeSelector").classList.remove("hidden");
}

function selectCard(type) {
  selectedCard = type;
  const master = document.getElementById("mastercardOption");
  const visa = document.getElementById("visaOption");
  master.classList.remove("border-blue-600", "bg-blue-50");
  visa.classList.remove("border-blue-600", "bg-blue-50");

  if (type === "mastercard") {
    master.classList.add("border-blue-600", "bg-blue-50");
  } else {
    visa.classList.add("border-blue-600", "bg-blue-50");
  }
}

function confirmCardType() {
  if (!selectedCard) {
    alert("Please select a card type.");
    return;
  }
  document.getElementById("generatingModal").classList.remove("hidden");
  setTimeout(() => {
    window.location.href = "setdebitcardpin";
  }, 3000);
}

window.onload = () =>
  document.getElementById("noCardSection").classList.remove("hidden");
