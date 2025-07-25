function togglePassword(inputId, icon) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

const generatingPinModal = document.getElementById("generatingPinModal");
const pinsetModal = document.getElementById("pinsetModal");
const successsetIcon = document.getElementById("successIcon");
const failuresetIcon = document.getElementById("failureIcon");

function closeSetPinModal() {
  pinsetModal.classList.add("hidden");
}
window.closeSetPinModal = closeSetPinModal;

const setPinForm = document.getElementById("setPinForm");
const Pin = document.getElementById("Pin");
const ConfirmPin = document.getElementById("confirmPin");
const confirmPinbtn = document.getElementById("confirmPin-btn");
const confirmPintext = document.getElementById("confirmPin-text");
const spinner = document.getElementById("spinner");

setPinForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  generatingPinModal.classList.remove("hidden");

  confirmPinbtn.disabled = true;
  confirmPintext.textContent = "Processing";
  spinner.classList.remove("hidden");

  try {
    const data = {
      Pin: Pin.value,
      ConfirmPin: ConfirmPin.value,
    };

    if (ConfirmPin.value !== Pin.value) {
      generatingPinModal.classList.add("hidden");
      showToast("Pin does not match");
      confirmPinbtn.disabled = false;
      confirmPintext.textContent = "Set pin";
      spinner.classList.add("hidden");
      return;
    }

    const response = await fetch("/user/secure/ctb/setpaymentpin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const responseData = await response.json();
      if (!response.ok) {
        generatingPinModal.classList.add("hidden");
        successsetIcon.classList.add("hidden");
        failuresetIcon.classList.remove("hidden");
        pinsetModal.classList.remove("hidden");

        const failureMessageElem = document.getElementById("failureMessage");
        if (failureMessageElem) {
          failureMessageElem.textContent =
            responseData.error ||
            responseData.message ||
            "Failed to set payment PIN.";
        }

        confirmPinbtn.disabled = false;
        confirmPintext.textContent = "Set pin";
        spinner.classList.add("hidden");
        return;
      }

      generatingPinModal.classList.add("hidden");
      successsetIcon.classList.remove("hidden");
      failuresetIcon.classList.add("hidden");
      pinsetModal.classList.remove("hidden");

      const failureMessageElem = document.getElementById("failureMessage");
      if (failureMessageElem) {
        failureMessageElem.textContent = "";
      }

      setPinForm.reset();
      setTimeout(() => {
        window.location.href = `/udp/dashboard`;
      }, 2000);

      confirmPinbtn.disabled = false;
      confirmPintext.textContent = "Set pin";
      spinner.classList.add("hidden");
    } else {
      const text = await response.text();
      console.error("Non-JSON response:", text);
      generatingPinModal.classList.add("hidden");
      showToast("Server error: non-JSON response");
      confirmPinbtn.disabled = false;
      confirmPintext.textContent = "Set pin";
      spinner.classList.add("hidden");
    }
  } catch (err) {
    console.error("Error setting pin:", err);
    generatingPinModal.classList.add("hidden");
    showToast("Network error. Please try again later.");
    confirmPinbtn.disabled = false;
    confirmPintext.textContent = "Set pin";
    spinner.classList.add("hidden");
  }
});
