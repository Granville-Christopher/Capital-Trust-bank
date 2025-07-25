const form = document.getElementById("internationaltransfer");
const internationaltransferBtn = document.getElementById(
  "internationaltransfer-btn"
);
const internationaltransferText = document.getElementById(
  "internationaltransfer-text"
);
const spinner = document.getElementById("spinner");

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  internationaltransferBtn.disabled = true;
  internationaltransferText.textContent = "Processing";
  spinner.classList.remove("hidden");

  try {
    const data = {
      FullName: document.getElementById("fName").value,
      Amount: document.getElementById("Amount").value,
      AccountNumber: document.getElementById("Acount_number").value,
      BankName: document.getElementById("Bank").value,
      Address: document.getElementById("Address").value,
      Iban: document.getElementById("Iban").value,
    };

    const response = await fetch("/user/secure/ctb/internationaltransfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      if (!response.ok) {
        const errorMsg =
          data.errors?.map((err) => err.msg).join("\n") ||
          data.error ||
          data.message ||
          "Transfer failed.";
        showToast(errorMsg);

        internationaltransferText.textContent = "Initiate transfer";
        spinner.classList.add("hidden");
        internationaltransferBtn.disabled = false;
        return;
      }

      form.reset();
      const transferId = data.transferId;
      if (transferId) {
        window.location.href = `/user/secure/ctb/confirmtransfer/${transferId}`;
      } else {
        window.location.href = "/udp/confirmtransfer";
      }
      internationaltransferText.textContent = "Initiate transfer";
      spinner.classList.add("hidden");
      internationaltransferBtn.disabled = false;
    } else {
      const text = await response.text();
      console.error("Non-JSON response:", text);
      showToast("Server error: non-JSON response");
      internationaltransferText.textContent = "Initiate transfer";
      spinner.classList.add("hidden");
      internationaltransferBtn.disabled = false;
    }
  } catch (error) {
    console.error("Fetch error:", error);
    showToast("Network error. Please try again later.");
    internationaltransferText.textContent = "Initiate transfer";
    spinner.classList.add("hidden");
    internationaltransferBtn.disabled = false;
  }
});
