document.addEventListener("DOMContentLoaded", function () {
  // Elements
  const loginSection = document.getElementById("login-section");
  const otpSection = document.getElementById("otp-section");
  const loginForm = document.getElementById("login");
  const loginBtn = document.getElementById("login-btn");
  const loginText = document.getElementById("login-text");
  const spinner = document.getElementById("spinner");
  const loginErrorMsg = document.getElementById("login-error-msg");
  const loginErrorText = document.getElementById("login-error-text");

  const loginOtpForm = document.getElementById("loginOtpForm");
  const otpInput = document.getElementById("otpInput");
  const verifyOtpBtn = document.getElementById("verifyOtpBtn");
  const verifyOtpText = document.getElementById("verifyOtpText");
  const otpSpinner = document.getElementById("otpSpinner");
  const otpErrorMsg = document.getElementById("otpErrorMsg");
  const otpErrorText = document.getElementById("otpErrorText");
  const otpSuccessMsg = document.getElementById("otpSuccessMsg");
  const otpSuccessText = document.getElementById("otpSuccessText");
  const userEmailSpan = document.getElementById("userEmailSpan");
  const resendOtpBtn = document.getElementById("resendOtpBtn");
  const backToLoginBtn = document.getElementById("backToLoginBtn");

  const loginBlockedModal = document.getElementById("loginBlockedModal");
  const loginBlockedModalMessage = document.getElementById("loginBlockedModalMessage");
  const loginBlockedModalClose = document.getElementById("loginBlockedModalClose");

  // Determine dynamic base path (/user/secure/fubank or /user/secure/ctb)
  const isFubank = window.location.pathname.includes("fubank");
  const postBasePath = isFubank ? "/user/secure/fubank" : "/user/secure/ctb";

  function showToastMessage(msg, isSuccess = false) {
    if (typeof showToast === "function") {
      showToast(msg);
    }
  }

  // 1. Handle Login Form Submission
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (loginErrorMsg) loginErrorMsg.classList.add("hidden");

      const emailVal = document.getElementById("email")?.value.trim();
      const passwordVal = document.getElementById("password")?.value;

      if (!emailVal || !passwordVal) {
        if (loginErrorMsg && loginErrorText) {
          loginErrorText.textContent = "Please provide both your email address and password.";
          loginErrorMsg.classList.remove("hidden");
        }
        return;
      }

      loginBtn.disabled = true;
      loginText.textContent = "Signing In...";
      if (spinner) spinner.classList.remove("hidden");

      try {
        const res = await fetch(`${postBasePath}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Email: emailVal, Password: passwordVal }),
          credentials: "include",
        });

        const result = await res.json();

        if (res.ok && result.requiresOtp) {
          // Smoothly switch to Step 2: OTP Card
          if (loginSection) loginSection.classList.add("hidden");
          if (otpSection) otpSection.classList.remove("hidden");
          if (userEmailSpan) userEmailSpan.textContent = result.email || emailVal;

          if (otpInput) {
            otpInput.value = "";
            otpInput.focus();
          }
        } else if (res.ok && (result.message === "Login successful" || result.success)) {
          loginText.textContent = "Redirecting...";
          window.location.href = result.redirect || "/udp/dashboard";
        } else {
          if (result.loginBlocked) {
            if (loginBlockedModalMessage) {
              loginBlockedModalMessage.textContent =
                result.error || "Login access blocked. Please contact support.";
            }
            if (loginBlockedModal) {
              loginBlockedModal.classList.remove("hidden");
              loginBlockedModal.classList.add("flex");
            }
          } else {
            let errorText = result.error || "Invalid email or password.";
            if (Array.isArray(result.errors) && result.errors.length > 0) {
              errorText = result.errors.map((err) => err.msg).join(" | ");
            }
            if (loginErrorMsg && loginErrorText) {
              loginErrorText.textContent = errorText;
              loginErrorMsg.classList.remove("hidden");
            }
            showToastMessage(errorText);
          }
        }
      } catch (err) {
        console.error("Login fetch error:", err);
        const netErr = "Network error connecting to server. Please try again.";
        if (loginErrorMsg && loginErrorText) {
          loginErrorText.textContent = netErr;
          loginErrorMsg.classList.remove("hidden");
        }
        showToastMessage(netErr);
      } finally {
        loginBtn.disabled = false;
        loginText.textContent = "Sign In";
        if (spinner) spinner.classList.add("hidden");
      }
    });
  }

  // 2. Handle OTP Verification Submission
  if (loginOtpForm) {
    loginOtpForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (otpErrorMsg) otpErrorMsg.classList.add("hidden");
      if (otpSuccessMsg) otpSuccessMsg.classList.add("hidden");

      const codeVal = otpInput?.value.trim();
      if (!codeVal || codeVal.length !== 6) {
        if (otpErrorMsg && otpErrorText) {
          otpErrorText.textContent = "Please enter the complete 6-digit verification code.";
          otpErrorMsg.classList.remove("hidden");
        }
        return;
      }

      verifyOtpBtn.disabled = true;
      verifyOtpText.textContent = "Verifying...";
      if (otpSpinner) otpSpinner.classList.remove("hidden");

      try {
        const res = await fetch(`${postBasePath}/verify-login-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otp: codeVal }),
          credentials: "include",
        });

        const result = await res.json();

        if (res.ok && result.success) {
          verifyOtpText.textContent = "Verified!";
          if (otpSuccessMsg && otpSuccessText) {
            otpSuccessText.textContent = "Code verified! Redirecting to your dashboard...";
            otpSuccessMsg.classList.remove("hidden");
          }
          setTimeout(() => {
            window.location.href = result.redirect || "/udp/dashboard";
          }, 400);
        } else {
          const errText = result.error || "Invalid or expired verification code.";
          if (otpErrorMsg && otpErrorText) {
            otpErrorText.textContent = errText;
            otpErrorMsg.classList.remove("hidden");
          }
          showToastMessage(errText);
          verifyOtpBtn.disabled = false;
          verifyOtpText.textContent = "Verify & Enter Dashboard";
          if (otpSpinner) otpSpinner.classList.add("hidden");
        }
      } catch (err) {
        console.error("OTP verification error:", err);
        const errText = "Network error verifying code. Please try again.";
        if (otpErrorMsg && otpErrorText) {
          otpErrorText.textContent = errText;
          otpErrorMsg.classList.remove("hidden");
        }
        showToastMessage(errText);
        verifyOtpBtn.disabled = false;
        verifyOtpText.textContent = "Verify & Enter Dashboard";
        if (otpSpinner) otpSpinner.classList.add("hidden");
      }
    });
  }

  // 3. Handle Resend OTP Code
  if (resendOtpBtn) {
    resendOtpBtn.addEventListener("click", async function (e) {
      e.preventDefault();
      if (otpErrorMsg) otpErrorMsg.classList.add("hidden");
      if (otpSuccessMsg) otpSuccessMsg.classList.add("hidden");

      resendOtpBtn.disabled = true;
      const originalText = resendOtpBtn.textContent;
      resendOtpBtn.textContent = "Sending...";

      try {
        const res = await fetch(`${postBasePath}/resend-login-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        const result = await res.json();

        if (res.ok) {
          const successMsg = result.message || "A new 6-digit code has been sent to your email.";
          if (otpSuccessMsg && otpSuccessText) {
            otpSuccessText.textContent = successMsg;
            otpSuccessMsg.classList.remove("hidden");
          }
          showToastMessage(successMsg, true);

          // 60-second cooldown
          let secondsLeft = 60;
          const interval = setInterval(() => {
            secondsLeft--;
            if (secondsLeft > 0) {
              resendOtpBtn.textContent = `Resend (${secondsLeft}s)`;
            } else {
              clearInterval(interval);
              resendOtpBtn.disabled = false;
              resendOtpBtn.textContent = originalText;
            }
          }, 1000);
        } else {
          const failMsg = result.error || "Failed to resend code. Please try again.";
          if (otpErrorMsg && otpErrorText) {
            otpErrorText.textContent = failMsg;
            otpErrorMsg.classList.remove("hidden");
          }
          showToastMessage(failMsg);
          resendOtpBtn.disabled = false;
          resendOtpBtn.textContent = originalText;
        }
      } catch (err) {
        console.error("Resend OTP error:", err);
        const failMsg = "Network error resending code.";
        if (otpErrorMsg && otpErrorText) {
          otpErrorText.textContent = failMsg;
          otpErrorMsg.classList.remove("hidden");
        }
        resendOtpBtn.disabled = false;
        resendOtpBtn.textContent = originalText;
      }
    });
  }

  // 4. Handle Back to Login
  if (backToLoginBtn) {
    backToLoginBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (otpSection) otpSection.classList.add("hidden");
      if (loginSection) loginSection.classList.remove("hidden");
      if (loginErrorMsg) loginErrorMsg.classList.add("hidden");
      if (otpErrorMsg) otpErrorMsg.classList.add("hidden");
      if (otpSuccessMsg) otpSuccessMsg.classList.add("hidden");
    });
  }

  // 5. Handle Blocked Modal Close
  if (loginBlockedModalClose) {
    loginBlockedModalClose.addEventListener("click", function () {
      if (loginBlockedModal) {
        loginBlockedModal.classList.add("hidden");
        loginBlockedModal.classList.remove("flex");
      }
    });
  }
});
