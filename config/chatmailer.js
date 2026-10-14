require("dotenv").config();
const { sendTransactionalEmail, getEmailFromName } = require("./loanremindermailer");

/**
 * Format date for chat email
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
 * Clean plain text generator from HTML
 */
function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Send email to USER when ADMIN sends a support message
 */
async function sendAdminMessageEmail({ user, messageText, adminName = "Customer Support Specialist" }) {
  if (!user || !user.Email) {
    console.warn("⚠️ Cannot send chat email: missing user or email address");
    return;
  }

  const brandName = getEmailFromName() || "Capital Trust Bank";
  const userGreeting = user.Name ? user.Name.trim().split(" ")[0] : "Valued Customer";
  const timeStr = formatDate(new Date());

  const subject = `New Message from ${brandName} Support`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 28px 24px; text-align: center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.18); color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; padding: 5px 14px; border-radius: 9999px; margin-bottom: 12px;">
                      Official Support Communication
                    </span>
                    <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
                      ${brandName} Help Center
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 24px;">
              <p style="margin: 0 0 16px; font-size: 15px; color: #1e293b; font-weight: 600;">
                Hello ${userGreeting},
              </p>
              <p style="margin: 0 0 20px; font-size: 14px; color: #475569; line-height: 1.6;">
                You have received a new response from our support team regarding your account.
              </p>

              <!-- Message Bubble Card -->
              <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                  Message from ${adminName} &bull; <span style="font-weight: 400; color: #64748b;">${timeStr}</span>
                </div>
                <div style="font-size: 14px; color: #0f172a; line-height: 1.6; white-space: pre-wrap; font-weight: 500;">${messageText}</div>
              </div>

              <!-- Action button note -->
              <p style="margin: 0 0 24px; font-size: 13px; color: #64748b; line-height: 1.5;">
                You can view your full conversation history and reply directly by opening the Live Support Chat in your online banking dashboard.
              </p>

              <!-- Security notice -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px;">
                <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                  🔒 <strong>Security Tip:</strong> ${brandName} specialists will never ask for your account password or PIN via email.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #64748b;">
                &copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                This is an automated support notification regarding your account.
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

  const text = `Hello ${userGreeting},\n\nYou have received a new message from ${adminName} at ${brandName}:\n\n"${messageText}"\n\nDate: ${timeStr}\n\nYou can view and reply to this conversation anytime by logging into your online banking account.\n\nThank you,\n${brandName} Support Team`;

  try {
    await sendTransactionalEmail({
      to: user.Email,
      subject,
      text,
      html,
    });
    console.log(`✅ [Support Chat] Email alert delivered to user ${user.Email}`);
  } catch (err) {
    console.error("❌ [Support Chat] Error delivering email to user:", err);
  }
}

/**
 * Send email to ADMIN when USER sends a support message
 */
async function sendUserMessageToAdminEmail({ user, messageText }) {
  const brandName = getEmailFromName() || "Capital Trust Bank";
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SUPPORT_EMAIL || "capitaltrustbank920@gmail.com";
  const timeStr = formatDate(new Date());

  const userName = user.Name || "Unknown User";
  const userEmail = user.Email || "No Email";
  const userAccount = user.AccountNumber || "N/A";

  const subject = `[Support Ticket] New message from ${userName} (${userAccount})`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; border: 1px solid #cbd5e1; overflow: hidden;" cellspacing="0" cellpadding="0" border="0">
          
          <tr>
            <td style="background-color: #0f172a; padding: 20px 24px; color: #ffffff;">
              <h2 style="margin: 0; font-size: 18px; font-weight: 700;">Incoming Customer Support Message</h2>
              <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">${brandName} Live Messaging Panel</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px;">
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
                <p style="margin: 0 0 6px; font-size: 13px; color: #334155;"><strong>Customer:</strong> ${userName}</p>
                <p style="margin: 0 0 6px; font-size: 13px; color: #334155;"><strong>Email:</strong> ${userEmail}</p>
                <p style="margin: 0; font-size: 13px; color: #334155;"><strong>Account Number:</strong> <span style="font-family: monospace;">${userAccount}</span></p>
              </div>

              <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
                <div style="font-size: 11px; font-weight: 700; color: #047857; text-transform: uppercase; margin-bottom: 6px;">
                  Customer Message &bull; ${timeStr}
                </div>
                <div style="font-size: 14px; color: #064e3b; line-height: 1.5; white-space: pre-wrap; font-weight: 500;">${messageText}</div>
              </div>

              <p style="margin: 0; font-size: 13px; color: #475569;">
                Please log into your Admin Dashboard under <strong>Support Chat</strong> to respond to this customer.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 24px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} ${brandName} Administration
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

  const text = `Incoming Support Message from ${userName} (${userAccount}):\n\n"${messageText}"\n\nCustomer Email: ${userEmail}\nTime: ${timeStr}\n\nPlease respond via the Admin Support Chat panel.`;

  try {
    await sendTransactionalEmail({
      to: adminEmail,
      subject,
      text,
      html,
    });
    console.log(`✅ [Support Chat] Admin notification email sent for user ${userEmail}`);
  } catch (err) {
    console.error("❌ [Support Chat] Error delivering email to admin:", err);
  }
}

module.exports = {
  sendAdminMessageEmail,
  sendUserMessageToAdminEmail,
};
