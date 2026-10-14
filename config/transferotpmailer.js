require("dotenv").config();
const otpGenerator = require("otp-generator");
const { sendTransactionalEmail, getEmailFromName } = require("./loanremindermailer");

console.log("✅ Multi-Tier OTP Mailer Initialized (Primary Inbox Delivery)");

const generateOtp = () => {
  return otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
};

const sendOtpEmail = async (email, otp, userName = "") => {
  const brandName = getEmailFromName();
  const nameGreeting = userName ? `Hi ${userName},` : "Hi,";
  const subject = `${otp} is your ${brandName} authorization code`;
  const plainText = `${brandName}\n\n${nameGreeting}\n\nUse this code to authorize your transfer:\n\n${otp}\n\nThis code expires in 5 minutes.\nIf you did not make this request, you can safely ignore this email.\n\n${brandName} Team`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; background-color: #f6f8fa; color: #24292f;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #d0d7de; border-radius: 8px; padding: 28px;">
    <div style="font-size: 18px; font-weight: 700; color: #1f2328; margin-bottom: 16px;">
      ${brandName}
    </div>
    <p style="font-size: 14px; line-height: 1.5; margin: 0 0 12px 0; color: #24292f;">
      ${nameGreeting}
    </p>
    <p style="font-size: 14px; line-height: 1.5; margin: 0 0 18px 0; color: #24292f;">
      Use this code to authorize your transfer:
    </p>
    <div style="text-align: center; margin: 20px 0;">
      <span style="font-family: monospace; font-size: 30px; font-weight: 700; letter-spacing: 5px; color: #0969da; background: #f6f8fa; border: 1px solid #d0d7de; padding: 10px 22px; border-radius: 6px; display: inline-block;">
        ${otp}
      </span>
    </div>
    <p style="font-size: 13px; line-height: 1.5; margin: 0 0 10px 0; color: #57606a;">
      This code expires in 5 minutes.
    </p>
    <hr style="border: none; border-top: 1px solid #d0d7de; margin: 20px 0 14px 0;">
    <p style="font-size: 12px; line-height: 1.4; color: #57606a; margin: 0;">
      If you did not request this, no action is needed.
    </p>
  </div>
</body>
</html>
  `;

  try {
    const result = await sendTransactionalEmail({
      to: email,
      subject: subject,
      html: htmlContent,
      text: plainText,
    });
    return { success: true, messageId: result.id || result.provider };
  } catch (err) {
    console.error("❌ Failed to send OTP email:", err);
    return { success: false, error: err.message };
  }
};

module.exports = {
  generateOtp,
  sendOtpEmail,
};
