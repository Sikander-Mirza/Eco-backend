import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

// ✅ Configure transporter for mail.themetroweb.com
const transporter = nodemailer.createTransport({
  host: "mail.themetroweb.com",
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.MAIL_USER, 
    pass: process.env.MAIL_PASSWORD, 
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// ✅ Function to send OTP Email
export async function sendEmail(to, subject, message) {
  try {
    const mailOptions = {
      from: `"The Metro Web" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html: `<div style="font-family:sans-serif;line-height:1.5">
              <h2>${subject}</h2>
              <p>${message}</p>
              <p style="margin-top:16px;color:#555">
                If you didn’t request this, please ignore this email.
              </p>
            </div>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ OTP email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Failed to send OTP email:", error);
    throw new Error(error.message);
  }
}
