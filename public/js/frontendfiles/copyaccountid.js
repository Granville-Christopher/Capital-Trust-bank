function copyTextToClipboard(elementId, textToCopy) {
  const feedbackSpan = document.getElementById("copyFeedback");

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        console.log("Text copied to clipboard successfully!");
        feedbackSpan.classList.add("show");
        setTimeout(() => {
          feedbackSpan.classList.remove("show");
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        fallbackCopyTextToClipboard(textToCopy, feedbackSpan);
      });
  } else {
    console.warn("Clipboard API not available, falling back to execCommand.");
    fallbackCopyTextToClipboard(textToCopy, feedbackSpan);
  }
}
function fallbackCopyTextToClipboard(textToCopy, feedbackSpan) {
  const textArea = document.createElement("textarea");
  textArea.value = textToCopy;

  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "0";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand("copy");
    if (successful) {
      console.log("Text copied via execCommand.");
      feedbackSpan.classList.add("show");
      setTimeout(() => {
        feedbackSpan.classList.remove("show");
      }, 2000);
    } else {
      console.error("Fallback: Copying text command was unsuccessful.");
      alert(
        "Copying to clipboard failed. Please copy the text manually: " +
          textToCopy
      );
    }
  } catch (err) {
    console.error("Fallback: Oops, unable to copy", err);
    alert(
      "Copying to clipboard failed. Please copy the text manually: " +
        textToCopy
    );
  }

  document.body.removeChild(textArea);
}

document.getElementById("copyAccountId").addEventListener("click", () => {
  const pElement = document.getElementById("copyAccountId");
  const textContent = pElement.textContent.trim();
  const accountNumber = textContent.replace(/\s+/g, " ").split(" ").pop();

  // Or, even better, if you know it's always the number you want, hardcode it or put it in a data-attribute:
  // const accountNumber = "6663888382"; // Hardcoded
  // or: <p data-account-id="6663888382"> ... </p> and then const accountNumber = pElement.dataset.accountId;

  copyTextToClipboard("copyAccountId", accountNumber);
});
