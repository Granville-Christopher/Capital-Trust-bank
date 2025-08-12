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
    pinInputs.forEach((input) => {
      pin += input.value;
    });
    if (pin.length === 4) {
      generatingModal.classList.remove("hidden");

      setTimeout(() => {
        generatingModal.classList.add("hidden");

        fetch("/user/secure/ctb/set-credit-card-pin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pin: pin,
          }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to set PIN");
            }
            return response.json();
          })
          .then((data) => {
            console.log(data.message);
            successIcon.classList.remove("hidden");
            failureIcon.classList.add("hidden");
            pinModal.classList.remove("hidden");
          })
          .catch((err) => {
            console.error("Error setting PIN:", err);
            successIcon.classList.add("hidden");
            failureIcon.classList.remove("hidden");
            pinModal.classList.remove("hidden");
          })
          .finally(() => {
            setTimeout(() => {
              window.location.href = "/udp/creditcard";
            }, 2000);
          });
      }, 2000);
    } else {
      alert("Please enter a 4-digit PIN.");
    }
  });
});
