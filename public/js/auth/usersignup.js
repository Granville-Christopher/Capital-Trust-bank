const form = document.getElementById("signup");
const signupBtn = document.getElementById("signup-btn");
const signupText = document.getElementById("signup-text");
const spinner = document.getElementById("spinner");

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  signupBtn.disabled = true;
  signupText.textContent = "Processing";
  spinner.classList.remove("hidden");

  try {
    const data = {
      Email: document.getElementById("email").value,
      Name: document.getElementById("name").value,
      Password: document.getElementById("password").value,
    };

    const response = await fetch("/user/secure/ctb/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      if (!response.ok) {
        const errorMsg =
          data.errors?.map((err) => err.msg).join("\n") ||
          data.error ||
          data.message ||
          "Signup failed.";
        showToast(errorMsg);

        signupText.textContent = "Sign Up";
        spinner.classList.add("hidden");
        signupBtn.disabled = false;
        return;
      }

      form.reset();
      window.location.href = "/udp/dashboard";
      signupText.textContent = "Sign Up";
      spinner.classList.add("hidden");
      signupBtn.disabled = false;
    } else {
      const text = await response.text();
      console.error("Non-JSON response:", text);
      showToast("Server error: non-JSON response");
      signupText.textContent = "Sign Up";
      spinner.classList.add("hidden");
      signupBtn.disabled = false;
    }
  } catch (error) {
    console.error("Fetch error:", error);
    showToast("Network error. Please try again later.");
    signupText.textContent = "Sign Up";
    spinner.classList.add("hidden");
    signupBtn.disabled = false;
  }
});
