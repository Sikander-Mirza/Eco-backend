import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();
console.log("📧 Using Gmail:", process.env.MAIL_EMAIL, process.env.MAIL_PASSWORD);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_EMAIL,
    pass: process.env.MAIL_PASSWORD,
  },
});

export async function sendEmail(to, subject, message) {
  try {
    const mailOptions = {
      from: `"The Eco Mining" <${process.env.MAIL_EMAIL}>`, // ✅ fixed here
      to,
      subject,
      html: `
        <div style="font-family:sans-serif;line-height:1.5">
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
