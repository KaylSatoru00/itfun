// Sends email via Brevo's HTTP API instead of raw SMTP.
// We switched away from nodemailer/SMTP because Railway blocks outbound
// SMTP connections (port 465/587) at the network level — this was causing
// ENETUNREACH / Connection timeout errors that no SMTP config could fix.
// Brevo's API is a plain HTTPS POST, so it isn't affected by that block.
//
// Setup (one-time):
//   1. Sign up at https://www.brevo.com (free tier)
//   2. Verify your sender email (Senders, Domains & Dedicated IPs -> Senders)
//   3. Create an API key (SMTP & API -> API Keys)
//
// Set these in Railway's environment variables:
//   BREVO_API_KEY    -> the API key from step 3
//   EMAIL_USER       -> the sender email you verified in step 2, e.g. itfun.dct@gmail.com

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

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

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: 'ITFun', email: process.env.EMAIL_USER },
      to: [{ email: toEmail }],
      subject: 'Reset your ITFun password',
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Brevo API error (${response.status}): ${errorBody}`);
  }
}