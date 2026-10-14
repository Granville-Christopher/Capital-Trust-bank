const form = document.getElementById("transferform");
const transferBtn = document.getElementById("transfer-btn");
const transferText = document.getElementById("transfer-text");
const spinner = document.getElementById("spinner");

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  transferBtn.disabled = true;
  transferText.textContent = "Processing";
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

    if (
      !data.FullName ||
      !data.Amount ||
      !data.AccountNumber ||
      !data.BankName ||
      !data.Address ||
      !data.Iban
    ) {
      showToast("All fields are required");
      transferText.textContent = "Initiate transfer";
      spinner.classList.add("hidden");
      transferBtn.disabled = false;
      return;
    }

    const response = await fetch("/user/secure/ctb/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      if (!response.ok) {
        const blockMessage = data.block
          ? `${data.block.reasonTitle || "Withdrawal Restriction Active"}: ${
              data.block.reasonMessage || data.error
            } ${data.block.unlockInstruction || ""}`
          : null;

        const errorMsg =
          blockMessage ||
          data.errors?.map((err) => err.msg).join("\n") ||
          data.error ||
          data.message ||
          "Transfer failed.";
        showToast(errorMsg);

        transferText.textContent = "Initiate transfer";
        spinner.classList.add("hidden");
        transferBtn.disabled = false;
        return;
      }

      form.reset();
      const transferId = data.transferId;
      if (transferId) {
        window.location.href = `/udp/confirmtransfer/${transferId}`;
      } else {
        window.location.href = "/udp/confirmtransfer";
      }
      transferText.textContent = "Initiate transfer";
      spinner.classList.add("hidden");
      transferBtn.disabled = false;
    } else {
      const text = await response.text();
      console.error("Non-JSON response:", text);
      showToast("Server error: non-JSON response");
      transferText.textContent = "Initiate transfer";
      spinner.classList.add("hidden");
      transferBtn.disabled = false;
    }
  } catch (error) {
    console.error("Fetch error:", error);
    showToast("Network error. Please try again later.");
    transferText.textContent = "Initiate transfer";
    spinner.classList.add("hidden");
    transferBtn.disabled = false;
  }
});
