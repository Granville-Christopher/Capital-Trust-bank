require("dotenv").config();
const { sendEmail } = require("../config/loanremindermailer");
const { sendOtpEmail } = require("../config/transferotpmailer");

async function main() {
  const targetEmail = "christophergranville2@gmail.com";
  console.log(`🚀 Dispatching test security emails to ${targetEmail}...`);

  // 1. Send Login OTP Test
  console.log("\n[1/2] Sending Login 2FA Verification Code test...");
  const loginResult = await sendEmail(
    targetEmail,
    "482910 is your Capital Trust Bank verification code",
    "Hello Christopher, Your Capital Trust Bank verification code is 482910. It expires in 10 minutes.",
    `
      <p style="margin:0 0 16px 0; font-size:15px; font-weight:600; color:#1e293b;">Hello Christopher,</p>
      <p style="margin:0 0 20px 0; font-size:14px; line-height:1.6; color:#475569;">
        You requested a security verification code to sign in to your Capital Trust Bank account. Enter this code to authenticate your session:
      </p>
      <div style="background-color:#f1f5f9; border:1px solid #cbd5e1; border-radius:10px; padding:22px 15px; text-align:center; margin:24px 0;">
        <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#64748b; margin-bottom:8px;">
          One-Time Login Code
        </div>
        <div style="font-family:'SFMono-Regular',Consolas,Menlo,monospace; font-size:34px; font-weight:800; letter-spacing:6px; color:#0f172a; padding:4px 0;">
          482910
        </div>
        <div style="font-size:12px; color:#64748b; margin-top:6px;">
          Expires in 10 minutes &bull; Single-use only
        </div>
      </div>
    `
  );
  console.log("✅ Login OTP Dispatch Result:", loginResult);

  // 2. Send Transfer OTP Test
  console.log("\n[2/2] Sending Transfer Authorization Code test...");
  const transferResult = await sendOtpEmail(targetEmail, "938201", "Christopher Granville");
  console.log("✅ Transfer OTP Dispatch Result:", transferResult);

  console.log("\n🎉 All test emails have been delivered to", targetEmail);
}

main().catch(console.error);
