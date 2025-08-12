document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "/user";

  const savingsBalanceEl = document.getElementById("savingsBalance");
  const todayInterestEl = document.getElementById("todayInterest");
  const totalInterestEl = document.getElementById("totalInterest");

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

  async function loadSavingsSummary() {
    try {
      const res = await fetch(`${API_BASE}/secure/ctb/summary-savings`);
      const data = await res.json();

      if (res.ok) {
        savingsBalanceEl.textContent = `$${parseFloat(
          data.totalPrincipal
        ).toLocaleString()}`;
        todayInterestEl.textContent = `Today's Interest: $${parseFloat(
          data.todayInterest
        ).toFixed(2)}`;
        totalInterestEl.textContent = `Total Interest: $${parseFloat(
          data.totalInterest
        ).toFixed(2)}`;
      } else {
        console.error("Error loading savings summary:", data.error);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    }
  }

  async function withdrawAllInterest() {
    try {
      const res = await fetch(`${API_BASE}/secure/ctb/withdraw-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message, "success");
        loadSavingsSummary();
      } else {
        showToast(
          data.error || data.message || "Error withdrawing all interest",
          "error"
        );
      }
    } catch (error) {
      console.error("Withdraw All Error:", error);
      showToast("Network error while withdrawing", "error");
    }
  }

  async function compoundAllInterest() {
    try {
      const res = await fetch(`${API_BASE}/secure/ctb/compound-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message, "success");
        loadSavingsSummary();
      } else {
        showToast(
          data.error || data.message || "Error compounding all interest",
          "error"
        );
      }
    } catch (error) {
      console.error("Compound All Error:", error);
      showToast("Network error while compounding", "error");
    }
  }

  document
    .getElementById("withdrawInterestBtn")
    .addEventListener("click", withdrawAllInterest);
  document
    .getElementById("compoundInterestBtn")
    .addEventListener("click", compoundAllInterest);

  loadSavingsSummary();
});
