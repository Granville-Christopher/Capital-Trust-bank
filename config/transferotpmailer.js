require("dotenv").config();

const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");

const transporter = nodemailer.createTransport({
  host: "smtp.privateemail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  // tls: {
  //     ciphers: 'SSLv3'
  // }
});
transporter.verify((error, success) => {
  if (error) {
    console.error("Nodemailer connection error:", error);
  } else {
    console.log("Nodemailer is ready to send emails");
  }
});
const generateOtp = () => {
  return otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
};

const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Capital Trust Bank" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your One-Time Password (OTP) for Transfer Confirmation",
    html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #4CAF50;">Transfer OTP Verification</h2>
                <p>Dear User,</p>
                <p>You have initiated a transfer. To complete your transaction, please use the following One-Time Password (OTP):</p>
                <h1 style="background-color: #f2f2f2; padding: 15px; text-align: center; border-radius: 5px; letter-spacing: 5px;">
                    <strong>${otp}</strong>
                </h1>
                <p>This OTP is valid for <strong>5 minutes</strong>. Please do not share this code with anyone.</p>
                <p>If you did not initiate this transfer, please contact support immediately.</p>
                <p>Thank you,</p>
                <p>Your Banking Team</p>
            </div>
        `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("OTP Email sent: %s", info.messageId);
    console.log("OTP Email sent to ", email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateOtp,
  sendOtpEmail,
};
