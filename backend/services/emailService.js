const sgMail = require("@sendgrid/mail");

/**
 * Configure SendGrid API Key
 */
const initSendGrid = () => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn("[SendGrid] Warning: SENDGRID_API_KEY is not defined in environment variables.");
    return false;
  }
  sgMail.setApiKey(apiKey);
  return true;
};

/**
 * Helper to generate brand HTML template for OTP verification
 */
const generateOtpEmailHtml = ({ otp, type = "login", recipientEmail }) => {
  const isSignup = type === "signup";
  const isClaim = type === "claim";
  const title = isSignup ? "Verify Your Email" : isClaim ? "Claim Your QR Code" : "Your Login Code";
  const greeting = isSignup ? "Welcome to BACSTORY!" : isClaim ? "Verify Your QR Claim" : "Welcome back to BACSTORY!";
  const introMessage = isSignup
    ? "Thank you for creating an account with BACSTORY. Please enter the verification code below to complete your registration and begin your journey."
    : isClaim
    ? "Use the one-time code below to verify your identity and link your BACSTORY piece to your personal narrative."
    : "We received a request to log in to your BACSTORY account. Use the one-time code below to complete your sign in.";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - BACSTORY</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f6f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f7f6f2; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #ffffff; border-radius: 20px; border: 1px solid #ebe7df; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
          <!-- Top Accent Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #111111 0%, #7A5236 100%);"></td>
          </tr>
          
          <!-- Header / Brand -->
          <tr>
            <td style="padding: 36px 36px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 5px; color: #111111; text-transform: uppercase;">BACSTORY</h1>
              <p style="margin: 6px 0 0; font-size: 10px; font-weight: 600; letter-spacing: 3px; color: #8a8277; text-transform: uppercase;">Wear Your Narrative</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 36px;">
              <hr style="border: none; border-top: 1px solid #f0ece3; margin: 0;">
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 36px 24px; text-align: center;">
              <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #111111;">${greeting}</h2>
              <p style="margin: 0 0 28px; font-size: 14px; line-height: 1.6; color: #555555;">
                ${introMessage}
              </p>

              <!-- OTP Block -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 28px;">
                <tr>
                  <td align="center">
                    <div style="background-color: #FAF8F5; border: 1.5px dashed #D6CEC3; border-radius: 14px; padding: 22px 28px; display: inline-block;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #111111; display: inline-block; padding-left: 12px;">
                        ${otp}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Expiry & Security Badge -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: #FEF3C7; border: 1px solid #FDE68A; border-radius: 20px; padding: 6px 14px; font-size: 12px; font-weight: 600; color: #92400E; margin-bottom: 24px;">
                      ⏱ This code expires in 5 minutes
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #888888;">
                If you did not request this verification code, please ignore this email. No action will be taken on your account. Never share this code with anyone.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px 32px; background-color: #FAFAFA; border-top: 1px solid #F0ECE3; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 11px; color: #999999;">
                Need help? Contact us at <a href="mailto:ceo@bacstory.com" style="color: #111111; text-decoration: underline; font-weight: 500;">ceo@bacstory.com</a>
              </p>
              <p style="margin: 0; font-size: 10px; color: #bbbbbb; letter-spacing: 0.5px;">
                &copy; ${new Date().getFullYear()} BACSTORY. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Send OTP via SendGrid
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.otp - 6-digit OTP code
 * @param {string} [options.type="login"] - "login" | "signup" | "claim"
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendOtpEmail = async ({ to, otp, type = "login" }) => {
  try {
    const isConfigured = initSendGrid();
    if (!isConfigured) {
      return {
        success: false,
        error: "SendGrid API key is not configured.",
      };
    }

    const cleanEmail = String(to).toLowerCase().trim();
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || "ceo@bacstory.com";
    const fromName = process.env.SENDGRID_FROM_NAME || "BACSTORY";

    const isSignup = type === "signup";
    const isClaim = type === "claim";
    const subject = isSignup
      ? `${otp} is your BACSTORY verification code`
      : isClaim
      ? `${otp} is your BACSTORY QR claim code`
      : `${otp} is your BACSTORY login code`;

    const textContent = `BACSTORY - Wear Your Narrative\n\nYour one-time verification code is: ${otp}\n\nThis code will expire in 5 minutes. Please do not share this code with anyone.\n\nIf you did not request this code, you can safely ignore this email.\n\nSupport: ${fromEmail}`;
    const htmlContent = generateOtpEmailHtml({
      otp,
      type,
      recipientEmail: cleanEmail,
    });

    const msg = {
      to: cleanEmail,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject,
      text: textContent,
      html: htmlContent,
    };

    const response = await sgMail.send(msg);
    const messageId = response?.[0]?.headers?.["x-message-id"];

    console.log(`[SendGrid] OTP email successfully sent to ${cleanEmail} (Status: ${response?.[0]?.statusCode}, MessageId: ${messageId || "ok"})`);

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    const errorBody = error?.response?.body?.errors || error?.message || error;
    console.error("[SendGrid] Error sending OTP email:", JSON.stringify(errorBody, null, 2));

    return {
      success: false,
      error: error?.response?.body?.errors?.[0]?.message || error.message || "Failed to send email",
    };
  }
};

module.exports = {
  sendOtpEmail,
  initSendGrid,
};
