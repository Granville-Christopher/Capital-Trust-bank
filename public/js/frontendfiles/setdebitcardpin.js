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

document.addEventListener("DOMContentLoaded", () => {
  setupInputs(".pin-box");

  const setPinBtn = document.getElementById("setPinBtn");
  const generatingModal = document.getElementById("generatingModal");
  const pinModal = document.getElementById("pinModal");
  const successIcon = document.getElementById("successIcon");
  const failureIcon = document.getElementById("failureIcon");

  function closePinModal() {
    pinModal.classList.add("hidden");
  }
  window.closePinModal = closePinModal;

  setPinBtn.addEventListener("click", () => {
    const pinInputs = document.querySelectorAll(".pin-box");
    let pin = "";
    pinInputs.forEach(input => {
      pin += input.value;
    });
    if (pin.length === 4) {
      generatingModal.classList.remove("hidden");
      // Simulate async operation
      setTimeout(() => {
        generatingModal.classList.add("hidden");
        successIcon.classList.remove("hidden");
        failureIcon.classList.add("hidden");
        pinModal.classList.remove("hidden");
      }, 2000);
    } else {
      alert("Please enter a 4-digit PIN.");
    }
  });
});
