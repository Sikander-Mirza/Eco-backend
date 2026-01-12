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
      const code = String(message);

      htmlTemplate = `
        <div style="
          margin:0;
          padding:0;
          background:#050810;
          font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
          color:#e5e7eb;
        ">
          <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
            <!-- Logo / Brand -->
            <div style="text-align:center;margin-bottom:20px;">
              <span style="
                display:inline-block;
                padding:8px 14px;
                border-radius:999px;
                background:rgba(34,197,94,0.08);
                border:1px solid rgba(34,197,94,0.35);
                color:#4ade80;
                font-size:12px;
                letter-spacing:0.08em;
                text-transform:uppercase;
              ">
                The Eco Mining
              </span>
            </div>

            <!-- Card -->
            <div style="
              background:#050816;
              border-radius:16px;
              border:1px solid #1f2937;
              box-shadow:0 24px 60px rgba(0,0,0,0.75);
              padding:24px 20px 20px;
            ">
              <h2 style="
                margin:0 0 12px 0;
                font-size:20px;
                font-weight:700;
                color:#4ade80;
              ">
                Your Verification Code
              </h2>

              <p style="margin:0 0 12px 0;font-size:14px;color:#d1d5db;">
                Use the code below to complete your verification:
              </p>

              <div style="margin:0 0 18px 0;text-align:center;">
                <span style="
                  display:inline-block;
                  padding:10px 24px;
                  border-radius:999px;
                  background:#020617;
                  border:1px solid rgba(34,197,94,0.6);
                  color:#4ade80;
                  font-size:22px;
                  font-weight:700;
                  letter-spacing:0.30em;
                ">
                  ${code}
                </span>
              </div>

              <p style="margin:0 0 8px 0;font-size:13px;color:#9ca3af;line-height:1.6;">
                This code will expire in 5 minutes. If you did not request this,
                you can safely ignore this email.
              </p>
            </div>

            <!-- Footer -->
            <p style="margin:16px 0 0 0;font-size:11px;color:#6b7280;text-align:center;">
              © ${new Date().getFullYear()} The Eco Mining. All rights reserved.
            </p>
          </div>
        </div>
      `;
    }

  // 2) Password reset
else if (subject === "Password Reset" || subject === "Password Reset Request") {
  // here `message` is the reset link URL
  const resetURL = String(message);

  htmlTemplate = `
    <div style="
      margin:0;
      padding:0;
      background:#050810;
      font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      color:#e5e7eb;
    ">
      <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
        <!-- Logo / Brand -->
        <div style="text-align:center;margin-bottom:20px;">
          <span style="
            display:inline-block;
            padding:8px 14px;
            border-radius:999px;
            background:rgba(34,197,94,0.08);
            border:1px solid rgba(34,197,94,0.35);
            color:#4ade80;
            font-size:12px;
            letter-spacing:0.08em;
            text-transform:uppercase;
          ">
            The Eco Mining
          </span>
        </div>

        <!-- Card -->
        <div style="
          background:#050816;
          border-radius:16px;
          border:1px solid #1f2937;
          box-shadow:0 24px 60px rgba(0,0,0,0.75);
          padding:24px 20px 20px;
        ">
          <h2 style="
            margin:0 0 12px 0;
            font-size:20px;
            font-weight:700;
            color:#4ade80;
          ">
            Reset Your Password
          </h2>

          <p style="margin:0 0 10px 0;font-size:14px;color:#d1d5db;">
            We received a request to reset the password for your Eco Mining account.
          </p>
          <p style="margin:0 0 18px 0;font-size:14px;color:#9ca3af;line-height:1.6;">
            Click the button below to choose a new password.
          </p>

          <!-- Button -->
          <div style="margin:0 0 18px 0;text-align:center;">
            <a href="${resetURL}"
              style="
                display:inline-block;
                padding:10px 22px;
                border-radius:999px;
                background:#22c55e;
                color:#050810;
                font-size:14px;
                font-weight:600;
                text-decoration:none;
              ">
              Reset Password
            </a>
          </div>

          <p style="margin:0 0 10px 0;font-size:12px;color:#9ca3af;line-height:1.6;">
            Or copy and paste this link into your browser:
          </p>
          <p style="margin:0 0 18px 0;font-size:11px;color:#6b7280;word-break:break-all;">
            ${resetURL}
          </p>

          <p style="margin:0 0 4px 0;font-size:12px;color:#6b7280;">
            This link will expire in 10 minutes. If you did not request a password reset,
            you can safely ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <p style="margin:16px 0 0 0;font-size:11px;color:#6b7280;text-align:center;">
          © ${new Date().getFullYear()} The Eco Mining. All rights reserved.
        </p>
      </div>
    </div>
  `;
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
