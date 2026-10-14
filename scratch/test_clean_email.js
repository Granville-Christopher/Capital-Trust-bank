require("dotenv").config();
const dns = require("dns");
try { dns.setDefaultResultOrder("ipv4first"); } catch (e) {}
const nodemailer = require("nodemailer");

async function testCleanEmail() {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    family: 4,
    auth: {
      user: "capitaltrustbank920@gmail.com",
      pass: "iamplkqyqgxwyibu",
    },
  });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const targetEmail = "christophergranville2@gmail.com";

  // Ultra-clean, inbox-safe template (modeled after GitHub / Stripe verification emails)
  const plainText = `Capital Trust Bank\n\nYour security code is: ${otp}\n\nThis code will expire in 10 minutes.\nIf you didn't request this code, you can safely ignore this email.\n\nCapital Trust Bank Security`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Capital Trust Bank Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 30px 20px; background-color: #f6f8fa; color: #24292f;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #d0d7de; border-radius: 8px; padding: 32px 28px;">
    <div style="font-size: 18px; font-weight: 700; color: #1f2328; margin-bottom: 20px;">
      Capital Trust Bank
    </div>
    <p style="font-size: 14px; line-height: 1.5; margin: 0 0 16px 0; color: #24292f;">
      Please use the following verification code to complete your login:
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0969da; background: #f6f8fa; border: 1px solid #d0d7de; padding: 10px 24px; border-radius: 6px; display: inline-block;">
        ${otp}
      </span>
    </div>
    <p style="font-size: 13px; line-height: 1.5; margin: 0 0 16px 0; color: #57606a;">
      This code is valid for 10 minutes. If you did not request this, no further action is required.
    </p>
    <hr style="border: none; border-top: 1px solid #d0d7de; margin: 24px 0 16px 0;">
    <p style="font-size: 11px; line-height: 1.4; color: #8c959f; margin: 0;">
      Capital Trust Bank &bull; Automated Security Notification
    </p>
  </div>
</body>
</html>
  `;

  console.log(`Sending clean test code ${otp} to ${targetEmail}...`);

  const info = await transporter.sendMail({
    from: '"Capital Trust Bank" <capitaltrustbank920@gmail.com>',
    to: targetEmail,
    replyTo: "capitaltrustbank920@gmail.com",
    subject: `Your Capital Trust Bank verification code is ${otp}`,
    text: plainText,
    html: html,
  });

  console.log("✅ Clean email sent! Message ID:", info.messageId);
}

testCleanEmail().catch(console.error);
