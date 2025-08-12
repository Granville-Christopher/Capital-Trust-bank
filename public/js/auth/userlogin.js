const loginForm = document.getElementById("login");
const loginBtn = document.getElementById("login-btn");
const loginText = document.getElementById("login-text");
const spinner = document.getElementById("spinner");

// Create modal in DOM
const modalHTML = `
<div id="kycModal" class="fixed inset-0 bg-black bg-opacity-50 hidden justify-center items-center z-50">
  <div class="bg-white p-6 max-w-lg w-full shadow-lg">
    <h2 class="text-lg font-bold mb-4" id="kycModalTitle">KYC Notice</h2>
    <p class="text-gray-700 mb-6" id="kycModalMessage"></p>
    <div class="flex justify-end space-x-2">
      <button id="kycModalClose" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Close</button>
      <button id="kycModalAction" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 hidden">Go to KYC</button>
    </div>
  </div>
</div>
`;
document.body.insertAdjacentHTML("beforeend", modalHTML);

// Modal controls
const kycModal = document.getElementById("kycModal");
const kycModalMessage = document.getElementById("kycModalMessage");
const kycModalAction = document.getElementById("kycModalAction");
document.getElementById("kycModalClose").addEventListener("click", () => {
  kycModal.classList.add("hidden");
});
kycModalAction.addEventListener("click", () => {
  window.location.href = "/secure/ctb/kyc";
});

loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData(loginForm);
  const data = Object.fromEntries(formData.entries());

  loginBtn.disabled = true;
  loginText.textContent = "Processing";
  spinner.classList.remove("hidden");

  try {
    const res = await fetch("/user/secure/ctb/login", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const result = await res.json();

    if (res.ok) {
      loginText.textContent = "Logged In!";
      spinner.classList.add("hidden");
      setTimeout(() => {
        window.location.href = "/udp/dashboard";
      }, 1000);
    } else {
      if (result.kycStatus === "not_submitted") {
        kycModalMessage.textContent = result.error;
        kycModalAction.classList.remove("hidden");
        kycModal.classList.remove("hidden");
        setTimeout(() => {
          window.location.href = "/secure/ctb/kyc";
        }, 1000);
      } else if (result.kycStatus === "under_review") {
        kycModalMessage.textContent = result.error;
        kycModalAction.classList.add("hidden");
        kycModal.classList.remove("hidden");
      } else {
        let errorMessage = "Login failed";
        if (Array.isArray(result.errors)) {
          errorMessage = result.errors.map((err) => err.msg).join(" | ");
        } else if (result.error) {
          errorMessage = result.error;
        }
        showToast(errorMessage);
      }

      loginBtn.disabled = false;
      loginText.textContent = "Log in";
      spinner.classList.add("hidden");
    }
  } catch (error) {
    showToast("Network error. Please try again.");
    loginBtn.disabled = false;
    loginText.textContent = "Log in";
    spinner.classList.add("hidden");
  }
});
