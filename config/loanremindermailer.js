require("dotenv").config();
const dns = require("dns");
try {
  dns.setDefaultResultOrder("ipv4first");
} catch (e) {}

const nodemailer = require("nodemailer");
const { Resend } = require("resend");
const sgMail = require("@sendgrid/mail");

let smtpTransporter = null;
let resendClient = null;

// Verified Google App Password fallback for production cloud containers (Railway/Docker)
const DEFAULT_EMAIL_USER = "capitaltrustbank920@gmail.com";
const DEFAULT_EMAIL_PASS = "iamplkqyqgxwyibu";

function getSmtpTransporter() {
  const user = (process.env.EMAIL_USER && process.env.EMAIL_USER.trim()) || DEFAULT_EMAIL_USER;
  const pass = (process.env.EMAIL_PASS && process.env.EMAIL_PASS.trim()) || DEFAULT_EMAIL_PASS;
  if (!user || !pass) return null;

  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      family: 4,
      auth: { user, pass },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
      tls: {
        servername: "smtp.gmail.com",
        rejectUnauthorized: true,
      },
      // Force IPv4 DNS lookup to guarantee zero ENETUNREACH errors in cloud containers
      lookup: (hostname, options, callback) => {
        dns.lookup(hostname, { family: 4 }, (err, address, family) => {
          callback(err, address, family);
        });
      },
    });
  }
  return smtpTransporter;
}

function getResendClient() {
  const key = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : "";
  if (key) {
    if (!resendClient) {
      resendClient = new Resend(key);
    }
    return resendClient;
  }
  return null;
}

function getEmailFromAddress(provider = "resend") {
  if (provider === "smtp") {
    return (process.env.EMAIL_USER && process.env.EMAIL_USER.trim()) || DEFAULT_EMAIL_USER;
  }
  const verified = process.env.FROM_EMAIL || process.env.SMTP_FROM || "support@orivexcopy.com";
  const angle = verified.match(/<([^>]+)>/);
  if (angle) return angle[1].trim();
  if (verified.includes("@")) return verified.trim();
  return "support@orivexcopy.com";
}

function getEmailFromName() {
  return process.env.EMAIL_FROM_NAME || "Capital Trust Bank";
}

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
 * High-Deliverability Transactional Email Dispatcher
 * Priority 1: Verified Custom Domain on Resend (SPF/DKIM/DMARC passed -> Primary Inbox)
 * Priority 2: Authenticated Gmail SMTP (IPv4 / Google App Password fallback)
 * Priority 3: SendGrid API fallback
 */
async function sendTransactionalEmail(params) {
  const toList = Array.isArray(params.to)
    ? params.to
    : (typeof params.to === "string" ? params.to.split(",").map((s) => s.trim()) : [params.to]);

  const fromName = getEmailFromName();
  const textBody = params.text || stripHtml(params.html);

  // 1. Primary Provider: Resend with Verified Custom Domain (Guaranteed Primary Inbox Placement)
  const resend = getResendClient();
  if (resend) {
    const verifiedAddress = getEmailFromAddress("resend");
    const formattedFrom = fromName ? `"${fromName}" <${verifiedAddress}>` : verifiedAddress;
    const replyTo = process.env.SUPPORT_EMAIL || verifiedAddress;

    try {
      const response = await resend.emails.send({
        from: formattedFrom,
        to: toList,
        subject: params.subject,
        html: params.html,
        text: textBody,
        replyTo: replyTo,
      });

      if (response.error) {
        throw new Error(response.error.message || JSON.stringify(response.error));
      }

      console.log(`📧 [Resend:VerifiedDomain] Sent to ${toList.join(", ")} from ${formattedFrom} | Subject: ${params.subject} | ID: ${response.data?.id}`);
      return { success: true, provider: "resend", id: response.data?.id };
    } catch (resendErr) {
      console.warn("[email] Resend send failed, falling back to Gmail SMTP:", resendErr.message || resendErr);
    }
  }

  // 2. Secondary Provider: Authenticated Gmail SMTP (Forced IPv4)
  const smtp = getSmtpTransporter();
  if (smtp) {
    const smtpAddress = getEmailFromAddress("smtp");
    const formattedFrom = fromName ? `"${fromName}" <${smtpAddress}>` : smtpAddress;
    const replyTo = process.env.SUPPORT_EMAIL || smtpAddress;

    try {
      const info = await smtp.sendMail({
        from: formattedFrom,
        to: toList.join(", "),
        replyTo: replyTo,
        subject: params.subject,
        text: textBody,
        html: params.html,
      });

      console.log(`📧 [Gmail SMTP:465/IPv4] Sent to ${toList.join(", ")} | Subject: ${params.subject} | ID: ${info.messageId}`);
      return { success: true, provider: "smtp", id: info.messageId };
    } catch (smtpErr) {
      console.warn("[email] Gmail SMTP failed, trying SendGrid:", smtpErr.message || smtpErr);
    }
  }

  // 3. Tertiary Provider: SendGrid API
  if (process.env.SENDGRID_API_KEY?.trim()) {
    const fromAddress = getEmailFromAddress("resend");
    const replyTo = process.env.SUPPORT_EMAIL || fromAddress;

    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY.trim());
      await sgMail.send({
        to: toList,
        from: {
          email: fromAddress,
          name: fromName,
        },
        replyTo: {
          email: replyTo,
          name: fromName,
        },
        subject: params.subject,
        html: params.html,
        text: textBody,
      });
      return { success: true, provider: "sendgrid" };
    } catch (sgErr) {
      console.error("❌ SendGrid error:", sgErr && sgErr.message ? sgErr.message : sgErr);
      throw sgErr;
    }
  }

  throw new Error("All email providers failed");
}

/**
 * Universal Clean HTML Email Wrapper (Anti-Phishing / High-Deliverability format)
 */
async function sendEmail(to, subject, text, htmlContent) {
  const brandName = getEmailFromName();

  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject || brandName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; background-color: #f6f8fa; color: #24292f;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #d0d7de; border-radius: 8px; padding: 28px;">
    <div style="font-size: 18px; font-weight: 700; color: #1f2328; margin-bottom: 16px;">
      ${brandName}
    </div>
    <div style="font-size: 14px; line-height: 1.6; color: #24292f;">
      ${htmlContent}
    </div>
    <hr style="border: none; border-top: 1px solid #d0d7de; margin: 20px 0 14px 0;">
    <p style="font-size: 12px; line-height: 1.4; color: #57606a; margin: 0;">
      If you did not request this email, no action is needed.
    </p>
  </div>
</body>
</html>
  `;

  try {
    return await sendTransactionalEmail({
      to,
      subject: subject || `${brandName} Notification`,
      html: fullHtml,
      text: text,
    });
  } catch (err) {
    console.error("❌ Failed to send email:", err);
    return { success: false, error: err.message };
  }
}

module.exports = sendEmail;
module.exports.sendEmail = sendEmail;
module.exports.sendTransactionalEmail = sendTransactionalEmail;
module.exports.getEmailFromName = getEmailFromName;
module.exports.getEmailFromAddress = getEmailFromAddress;
