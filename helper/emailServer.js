import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

// ✅ Make sure transporter is created BEFORE sendEmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_EMAIL,
    pass: process.env.MAIL_PASSWORD,
  },
});

// 📧 MAIN EMAIL SENDER FUNCTION
export async function sendEmail(to, subject, message) {
  try {
    let htmlTemplate = "";

    // 1) OTP verification
    if (subject === "Your Verification OTP") {
      // here `message` is the OTP code
      htmlTemplate = `
        <div style="font-family:sans-serif;line-height:1.5">
          <h2>${subject}</h2>
          <p>Your OTP is: <b>${message}</b></p>
        </div>`;
    }

    // 2) Password reset
    else if (subject === "Password Reset Request") {
      // here `message` is the reset link
      htmlTemplate = `
        <div style="font-family:sans-serif;line-height:1.5">
          <h2>Password Reset Request</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${message}" 
             style="display:inline-block;margin-top:10px;padding:10px 20px;background:#4CAF50;color:#fff;text-decoration:none;border-radius:5px;">
             Reset Password
          </a>

          <p style="margin-top:16px;color:#555">
            If you did not request this, ignore this email.
          </p>
        </div>`;
    }

    // 3) Generic / custom HTML (e.g. withdrawal status)
    else {
      // here `message` is already a full HTML string
      htmlTemplate = message;
    }

    const mailOptions = {
      from: `"The Eco Mining" <${process.env.MAIL_EMAIL}>`,
      to,
      subject,
      html: htmlTemplate,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Email send error:", error);
    throw new Error(error.message);
  }
}
