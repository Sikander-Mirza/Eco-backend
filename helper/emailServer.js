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

    // If subject is OTP verification → use old template
    if (subject === "Your Verification OTP") {
      htmlTemplate = `
        <div style="font-family:sans-serif;line-height:1.5">
          <h2>${subject}</h2>
          <p>Your OTP is: <b>${message}</b></p>
        </div>`;
    } 
    
    // Otherwise → Password Reset
    else {
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
