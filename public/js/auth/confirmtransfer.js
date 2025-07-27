// Existing functions:
function showSuccessModal(message = "Your transaction was completed.") {
  document.getElementById("transferModal").classList.remove("hidden");
  document.getElementById("successIcon").classList.remove("hidden");
  document.getElementById("failureIcon").classList.add("hidden");
  document.getElementById("successMessage").textContent = message;
}

function showFailureModal(message = "Something went wrong. Please try again.") {
  document.getElementById("transferModal").classList.remove("hidden");
  document.getElementById("successIcon").classList.add("hidden");
  document.getElementById("failureIcon").classList.remove("hidden");
  document.getElementById("errorMessage").textContent = message;
}

function closeModal() {
  document.getElementById("transferModal").classList.add("hidden");
  if (
    document.getElementById("successIcon").classList.contains("hidden") ===
    false
  ) {
    setTimeout(() => {
      window.location.href = "/udp/dashboard";
    }, 2000);
  }
}

function setupInputs(selector) {
  const inputs = document.querySelectorAll(selector);
  inputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      if (input.value && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && index > 0) {
        inputs[index - 1].focus();
      }
    });
  });
}

setupInputs(".otp-box");
setupInputs(".pin-box");

const form = document.getElementById("confirmtransfer");

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const transferId = document.getElementById("transferId").value;

  const otpInputs = document.querySelectorAll(".otp-box");
  let otp = "";
  otpInputs.forEach((input) => {
    otp += input.value;
  });

  const pinInputs = document.querySelectorAll(".pin-box");
  let pin = "";
  pinInputs.forEach((input) => {
    pin += input.value;
  });

  if (otp.length !== 6) {
    showFailureModal("Please enter the full 6-digit OTP.");
    return;
  }
  if (pin.length !== 4) {
    showFailureModal("Please enter the full 4-digit Payment PIN.");
    return;
  }

  try {
    const requestBody = {
      transferId: transferId,
      otp: otp,
      paymentPin: pin,
    };

    const response = await fetch("/user/secure/ctb/confirmtransfer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      credentials: "include",
    });

    const data = await response.json();

    if (response.ok) {
      showSuccessModal(data.message || "Transfer successfully completed!");
    } else {
      showFailureModal(
        data.error || "Transfer failed. Please check your details."
      );
    }
  } catch (error) {
    console.error("Error during transfer verification:", error);
    showFailureModal("Network error or server unreachable. Please try again.");
  }
});
