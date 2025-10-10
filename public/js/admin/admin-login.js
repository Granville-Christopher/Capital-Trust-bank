document.getElementById("admin-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    email: e.target.email.value,
    password: e.target.password.value,
  };
  const response = await fetch("/admin/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (response.ok) {
    showToast("Login successful", "success");
    setTimeout(() => (window.location.href = "/admin/dashboard"), 1500);
  } else {
    showToast(result.error || "Login failed", "error");
  }
});
