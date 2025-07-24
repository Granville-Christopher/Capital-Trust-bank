function showSuccessModal() {
  // show modal with success
  document.getElementById("transferModal").classList.remove("hidden");
  document.getElementById("successIcon").classList.remove("hidden");
  document.getElementById("failureIcon").classList.add("hidden");

  // Simulate failure (optional)
  setTimeout(() => {
    document.getElementById("successIcon").classList.add("hidden");
    document.getElementById("failureIcon").classList.remove("hidden");
  }, 2000);
}

function showFailureModal() {
  document.getElementById("transferModal").classList.remove("hidden");
  document.getElementById("successIcon").classList.add("hidden");
  document.getElementById("failureIcon").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("transferModal").classList.add("hidden");
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
