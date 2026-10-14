const accountNumberInput = document.getElementById("Account_number");
const recipientFullNameInput = document.getElementById("fName");
const bankInput = document.getElementById("Bank");

let lookupTimeout;

accountNumberInput.addEventListener("input", () => {
  clearTimeout(lookupTimeout);

  const accountNumber = accountNumberInput.value.trim();
  recipientFullNameInput.value = "";
  recipientFullNameInput.readOnly = true;

  if (accountNumber.length >= 5 && /^\d+$/.test(accountNumber)) {
    lookupTimeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/user/secure/ctb/lookupaccount?accountNumber=${accountNumber}`
        );
        const data = await response.json();

        if (response.ok) {
          recipientFullNameInput.value = data.fullName;
          recipientFullNameInput.readOnly = true;
        } else {
          recipientFullNameInput.value = "";
          recipientFullNameInput.readOnly = false;
          showToast(data.error || "Account not found or invalid.");
        }
      } catch (error) {
        console.error("Error during account lookup:", error);
        recipientFullNameInput.value = "";
        recipientFullNameInput.readOnly = false;
        showToast("Network error during account lookup. Please try again.");
      }
    }, 500);
  } else if (accountNumber.length > 0) {
    recipientFullNameInput.value = "";
    recipientFullNameInput.readOnly = false;
  } else {
    recipientFullNameInput.value = "";
    recipientFullNameInput.readOnly = false;
  }
});

const form = document.getElementById("localTf");
const internationaltransferBtn = document.getElementById("localtransfer-btn");
const internationaltransferText = document.getElementById("localtransfer-text");
const spinner = document.getElementById("spinner");

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  internationaltransferBtn.disabled = true;
  internationaltransferText.textContent = "Processing";
  spinner.classList.remove("hidden");

  try {
    const amountInput = document.getElementById("Amount").value;
    let transferAmount;
    try {
      const parsedAmount = parseFloat(amountInput);
      if (isNaN(parsedAmount) || parsedAmount < 1) {
        showToast("Amount must be a valid number and at least $1.00.");
        internationaltransferText.textContent = "Initiate transfer";
        spinner.classList.add("hidden");
        internationaltransferBtn.disabled = false;
        return;
      }
      transferAmount = parsedAmount;
    } catch (e) {
      showToast("Invalid amount format.");
      internationaltransferText.textContent = "Initiate transfer";
      spinner.classList.add("hidden");
      internationaltransferBtn.disabled = false;
      return;
    }

    const data = {
      FullName: document.getElementById("fName").value,
      Amount: transferAmount,
      AccountNumber: document.getElementById("Account_number").value,
      BankName: document.getElementById("Bank").value,
    };

    if (!data.AccountNumber.match(/^\d{5,20}$/)) {
      showToast("Account Number must be at least 5 digits.");
      internationaltransferText.textContent = "Initiate transfer";
      spinner.classList.add("hidden");
      internationaltransferBtn.disabled = false;
      return;
    }

    if (
      !data.FullName ||
      isNaN(data.Amount) ||
      !data.AccountNumber ||
      !data.BankName
    ) {
      showToast("All fields are required.");
      internationaltransferText.textContent = "Initiate transfer";
      spinner.classList.add("hidden");
      internationaltransferBtn.disabled = false;
      return;
    }

    if (
      recipientFullNameInput.readOnly &&
      recipientFullNameInput.value === ""
    ) {
      showToast(
        "Please enter a valid account number to find the recipient, or ensure the recipient's name is filled."
      );
      internationaltransferText.textContent = "Initiate transfer";
      spinner.classList.add("hidden");
      internationaltransferBtn.disabled = false;
      return;
    }

    const response = await fetch("/user/secure/ctb/localtransfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const responseData = await response.json();
      if (!response.ok) {
        const blockMessage = responseData.block
          ? `${responseData.block.reasonTitle || "Withdrawal Restriction Active"}: ${
              responseData.block.reasonMessage || responseData.error
            } ${responseData.block.unlockInstruction || ""}`
          : null;

        const errorMsg =
          blockMessage ||
          responseData.errors?.map((err) => err.msg).join("\n") ||
          responseData.error ||
          responseData.message ||
          "Transfer failed.";
        showToast(errorMsg);

        internationaltransferText.textContent = "Initiate transfer";
        spinner.classList.add("hidden");
        internationaltransferBtn.disabled = false;
        return;
      }

      form.reset();
      const transferId = responseData.transferId;
      if (transferId) {
        window.location.href = `/udp/confirmlocaltransfer/${transferId}`;
      } else {
        window.location.href = "/udp/confirmlocaltransfer";
      }
      showToast(responseData.message || "Transfer initiated successfully!");
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
