const API_BASE = "/user";

const savingsBalanceEl = document.getElementById("savingsBalance");
const todayInterestEl = document.getElementById("todayInterest");
const totalInterestEl = document.getElementById("totalInterest");
const withdrawBtn = document.getElementById("withdrawInterestBtn");
const compoundBtn = document.getElementById("compoundInterestBtn");
const cancelBtn = document.getElementById("cancelSavingsBtn");

const toastContainer = document.createElement("div");
toastContainer.id = "toast";
toastContainer.className =
  "fixed bottom-5 right-5 z-[9999] bg-gray-800 text-white px-4 py-2 rounded shadow-lg opacity-0 transition-opacity duration-300 pointer-events-none";
toastContainer.innerHTML = `
  <div id="toast-message" class="flex items-center space-x-2">
    <i id="toast-icon" class="fas"></i>
    <span id="toast-text"></span>
  </div>
`;
document.body.appendChild(toastContainer);

const toast = document.getElementById("toast");
const toastText = document.getElementById("toast-text");
const toastIcon = document.getElementById("toast-icon");

function showToast(message, type = "info", duration = 3000) {
  toastIcon.className = "fas";
  toast.className = toast.className.replace(/bg-\w+-\d+/g, "");

  switch (type) {
    case "success":
      toastIcon.classList.add("fa-check-circle", "text-green-500");
      toast.classList.add("bg-green-700");
      break;
    case "error":
      toastIcon.classList.add("fa-exclamation-circle", "text-red-500");
      toast.classList.add("bg-red-700");
      break;
    case "warning":
      toastIcon.classList.add("fa-exclamation-triangle", "text-yellow-400");
      toast.classList.add("bg-yellow-600");
      break;
    default:
      toastIcon.classList.add("fa-info-circle", "text-blue-500");
      toast.classList.add("bg-blue-700");
  }

  toastText.textContent = message;

  toast.classList.remove("opacity-0", "pointer-events-none");

  setTimeout(() => {
    toast.classList.add("opacity-0", "pointer-events-none");
  }, duration);
}

async function loadSavingsData() {
  try {
    const res = await fetch(`${API_BASE}/secure/ctb/viewsavings`);
    const data = await res.json();

    if (res.ok) {
      savingsBalanceEl.textContent = `$${parseFloat(
        data.principal
      ).toLocaleString()}`;
      todayInterestEl.textContent = `Today's Interest: $${parseFloat(
        data.todayInterest
      ).toFixed(2)}`;
      totalInterestEl.textContent = `Total Interest: $${parseFloat(
        data.totalInterest
      ).toFixed(2)}`;
      location.reload();
    } else {
      console.error("Error loading savings data:", data.error);
    }
  } catch (error) {
    console.error("Fetch Error:", error);
  }
}

async function withdrawInterest() {
  try {
    const res = await fetch(`${API_BASE}/secure/ctb/withdraw-interest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();

    if (res.ok) {
      showToast(data.message, "success");
      loadSavingsData();
      location.reload();
    } else {
      showToast(data.error || "Error withdrawing interest", "error");
    }
  } catch (error) {
    console.error("Withdraw Error:", error);
    showToast("Network error while withdrawing", "error");
  }
}

async function compoundInterest() {
  try {
    const res = await fetch(`${API_BASE}/secure/ctb/compound-interest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();

    if (res.ok) {
      showToast(data.message, "success");
      loadSavingsData();
      location.reload();
    } else {
      showToast(data.error || "Error compounding interest", "error");
    }
  } catch (error) {
    console.error("Compound Error:", error);
    showToast("Network error while compounding", "error");
  }
}

async function cancelSavings() {
  if (
    !confirm(
      "Are you sure you want to cancel your savings? You will lose all interest earned."
    )
  ) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/secure/ctb/cancel-savings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await res.json();

    if (res.ok) {
      showToast(data.message, "success");
      loadSavingsData();
      location.reload();
    } else {
      showToast(data.error || "Error canceling savings", "error");
    }
  } catch (error) {
    console.error("Cancel Savings Error:", error);
    showToast("Network error. Please try again.", "error");
  }
}

if (cancelBtn) {
  cancelBtn.addEventListener("click", cancelSavings);
}

withdrawBtn.addEventListener("click", withdrawInterest);
compoundBtn.addEventListener("click", compoundInterest);

loadSavingsData();
