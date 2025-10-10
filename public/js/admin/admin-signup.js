document
  .getElementById("admin-signup")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      email: e.target.email.value,
      name: e.target.name.value,
      password: e.target.password.value,
    };
    const response = await fetch("/admin/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (response.ok) {
      showToast("Registration successful", "success");
      setTimeout(() => (window.location.href = "/admin/login"), 1500);
    } else {
      const errorMessage =
        result.error ||
        (result.errors && result.errors.length > 0 && result.errors[0].msg) ||
        "Registration failed";
      showToast(errorMessage, "error");
    }
  });
