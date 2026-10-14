require("dotenv").config();
const { sendTransactionalEmail, getEmailFromName } = require("./loanremindermailer");

/**
 * Format currency amount with commas and 2 decimals
 */
function formatAmount(amount) {
  const num = Number(amount || 0);
  return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Format date nicely
 */
function formatDate(date) {
  const d = date ? new Date(date) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toUTCString();
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Generates an inbox-friendly, anti-spam optimized transactional HTML email
 */
function buildTransactionEmailHtml({
  brandName,
  greetingName,
  badgeText,
  badgeBgColor,
  badgeTextColor,
  headline,
  summaryText,
  amountText,
  amountColor,
  details,
  footerNote,
}) {
  const detailsRows = details
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 14px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9; width: 40%; font-weight: 500;">
          ${item.label}
        </td>
        <td style="padding: 10px 14px; font-size: 13px; color: #0f172a; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; word-break: break-all;">
          ${item.value}
        </td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${headline}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 25px 15px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">
              <!-- Header -->
              <tr>
                <td style="background-color: #0f172a; padding: 22px 28px; text-align: left;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">
                        ${brandName}
                      </td>
                      <td align="right">
                        <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 20px; background-color: ${badgeBgColor}; color: ${badgeTextColor};">
                          ${badgeText}
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 28px 28px 20px 28px;">
                  <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #334155;">
                    Dear ${greetingName || "Customer"},
                  </p>
                  <h1 style="margin: 0 0 14px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                    ${headline}
                  </h1>
                  <p style="margin: 0 0 22px 0; font-size: 14px; line-height: 1.5; color: #475569;">
                    ${summaryText}
                  </p>

                  <!-- Amount Card -->
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 4px;">
                      Transaction Amount
                    </div>
                    <div style="font-size: 28px; font-weight: 800; color: ${amountColor}; letter-spacing: -0.5px;">
                      ${amountText}
                    </div>
                  </div>

                  <!-- Details Table -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 24px; background-color: #ffffff; border: 1px solid #f1f5f9; border-radius: 8px;">
                    ${detailsRows}
                  </table>

                  ${
                    footerNote
                      ? `<div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 14px; border-radius: 4px; margin-bottom: 20px;">
                          <p style="margin: 0; font-size: 12px; line-height: 1.4; color: #92400e; font-weight: 500;">
                            ${footerNote}
                          </p>
                        </div>`
                      : ""
                  }

                  <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                    If you did not authorize this transaction or notice any suspicious activity, please contact our 24/7 customer support immediately.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center;">
                  <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #64748b;">
                    ${brandName} • Electronic Notification Service
                  </p>
                  <p style="margin: 0; font-size: 11px; line-height: 1.4; color: #94a3b8;">
                    This is an automated transactional security alert. Never share your password, security PIN, or OTP with anyone.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Send Transfer Initiated (Pending) Email to Sender
 */
async function sendTransferInitiatedEmail({ user, transaction, transfer }) {
  if (!user || !user.Email) return;

  const brandName = getEmailFromName();
  const amtFormatted = formatAmount(transaction.amount || transfer.Amount);
  const subject = `Debit Alert: Transfer Pending - ${amtFormatted}`;
  const recipientName = transfer.FullName || transaction.relatedFullName || "Beneficiary";
  const accNum = transfer.AccountNumber || transaction.relatedAccount || "N/A";
  const bankName = transfer.BankName || transaction.bankName || "N/A";
  const refId = transaction.referenceId || transfer.ReferenceId || "N/A";
  const balanceText = formatAmount(user.AccountBalance);

  const plainText = `Dear ${user.Name},\n\nYour transfer of ${amtFormatted} to ${recipientName} (${accNum} - ${bankName}) has been received and is currently PENDING processing. Your payment will be processed within 2 hours.\n\nReference ID: ${refId}\nAvailable Balance: ${balanceText}\n\nThank you for banking with ${brandName}.`;

  const html = buildTransactionEmailHtml({
    brandName,
    greetingName: user.Name,
    badgeText: "Pending Processing",
    badgeBgColor: "#fef3c7",
    badgeTextColor: "#92400e",
    headline: "Transfer Submitted (Pending)",
    summaryText: "Your transfer instruction has been received and is currently being processed. Your payment will be completed within 2 hours.",
    amountText: `-${amtFormatted}`,
    amountColor: "#dc2626",
    details: [
      { label: "Status", value: "Pending (Processing within 2 hours)" },
      { label: "Recipient Name", value: recipientName },
      { label: "Account Number", value: accNum },
      { label: "Bank Name", value: bankName },
      { label: "Reference ID", value: refId },
      { label: "Transaction Date", value: formatDate(transaction.transactionDate || transaction.createdAt) },
      { label: "Available Balance", value: balanceText },
    ],
    footerNote: "Your payment is in queue and will be processed within 2 hours.",
  });

  try {
    return await sendTransactionalEmail({
      to: user.Email,
      subject,
      html,
      text: plainText,
    });
  } catch (err) {
    console.error("❌ Failed to send transfer initiated email:", err.message);
  }
}

/**
 * Send Transfer Credit Alert Email to Recipient (for internal local transfers)
 */
async function sendTransferCreditEmail({ user, transaction, senderName }) {
  if (!user || !user.Email) return;

  const brandName = getEmailFromName();
  const amtFormatted = formatAmount(transaction.amount);
  const subject = `Credit Alert: ${amtFormatted} Received`;
  const sender = senderName || transaction.relatedFullName || "Capital Trust Bank Customer";
  const refId = transaction.referenceId || "N/A";
  const balanceText = formatAmount(user.AccountBalance);

  const plainText = `Dear ${user.Name},\n\nYour account has been credited with ${amtFormatted} from ${sender}.\n\nReference ID: ${refId}\nAvailable Balance: ${balanceText}\n\nThank you for banking with ${brandName}.`;

  const html = buildTransactionEmailHtml({
    brandName,
    greetingName: user.Name,
    badgeText: "Credit Alert",
    badgeBgColor: "#dcfce7",
    badgeTextColor: "#166534",
    headline: "Funds Credited to Your Account",
    summaryText: `Your account has been successfully credited with ${amtFormatted} from ${sender}.`,
    amountText: `+${amtFormatted}`,
    amountColor: "#16a34a",
    details: [
      { label: "Status", value: "Completed" },
      { label: "Sender Name", value: sender },
      { label: "Reference ID", value: refId },
      { label: "Transaction Date", value: formatDate(transaction.transactionDate || transaction.createdAt) },
      { label: "Available Balance", value: balanceText },
    ],
  });

  try {
    return await sendTransactionalEmail({
      to: user.Email,
      subject,
      html,
      text: plainText,
    });
  } catch (err) {
    console.error("❌ Failed to send credit alert email:", err.message);
  }
}

/**
 * Send Transaction Status Update Email (Admin updates status to completed, on hold, reversed, failed)
 */
async function sendTransactionStatusUpdateEmail({ user, transaction, newStatus, previousStatus }) {
  if (!user || !user.Email) return;

  const brandName = getEmailFromName();
  const tx = transaction || {};
  const normalized = (newStatus || "").toLowerCase();
  const amtFormatted = formatAmount(tx.amount);
  const recipientName = tx.relatedFullName || tx.relatedAccount || "Recipient";
  const refId = tx.referenceId || (tx._id ? "TXN" + String(tx._id).slice(-8).toUpperCase() : "TXN" + Date.now());
  const balanceText = formatAmount(user.AccountBalance);

  let badgeText = "Update";
  let badgeBgColor = "#e0e7ff";
  let badgeTextColor = "#3730a3";
  let headline = `Transfer Status Update: ${newStatus}`;
  let summaryText = `Your transfer of ${amtFormatted} to ${recipientName} has been updated to ${newStatus}.`;
  let subject = `Transfer Update: ${newStatus.toUpperCase()} - ${amtFormatted}`;
  let amountColor = "#0f172a";
  let footerNote = null;

  if (normalized === "successful" || normalized === "completed") {
    subject = `Transfer Completed: ${amtFormatted} to ${recipientName}`;
    badgeText = "Completed";
    badgeBgColor = "#dcfce7";
    badgeTextColor = "#166534";
    headline = "Transfer Successfully Processed";
    summaryText = `We are pleased to inform you that your transfer of ${amtFormatted} to ${recipientName} has been processed and completed successfully.`;
    amountColor = "#16a34a";
  } else if (normalized === "on hold" || normalized === "on-hold") {
    subject = `Transfer Placed On Hold: ${amtFormatted}`;
    badgeText = "On Hold";
    badgeBgColor = "#fef3c7";
    badgeTextColor = "#92400e";
    headline = "Transfer Placed On Hold";
    summaryText = `Your transfer of ${amtFormatted} to ${recipientName} has been temporarily placed on hold for compliance verification.`;
    amountColor = "#d97706";
    footerNote = "Please check your account notifications or contact our support team to verify the necessary transaction information.";
  } else if (normalized === "reversed") {
    subject = `Transfer Reversed & Refunded: ${amtFormatted}`;
    badgeText = "Reversed & Refunded";
    badgeBgColor = "#e0e7ff";
    badgeTextColor = "#3730a3";
    headline = "Transfer Reversed & Amount Refunded";
    summaryText = `Your transfer of ${amtFormatted} to ${recipientName} has been reversed. The full transaction amount of ${amtFormatted} has been credited back to your account balance.`;
    amountColor = "#4f46e5";
    footerNote = "The refunded funds are now reflected in your available account balance.";
  } else if (normalized === "failed") {
    subject = `Transfer Failed: ${amtFormatted}`;
    badgeText = "Failed";
    badgeBgColor = "#fee2e2";
    badgeTextColor = "#991b1b";
    headline = "Transfer Could Not Be Completed";
    summaryText = `Your transfer of ${amtFormatted} to ${recipientName} could not be processed and has failed.`;
    amountColor = "#dc2626";
  }

  const plainText = `Dear ${user.Name},\n\n${summaryText}\n\nAmount: ${amtFormatted}\nStatus: ${badgeText}\nReference ID: ${refId}\nUpdated Balance: ${balanceText}\n\nThank you for banking with ${brandName}.`;

  const html = buildTransactionEmailHtml({
    brandName,
    greetingName: user.Name,
    badgeText,
    badgeBgColor,
    badgeTextColor,
    headline,
    summaryText,
    amountText: amtFormatted,
    amountColor,
    details: [
      { label: "New Status", value: badgeText },
      { label: "Recipient / Description", value: recipientName },
      { label: "Reference ID", value: refId },
      { label: "Date Updated", value: formatDate(new Date()) },
      { label: "Current Balance", value: balanceText },
    ],
    footerNote,
  });

  try {
    return await sendTransactionalEmail({
      to: user.Email,
      subject,
      html,
      text: plainText,
    });
  } catch (err) {
    console.error("❌ Failed to send status update email:", err.message);
  }
}

module.exports = {
  sendTransferInitiatedEmail,
  sendTransferCreditEmail,
  sendTransactionStatusUpdateEmail,
};
