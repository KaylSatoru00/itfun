import nodemailer from 'nodemailer';

// Uses a dedicated Gmail account (NOT a personal one) as the sender.
// Requires an App Password (not the regular Gmail password) — see:
// myaccount.google.com/security -> 2-Step Verification -> App passwords
//
// Set these in Railway's environment variables:
//   EMAIL_USER          -> e.g. itfun.dct@gmail.com
//   EMAIL_APP_PASSWORD  -> the 16-character app password (no spaces)

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for port 465, false for 587
  family: 4, // force IPv4 — Railway's network has no outbound IPv6 route to Gmail, which was causing ENETUNREACH
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
  connectionTimeout: 15000, // 15s instead of nodemailer's default (fails fast so the request doesn't hang forever)
  greetingTimeout: 15000,
  socketTimeout: 15000,
});

/**
 * Sends a branded password reset email containing the Firebase-generated
 * reset link. The display name "ITFun" is what users see as the sender,
 * even though the underlying address is a Gmail account.
 */
export async function sendPasswordResetEmail(toEmail, resetLink) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #C8102E;">Reset your ITFun password</h2>
      <p>Hello,</p>
      <p>We received a request to reset the password for your ITFun account (<strong>${toEmail}</strong>).</p>
      <p>
        <a href="${resetLink}"
           style="display: inline-block; background: #C8102E; color: #fff; padding: 12px 24px;
                  border-radius: 8px; text-decoration: none; font-weight: bold; margin: 12px 0;">
          Reset Password
        </a>
      </p>
      <p style="font-size: 13px; color: #777;">
        If the button doesn't work, copy and paste this link into your browser:<br />
        <a href="${resetLink}">${resetLink}</a>
      </p>
      <p style="font-size: 13px; color: #777;">
        If you didn't request this, you can safely ignore this email.
      </p>
      <p>Thanks,<br />The ITFun Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: '"ITFun" <' + process.env.EMAIL_USER + '>',
    to: toEmail,
    subject: 'Reset your ITFun password',
    html,
  });
}