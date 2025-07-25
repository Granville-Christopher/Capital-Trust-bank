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

const generatingModal = document.getElementById("generatingModal");
const pinModal = document.getElementById("pinModal");
const successIcon = document.getElementById("successIcon");
const failureIcon = document.getElementById("failureIcon");

function closePinModal() {
  pinModal.classList.add("hidden");
}
window.closePinModal = closePinModal;

document
  .getElementById("changePinForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    generatingModal.classList.remove("hidden");

    const oldPin = document.getElementById("oldPin").value;
    const newPin = document.getElementById("newPin").value;
    const confirmNewPin = document.getElementById("confirmNewPin").value;

    if (newPin !== confirmNewPin) {
      generatingModal.classList.add("hidden");
      showToast("New PIN and Confirm New PIN do not match");
      return;
    }

    try {
      const response = await fetch("/user/secure/ctb/changepaymentpin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPin, newPin }),
      });

      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (!response.ok) {
          generatingModal.classList.add("hidden");
          successIcon.classList.add("hidden");
          failureIcon.classList.remove("hidden");
          pinModal.classList.remove("hidden");

          const failureMessageElem = document.getElementById("failureMessage");
          if (failureMessageElem) {
            failureMessageElem.textContent =
              data.error || data.message || "Failed to change payment PIN.";
          }

          return;
        }

        generatingModal.classList.add("hidden");
        successIcon.classList.remove("hidden");
        failureIcon.classList.add("hidden");
        pinModal.classList.remove("hidden");

        setTimeout(() => {
          window.location.href = `/udp/dashboard`;
        }, 2000);
      } else {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        generatingModal.classList.add("hidden");
        showToast("Server error: non-JSON response");
      }
    } catch (err) {
      console.error("Error changing pin:", err);
      generatingModal.classList.add("hidden");
      showToast("Network error. Please try again later.");
    }
  });
