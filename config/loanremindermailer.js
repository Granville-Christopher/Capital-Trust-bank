const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.privateemail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
  @param {string} to
  @param {string} subject 
  @param {string} text 
  @param {string} htmlContent 
 */

async function sendEmail(to, subject, text, htmlContent) {
  try {
    await transporter.sendMail({
      from: `"CTBank Loans" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://placehold.co/32x32/2563EB/DBEAFE?text=CTBank" alt="CTBank Logo" style="width: 48px; height: 48px; border-radius: 8px;" />
            <h2 style="margin: 10px 0; color: #2563eb;">CTBank Loans</h2>
          </div>
          <div style="background-color: white; padding: 20px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            ${htmlContent}
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280;">
            © ${new Date().getFullYear()} CTBank Loans. All rights reserved.
          </div>
        </div>
      `,
    });

    console.log(`📧 Email sent to ${to}`);
  } catch (error) {
    console.error("❌ Email sending error:", error);
  }
}

module.exports = sendEmail;
