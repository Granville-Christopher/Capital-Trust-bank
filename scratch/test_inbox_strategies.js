require("dotenv").config();
const { Resend } = require("resend");
const nodemailer = require("nodemailer");
const dns = require("dns");
try { dns.setDefaultResultOrder("ipv4first"); } catch (e) {}

const targetEmail = "christophergranville2@gmail.com";

async function testGmailNatural() {
  console.log("Testing Strategy 1: Gmail SMTP with natural CTB Portal branding (Anti-Phishing Filter Bypass)...");
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

  const code1 = Math.floor(100000 + Math.random() * 900000).toString();

  const info = await transporter.sendMail({
    from: '"CTB Security" <capitaltrustbank920@gmail.com>',
    to: targetEmail,
    subject: `Your sign-in code is ${code1}`,
    text: `Hello,\n\nUse the following single-use verification code to sign in to your account:\n\n${code1}\n\nThis code is valid for 10 minutes. If you did not request this code, you can safely ignore this email.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; max-width: 440px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
        <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #0f172a;">Account Verification</h2>
        <p style="font-size: 14px; color: #334155; margin: 0 0 20px 0; line-height: 1.5;">
          Use the following single-use code to complete your login:
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #1e40af; background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px 24px; border-radius: 6px; display: inline-block;">
            ${code1}
          </span>
        </div>
        <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 1.5;">
          This code expires in 10 minutes. If you did not request this code, no action is required.
        </p>
      </div>
    `,
  });

  console.log("✅ Strategy 1 Sent! Code:", code1, "ID:", info.messageId);
}

testGmailNatural().catch(console.error);
