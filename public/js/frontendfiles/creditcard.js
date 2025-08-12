window.addEventListener("DOMContentLoaded", () => {
  let selectedCard = null;

  window.showCardTypeSelector = function () {
    document.getElementById("cardTypeSelector").classList.remove("hidden");
  };
  window.toggleCardCreation = window.showCardTypeSelector;

  window.selectCard = function (type) {
    selectedCard = type;
    const master = document.getElementById("mastercardOption");
    const visa = document.getElementById("visaOption");
    master.classList.remove("border-blue-600", "bg-blue-50");
    visa.classList.remove("border-blue-600", "bg-blue-50");

    if (type === "mastercard") {
      master.classList.add("border-blue-600", "bg-blue-50");
    } else {
      visa.classList.add("border-blue-600", "bg-blue-50");
    }
  };

  window.confirmCardType = function () {
    sendCardTypeToBackend();
  };

  function showModal(message, isLoading = true) {
    const modal = document.getElementById("generatingModal");
    modal.querySelector("h3").textContent = message;
    modal.querySelector(".fa-spinner").style.display = isLoading
      ? "block"
      : "none";
    modal.classList.remove("hidden");
  }

  function hideModal() {
    document.getElementById("generatingModal").classList.add("hidden");
  }

  async function fetchCreditCard() {
    try {
      const res = await fetch("/user/secure/ctb/creditcard-details", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Could not fetch card");

      const data = await res.json();

      const noCardSection = document.getElementById("noCardSection");
      const cardTypeSelector = document.getElementById("cardTypeSelector");
      const cardSection = document.getElementById("cardSection");
      const cardDisplaySection = document.getElementById("carouselSlides");
      const freezeButton = document.querySelector("button:has(.fa-snowflake)");
      const terminateButton = document.querySelector("button:has(.fa-ban)");
      const manageCardButton = document.querySelector(
        "a[href='/secure/ctb/managecreditcardpin']"
      );

      cardDisplaySection.innerHTML = "";

      if (!data.card) {
        noCardSection.classList.remove("hidden");
        cardTypeSelector.classList.add("hidden");
        cardSection.classList.add("hidden");
        freezeButton?.parentElement?.classList.add("hidden");
        terminateButton?.parentElement?.classList.add("hidden");
        manageCardButton?.classList.add("hidden");
        return;
      }

      noCardSection.classList.add("hidden");
      cardTypeSelector.classList.add("hidden");
      cardSection.classList.remove("hidden");
      freezeButton?.parentElement?.classList.remove("hidden");
      terminateButton?.parentElement?.classList.remove("hidden");
      manageCardButton?.classList.remove("hidden");

      const card = data.card;
      const expiry = new Date(card.expiryDate);
      const formattedExpiry = `${String(expiry.getMonth() + 1).padStart(
        2,
        "0"
      )}/${expiry.getFullYear()}`;
      const cardNum = card.cardNumber.replace(/(.{4})/g, "$1 ").trim();

      cardDisplaySection.innerHTML = `
        <div class="card-face w-full flex flex-col justify-between">
          <div class="flex justify-between items-center">
            <span><i class="fa-brands fa-cc-${card.cardType} text-2xl"></i></span>
            <span class="text-sm">Credit Card</span>
          </div>
          <div>
            <p class="text-lg tracking-widest mb-2">${cardNum}</p>
            <div class="flex justify-between text-sm">
              <span>Exp: ${formattedExpiry}</span>
              <span>CVV: ${card.cvv}</span>
            </div>
          </div>
          <p class="text-sm mt-2 font-medium">${data.userName}</p>
        </div>
      `;
    } catch (err) {
      console.error(err);
      showModal("Error loading card details", false);
      setTimeout(hideModal, 3000);
    }
  }

  async function sendCardTypeToBackend() {
    if (!selectedCard) {
      alert("Please select a card type.");
      return;
    }

    const cardData = {
      cardType: selectedCard,
      timestamp: new Date().toISOString(),
    };

    try {
      showModal("Generating Card...");
      const response = await fetch("/user/secure/ctb/create-credit-card", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cardData),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Card type sent successfully:", result);

      await fetchCreditCard();

      setTimeout(() => {
        window.location.href = "/secure/ctb/setcreditcardpin";
      }, 3000);
    } catch (error) {
      console.error("Error sending card type:", error);
      showModal("Failed to generate card. Try again.", false);

      setTimeout(() => {
        hideModal();
        fetchCreditCard();
      }, 3000);
    }
  }
  const freezeButton = document.querySelector("button:has(.fa-snowflake)");
  if (freezeButton) {
    freezeButton.addEventListener("click", async () => {
      showModal("Freezing Card...");
      try {
        const res = await fetch("/user/secure/ctb/freeze-credit-card", {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to freeze card");
        showModal("Card frozen successfully!", false);
        setTimeout(() => {
          hideModal();
          fetchCreditCard();
        }, 2000);
      } catch (err) {
        showModal("Failed to freeze card.", false);
        setTimeout(hideModal, 2000);
      }
    });
  }

  const terminateButton = document.querySelector("button:has(.fa-ban)");
  if (terminateButton) {
    terminateButton.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to terminate this card?")) return;
      showModal("Terminating Card...");
      try {
        const res = await fetch("/user/secure/ctb/terminate-credit-card", {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to terminate card");
        showModal("Card terminated successfully!", false);
        setTimeout(() => {
          hideModal();
          fetchCreditCard();
        }, 2000);
      } catch (err) {
        showModal("Failed to terminate card.", false);
        setTimeout(hideModal, 2000);
      }
    });
  }

  fetchCreditCard();
});
