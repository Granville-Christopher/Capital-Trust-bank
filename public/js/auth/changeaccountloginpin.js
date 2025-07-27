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
const form = document.getElementById("changePasswordForm");
function closePinModal() {
  pinModal.classList.add("hidden");
}
window.closePinModal = closePinModal;

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  generatingModal.classList.remove("hidden");

  const oldPassword = document.getElementById("oldPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmNewPassword =
    document.getElementById("confirmNewPassword").value;

  if (newPassword !== confirmNewPassword) {
    generatingModal.classList.add("hidden");
    showToast("New Password and Confirm New Password do not match");
    return;
  }

  try {
    const response = await fetch("/user/secure/ctb/changeaccountpassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword, newPassword }),
      credentials: 'include',
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
          let errorMessage = "Failed to change account Password.";
          if (data.error) {
            if (Array.isArray(data.error) && data.error.length > 0) {
              errorMessage = data.error[0].msg || JSON.stringify(data.error);
            } else if (typeof data.error === "string") {
              errorMessage = data.error;
            }
          } else if (data.message) {
            errorMessage = data.message;
          }
          failureMessageElem.textContent = errorMessage;
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
