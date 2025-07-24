const loginForm = document.getElementById("login");
const loginBtn = document.getElementById("login-btn");
const loginText = document.getElementById("login-text");
const spinner = document.getElementById("spinner");

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
    });

    const result = await res.json();
    if (res.ok) {
      loginText.textContent = "Logged In!";
      spinner.classList.add("hidden");
      setTimeout(() => {
        window.location.href = "/udp/dashboard";
        loginBtn.disabled = false;
        loginText.textContent = "Log in";
        spinner.classList.add("hidden");
      }, 1000);
    } else {
      showToast(result.error || "Login failed");
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
