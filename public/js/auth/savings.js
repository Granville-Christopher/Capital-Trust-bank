const API_BASE = "/user";

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
      const savingsSection = document.getElementById("savingsSection");
      savingsSection.innerHTML = ""; 

      data.forEach((saving) => {
        const card = document.createElement("div");
        card.className = "bg-white rounded-xl shadow p-6 mb-4 relative";

        card.innerHTML = `
          <p class="text-lg font-semibold mb-2">Savings Balance</p>
          <p class="text-3xl font-bold text-blue-600 mb-4">$${parseFloat(
            saving.principal
          ).toLocaleString()}</p>

          <div class="flex justify-between text-sm text-gray-600 mb-4">
            <span>Today's Interest: $${parseFloat(saving.todayInterest).toFixed(
              2
            )}</span>
            <span>Total Interest: $${parseFloat(saving.totalInterest).toFixed(
              2
            )}</span>
          </div>

          <div class="flex gap-4 mt-4">
            <button class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-medium w-1/2 withdraw-btn" data-id="${
              saving.id
            }">
              Withdraw Interest
            </button>
            <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium w-1/2 compound-btn" data-id="${
              saving.id
            }">
              Compound Interest
            </button>
          </div>

          <div class="flex gap-4 mt-4">
            <button class="mt-4 w-full py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition cancel-btn" data-id="${
              saving.id
            }">
              Cancel Savings
            </button>
          </div>
        `;

        savingsSection.appendChild(card);
      });

      document.querySelectorAll(".withdraw-btn").forEach((btn) => {
        btn.addEventListener("click", () => withdrawInterest(btn.dataset.id));
      });

      document.querySelectorAll(".compound-btn").forEach((btn) => {
        btn.addEventListener("click", () => compoundInterest(btn.dataset.id));
      });

      document.querySelectorAll(".cancel-btn").forEach((btn) => {
        btn.addEventListener("click", () => cancelSavings(btn.dataset.id));
      });
    } else {
      console.error("Error loading savings data:", data.error);
    }
  } catch (error) {
    console.error("Fetch Error:", error);
  }
}
async function withdrawInterest(id) {
  try {
    const res = await fetch(`${API_BASE}/secure/ctb/${id}/withdraw-interest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();

    if (res.ok) {
      showToast(data.message, "success");
      loadSavingsData();
    } else {
      showToast(data.error || "Error withdrawing interest", "error");
    }
  } catch (error) {
    console.error("Withdraw Error:", error);
    showToast("Network error while withdrawing", "error");
  }
}

async function compoundInterest(id) {
  try {
    const res = await fetch(`${API_BASE}/secure/ctb/${id}/compound-interest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();

    if (res.ok) {
      showToast(data.message, "success");
      loadSavingsData();
    } else {
      showToast(data.error || "Error compounding interest", "error");
    }
  } catch (error) {
    console.error("Compound Error:", error);
    showToast("Network error while compounding", "error");
  }
}

async function cancelSavings(id) {
  if (
    !confirm(
      "Are you sure you want to cancel your savings? You will lose all interest earned."
    )
  ) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/secure/ctb/${id}/cancel-savings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const data = await res.json();

    if (res.ok) {
      showToast(data.message, "success");
      loadSavingsData();
    } else {
      showToast(data.error || "Error canceling savings", "error");
    }
  } catch (error) {
    console.error("Cancel Savings Error:", error);
    showToast("Network error. Please try again.", "error");
  }
}

loadSavingsData();
