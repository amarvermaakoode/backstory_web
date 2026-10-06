const sgMail = require("@sendgrid/mail");
const nodemailer = require("nodemailer");

/**
 * Get base URL for frontend links in emails
 */
const getFrontendUrl = () => {
  const rawUrl = process.env.FRONTEND_URL || process.env.FORNTEND_URL || "http://localhost:3000";
  if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
    return `http://${rawUrl}`;
  }
  return rawUrl;
};

/**
 * Get the logo URL for emails
 */
const getEmailLogoUrl = () => {
  if (process.env.EMAIL_LOGO_URL) {
    return process.env.EMAIL_LOGO_URL;
  }
  const baseUrl = getFrontendUrl();
  return `${baseUrl}/images/bacstory-logo.png`;
};

/**
 * Configure SendGrid API Key
 */
const initSendGrid = () => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    return false;
  }
  sgMail.setApiKey(apiKey);
  return true;
};

/**
 * Configure Nodemailer SMTP Transporter
 */
const getNodemailerTransporter = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const port = process.env.SMTP_PORT || 587;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass },
    });
  }

  // Support Gmail service shorthand
  if ((process.env.EMAIL_SERVICE === "gmail" || (user && user.includes("@gmail.com"))) && user && pass) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }

  return null;
};

/**
 * Send email via MSG91 API (if configured)
 */
// const sendViaMsg91 = async ({ to, subject, html, fromName, fromEmail }) => {
//   const authKey = process.env.MSG91_AUTH_KEY;
//   if (!authKey) return { success: false, error: "No MSG91 auth key" };
//   const domain = process.env.MSG91_EMAIL_DOMAIN;
//   try {
//     const res = await fetch("https://control.msg91.com/api/v5/email/send", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         authkey: authKey,
//       },
//       body: JSON.stringify({
//         to: [{ email: to }],
//         from: { name: fromName, email: fromEmail },
//         domain: domain,
//         subject: subject,
//         body: {
//           type: "text/html",
//           data: html
//         },
//       }),
//     });
//     const data = await res.json();
//     if (data.status === "success" || data.status === "ok") {
//       return { success: true, messageId: data.data?.message_id || "msg91_ok" };
//     }
//     return { success: false, error: data.message || "MSG91 error" };
//   } catch (err) {
//     return { success: false, error: err.message };
//   }
// };

/**
 * Unified Email Dispatcher
 * Priority: 1. SendGrid -> 2. Nodemailer (SMTP) -> 3. Local Simulation
 */
const dispatchEmail = async ({ to, subject, html, text, purpose = "Notification" }) => {
  const cleanEmail = String(to).toLowerCase().trim();
  const fromEmail =
    process.env.SENDGRID_FROM_EMAIL ||
    process.env.EMAIL_FROM ||
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    "ceo@bacstory.com";
  const fromName =
    process.env.SENDGRID_FROM_NAME ||
    process.env.EMAIL_FROM_NAME ||
    "BACSTORY";

  // 1. SendGrid Provider
  if (process.env.SENDGRID_API_KEY && initSendGrid()) {
    try {
      const response = await sgMail.send({
        to: cleanEmail,
        from: { email: fromEmail, name: fromName },
        subject,
        html,
        text,
      });
      const messageId = response?.[0]?.headers?.["x-message-id"];
      console.log(`[SendGrid] ${purpose} email successfully sent to ${cleanEmail} (MessageId: ${messageId || "ok"})`);
      return { success: true, provider: "sendgrid", messageId };
    } catch (sgError) {
      const errorBody = sgError?.response?.body?.errors || sgError?.message || sgError;
      console.error(`[SendGrid] Error sending ${purpose} email:`, JSON.stringify(errorBody, null, 2));
    }
  }

  // 2. Nodemailer SMTP Provider
  const transporter = getNodemailerTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: cleanEmail,
        subject,
        html,
        text,
      });
      console.log(`[SMTP] ${purpose} email successfully sent to ${cleanEmail} (MessageId: ${info.messageId})`);
      return { success: true, provider: "smtp", messageId: info.messageId };
    } catch (smtpError) {
      console.error(`[SMTP] Error sending ${purpose} email:`, smtpError.message);
    }
  }

  // 3. MSG91 Provider (Disabled)
  // if (process.env.MSG91_AUTH_KEY) {
  //   try {
  //     const msg91Res = await sendViaMsg91({
  //       to: cleanEmail,
  //       subject,
  //       html,
  //       fromName,
  //       fromEmail,
  //     });
  //     if (msg91Res.success) {
  //       console.log(`[MSG91] ${purpose} email successfully sent to ${cleanEmail}`);
  //       return { success: true, provider: "msg91", messageId: msg91Res.messageId };
  //     }
  //     console.warn(`[MSG91] Failed to dispatch ${purpose} email:`, msg91Res.error);
  //   } catch (msg91Err) {
  //     console.error(`[MSG91] Error dispatching ${purpose} email:`, msg91Err.message);
  //   }
  // }

  // 4. Simulated Logging (active when live provider credentials are pending)
  console.log(`[EmailService: Simulated] ${purpose} email prepared for ${cleanEmail}: "${subject}"`);
  console.log(`[EmailService: Hint] To send live emails directly to inboxes, add SENDGRID_API_KEY or SMTP credentials (SMTP_HOST, EMAIL_USER, EMAIL_PASS) to backend/.env`);

  return {
    success: true,
    simulated: true,
    message: "Email processed via simulation (live credentials not yet configured in .env)",
  };
};

/**
 * Helper to generate brand HTML template for OTP verification
 */
const generateOtpEmailHtml = ({ otp, type = "login", recipientEmail }) => {
  const baseUrl = getFrontendUrl();
  const logoUrl = getEmailLogoUrl();
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
          
          <!-- Header / Brand Logo -->
          <tr>
            <td style="padding: 36px 36px 20px; text-align: center;">
              <a href="${baseUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                <img src="${logoUrl}" alt="BACSTORY - Wear Your Narrative" width="180" height="52" style="max-width: 180px; width: 100%; height: auto; display: block; margin: 0 auto; border: 0; outline: none; text-decoration: none;" />
              </a>
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
              <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 500; color: #111111;">${greeting}</h2>
              <p style="margin: 0 0 28px; font-size: 14px; line-height: 1.6; color: #555555;">
                ${introMessage}
              </p>

              <!-- OTP Block -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 28px;">
                <tr>
                  <td align="center">
                    <div style="background-color: #FAF8F5; border: 1.5px dashed #D6CEC3; border-radius: 14px; padding: 22px 28px; display: inline-block;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 600; letter-spacing: 12px; color: #111111; display: inline-block; padding-left: 12px;">
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
                    <div style="display: inline-block; background-color: #FEF3C7; border: 1px solid #FDE68A; border-radius: 20px; padding: 6px 14px; font-size: 12px; font-weight: 400; color: #92400E; margin-bottom: 24px;">
                      &#9201; This code expires in 5 minutes
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
 * Helper to generate brand HTML template for Order Confirmation
 */
const generateOrderEmailHtml = ({ order, recipientEmail }) => {
  const baseUrl = getFrontendUrl();
  const logoUrl = getEmailLogoUrl();
  const addr = order.shippingAddress || {};
  const recipientName = `${addr.firstName || ""} ${addr.lastName || ""}`.trim() || "Customer";
  const orderId = order.orderId || "N/A";
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    : new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const paymentMethod = order.paymentMethod || "Prepaid";
  const paymentStatus = order.paymentStatus || "Paid";
  const shippingMethod = order.shippingMethod || "Standard Delivery";
  const estimatedDelivery =
    (order.items && order.items[0] && order.items[0].deliveryDate) ||
    "Estimated Delivery: 3-5 Business Days";

  const subtotal = Number(order.subtotal || 0);
  const discountAmount = Number(order.discountAmount || 0);
  const prepaidDiscount = Number(order.prepaidDiscount || 0);
  const walletDeduction = Number(order.walletDeduction || 0);
  const shippingCost = Number(order.shippingCost || 0);
  const totalAmount = Number(order.totalAmount || 0);

  const addressLines = [
    addr.streetAddress,
    [addr.city, addr.state].filter(Boolean).join(", "),
    addr.pinCode ? `PIN: ${addr.pinCode}` : null,
    addr.country || "India",
  ].filter(Boolean);

  const itemsRows = (order.items || [])
    .map((item) => {
      const itemPrice =
        Number(item.priceNum) ||
        Number(String(item.price || "").replace(/[^0-9.]/g, "")) ||
        0;
      const itemTotal = itemPrice * (item.quantity || 1);
      let imageUrl = item.image || "";
      if (imageUrl && imageUrl.startsWith("/")) {
        imageUrl = `${baseUrl}${imageUrl}`;
      }

      return `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #f0ece3; vertical-align: top;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              ${imageUrl
          ? `
                <td style="width: 70px; vertical-align: top; padding-right: 14px;">
                  <img src="${imageUrl}" alt="${item.name || "Product"}" width="70" height="85" style="width: 70px; height: 85px; object-fit: cover; border-radius: 8px; border: 1px solid #ebe7df; display: block;" />
                </td>`
          : `
                <td style="width: 70px; vertical-align: top; padding-right: 14px;">
                  <div style="width: 70px; height: 85px; border-radius: 8px; background-color: #f7f6f2; border: 1px solid #ebe7df; text-align: center; line-height: 85px; font-size: 10px; font-weight: 500; color: #8a8277; letter-spacing: 1px;">BACSTORY</div>
                </td>`
        }
              <td style="vertical-align: top;">
                <p style="margin: 0 0 6px; font-size: 14px; font-weight: 500; color: #111111; line-height: 1.3;">
                  ${item.name || "BACSTORY Garment"}
                </p>
                <div style="margin: 0 0 6px; font-size: 12px; color: #666666;">
                  <span>Size: <strong style="color: #111111;">${item.size || "M"}</strong></span>
                  ${item.color
          ? ` &bull; <span>Color: <strong style="color: #111111;">${item.color}</strong></span>`
          : ""
        }
                </div>
                <div style="margin: 0; font-size: 12px; color: #8a8277;">
                  Qty: ${item.quantity || 1} &times; &#8377;${itemPrice.toLocaleString("en-IN")}
                </div>
              </td>
              <td style="vertical-align: top; text-align: right; white-space: nowrap; padding-left: 10px;">
                <p style="margin: 0; font-size: 14px; font-weight: 500; color: #111111;">
                  &#8377;${itemTotal.toLocaleString("en-IN")}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmed #${orderId} - BACSTORY</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f6f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f7f6f2; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 18px; border: 1px solid #ebe7df; overflow: hidden; box-shadow: 0 4px 25px rgba(0,0,0,0.04);">
          <!-- Top Accent Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #111111 0%, #7A5236 100%);"></td>
          </tr>

          <!-- Header / Brand Logo -->
          <tr>
            <td style="padding: 32px 32px 20px; text-align: center;">
              <a href="${baseUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                <img src="${logoUrl}" alt="BACSTORY - Wear Your Narrative" width="180" height="52" style="max-width: 180px; width: 100%; height: auto; display: block; margin: 0 auto; border: 0; outline: none; text-decoration: none;" />
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <hr style="border: none; border-top: 1px solid #f0ece3; margin: 0;">
            </td>
          </tr>

          <!-- Confirmation Hero -->
          <tr>
            <td style="padding: 32px 32px 20px; text-align: center;">
              <div style="display: inline-block; background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 20px; padding: 6px 16px; font-size: 12px; font-weight: 500; color: #065F46; letter-spacing: 0.5px; margin-bottom: 16px;">
                &#10003; ORDER CONFIRMED
              </div>
              <h2 style="margin: 0 0 10px; font-size: 22px; font-weight: 600; color: #111111;">
                Thank You for Your Order!
              </h2>
              <p style="margin: 0 auto; max-width: 480px; font-size: 14px; line-height: 1.6; color: #555555;">
                Hi <strong>${recipientName}</strong>, your order has been received and confirmed. We are crafting and preparing your narrative with the utmost care.
              </p>
            </td>
          </tr>

          <!-- Order Overview Badges -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #faf8f5; border: 1px solid #ede8de; border-radius: 12px; padding: 16px;">
                <tr>
                  <td style="padding: 8px 12px; width: 50%; vertical-align: top;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #8a8277; font-weight: 500; margin-bottom: 4px;">Order Number</div>
                    <div style="font-size: 15px; font-weight: 500; color: #111111;">#${orderId}</div>
                  </td>
                  <td style="padding: 8px 12px; width: 50%; vertical-align: top;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #8a8277; font-weight: 500; margin-bottom: 4px;">Order Date</div>
                    <div style="font-size: 14px; font-weight: 500; color: #111111;">${orderDate}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; width: 50%; vertical-align: top;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #8a8277; font-weight: 500; margin-bottom: 4px;">Payment Method</div>
                    <div style="font-size: 13px; font-weight: 400; color: #111111;">${paymentMethod} <span style="font-size: 11px; color: #059669; font-weight: 500;">(${paymentStatus})</span></div>
                  </td>
                  <td style="padding: 8px 12px; width: 50%; vertical-align: top;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #8a8277; font-weight: 500; margin-bottom: 4px;">Estimated Delivery</div>
                    <div style="font-size: 13px; font-weight: 400; color: #111111;">${estimatedDelivery}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Ordered Section -->
          <tr>
            <td style="padding: 0 32px 16px;">
              <div style="font-size: 11px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: #8a8277; margin-bottom: 12px; border-bottom: 2px solid #111111; padding-bottom: 6px;">
                Items in Your Order
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                ${itemsRows}
              </table>
            </td>
          </tr>

          <!-- Price Breakdown Summary -->
          <tr>
            <td style="padding: 0 32px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #faf8f5; border: 1px solid #ede8de; border-radius: 12px; padding: 18px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #666666;">Subtotal</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 400; color: #111111; text-align: right;">&#8377;${subtotal.toLocaleString("en-IN")}</td>
                </tr>
                ${discountAmount > 0
      ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #059669;">Promo Discount</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 400; color: #059669; text-align: right;">-&#8377;${discountAmount.toLocaleString("en-IN")}</td>
                </tr>`
      : ""
    }
                ${prepaidDiscount > 0
      ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #059669;">Prepaid Discount</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #059669; text-align: right;">-&#8377;${prepaidDiscount.toLocaleString("en-IN")}</td>
                </tr>`
      : ""
    }
                ${walletDeduction > 0
      ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #059669;">Wallet Balance Applied</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #059669; text-align: right;">-&#8377;${walletDeduction.toLocaleString("en-IN")}</td>
                </tr>`
      : ""
    }
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #666666;">Shipping (${shippingMethod})</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 500; color: #111111; text-align: right;">
                    ${shippingCost === 0 ? '<span style="color: #059669; font-weight: 500;">FREE</span>' : `&#8377;${shippingCost.toLocaleString("en-IN")}`}
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 10px 0 6px;">
                    <hr style="border: none; border-top: 1.5px dashed #d6cec3; margin: 0;">
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 15px; font-weight: 500; color: #111111;">Total Amount</td>
                  <td style="padding: 6px 0; font-size: 18px; font-weight: 500; color: #111111; text-align: right;">&#8377;${totalAmount.toLocaleString("en-IN")}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping Address -->
          <tr>
            <td style="padding: 0 32px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #ede8de; border-radius: 12px; padding: 18px;">
                <tr>
                  <td style="vertical-align: top;">
                    <div style="font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #8a8277; margin-bottom: 6px;">
                      Shipping Address
                    </div>
                    <div style="font-size: 14px; font-weight: 500; color: #111111; margin-bottom: 4px;">
                      ${recipientName}
                    </div>
                    <div style="font-size: 13px; line-height: 1.5; color: #555555;">
                      ${addressLines.join("<br />")}
                    </div>
                    ${addr.phoneNumber
      ? `<div style="font-size: 12px; color: #777777; margin-top: 6px;">Phone: +91 ${addr.phoneNumber}</div>`
      : ""
    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 32px 32px; text-align: center;">
              <a href="${baseUrl}/account/orders" target="_blank" style="display: inline-block; background-color: #111111; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; padding: 14px 32px; border-radius: 8px;">
                Track &amp; View Your Order
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px 32px; background-color: #FAFAFA; border-top: 1px solid #F0ECE3; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #666666;">
                Need help or have questions about your order? Reach us at <a href="mailto:ceo@bacstory.com" style="color: #111111; text-decoration: underline; font-weight: 500;">ceo@bacstory.com</a>
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
 * Generate plain text fallback for Order Confirmation
 */
const generateOrderEmailText = ({ order }) => {
  const addr = order.shippingAddress || {};
  const recipientName = `${addr.firstName || ""} ${addr.lastName || ""}`.trim() || "Customer";
  const orderId = order.orderId || "N/A";
  const totalAmount = Number(order.totalAmount || 0);

  const itemsText = (order.items || [])
    .map(
      (item) =>
        `- ${item.name || "Product"} (Size: ${item.size || "M"}, Color: ${item.color || "Standard"}, Qty: ${item.quantity || 1}) - Rs ${item.priceNum || 0}`
    )
    .join("\n");

  return `BACSTORY - Wear Your Narrative\n\nOrder Confirmed: #${orderId}\n\nHi ${recipientName},\n\nThank you for your order! We have received your order and are preparing it for delivery.\n\nOrder Details:\nOrder Number: #${orderId}\nPayment Method: ${order.paymentMethod || "Prepaid"} (${order.paymentStatus || "Paid"})\nTotal Amount: Rs ${totalAmount.toLocaleString("en-IN")}\n\nItems Ordered:\n${itemsText}\n\nDelivery Address:\n${recipientName}\n${addr.streetAddress || ""}\n${[addr.city, addr.state, addr.pinCode].filter(Boolean).join(", ")}\nPhone: ${addr.phoneNumber || "N/A"}\n\nTrack your order at: ${getFrontendUrl()}/account/orders\n\nSupport: ceo@bacstory.com`;
};

/**
 * Send OTP via configured provider
 */
const sendOtpEmail = async ({ to, otp, type = "login" }) => {
  try {
    const cleanEmail = String(to).toLowerCase().trim();
    const isSignup = type === "signup";
    const isClaim = type === "claim";
    const subject = isSignup
      ? `${otp} is your BACSTORY verification code`
      : isClaim
        ? `${otp} is your BACSTORY QR claim code`
        : `${otp} is your BACSTORY login code`;

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || "ceo@bacstory.com";
    const textContent = `BACSTORY - Wear Your Narrative\n\nYour one-time verification code is: ${otp}\n\nThis code will expire in 5 minutes. Please do not share this code with anyone.\n\nIf you did not request this code, you can safely ignore this email.\n\nSupport: ${fromEmail}`;
    const htmlContent = generateOtpEmailHtml({
      otp,
      type,
      recipientEmail: cleanEmail,
    });

    return await dispatchEmail({
      to: cleanEmail,
      subject,
      html: htmlContent,
      text: textContent,
      purpose: `${type} OTP`,
    });
  } catch (error) {
    console.error("[EmailService] Error sending OTP email:", error);
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
};

/**
 * Send Order Confirmation Email
 * @param {Object} options
 * @param {Object} options.order - The saved order document/object
 * @param {string} [options.recipientEmail] - Target customer email (falls back to shippingAddress.email)
 * @returns {Promise<{success: boolean, provider?: string, messageId?: string, error?: string}>}
 */
const sendOrderConfirmationEmail = async ({ order, recipientEmail }) => {
  try {
    const toEmail = String(
      recipientEmail || order?.shippingAddress?.email || ""
    ).toLowerCase().trim();

    if (!toEmail) {
      console.warn("[EmailService] No recipient email provided for order confirmation.");
      return { success: false, error: "No recipient email provided" };
    }

    const orderId = order.orderId || "N/A";
    const subject = `Order Confirmed: #${orderId} - BACSTORY`;
    const htmlContent = generateOrderEmailHtml({ order, recipientEmail: toEmail });
    const textContent = generateOrderEmailText({ order });

    return await dispatchEmail({
      to: toEmail,
      subject,
      html: htmlContent,
      text: textContent,
      purpose: `Order Confirmation #${orderId}`,
    });
  } catch (error) {
    console.error("[EmailService] Error generating/sending order confirmation email:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Helper to determine badge styling, titles, and text for order status updates
 */
const getStatusDetails = (status, type = "orderStatus", order = {}, notes = "", meta = {}) => {
  const norm = String(status || "").toLowerCase().trim();
  let badgeText = status ? status.toUpperCase() : "STATUS UPDATED";
  let badgeBg = "#ECFDF5";
  let badgeBorder = "#A7F3D0";
  let badgeColor = "#065F46";
  let title = `Update on Order #${order.orderId || ""}`;
  let headline = `Your order status has been updated to "${status}".`;
  let subject = `Order #${order.orderId || ""}: Status Update - ${status} - BACSTORY`;

  if (norm.includes("pack") || norm.includes("ready to ship")) {
    badgeText = "READY TO PACK & SHIP";
    badgeBg = "#FEF3C7";
    badgeBorder = "#FDE68A";
    badgeColor = "#92400E";
    title = "Packing in Progress";
    headline = "Your order is being carefully packed at our atelier and will be handed over to the courier partner shortly.";
    subject = `Order #${order.orderId}: Packing in Progress - BACSTORY`;
  } else if (norm.includes("dispatch") || norm.includes("in transit")) {
    badgeText = "DISPATCHED & IN TRANSIT";
    badgeBg = "#EFF6FF";
    badgeBorder = "#BFDBFE";
    badgeColor = "#1D4ED8";
    title = "Your Order is on the Way!";
    headline = "Your package has been dispatched from our facility and is currently in transit to your delivery destination.";
    subject = `Order #${order.orderId}: Dispatched & In Transit - BACSTORY`;
  } else if (norm.includes("out for delivery")) {
    badgeText = "OUT FOR DELIVERY";
    badgeBg = "#F5F3FF";
    badgeBorder = "#DDD6FE";
    badgeColor = "#6D28D9";
    title = "Out for Delivery Today";
    headline = "Our courier partner is out for delivery with your BACSTORY piece. Please ensure someone is available at the delivery address.";
    subject = `Order #${order.orderId} is Out for Delivery! - BACSTORY`;
  } else if (norm === "delivered") {
    badgeText = "DELIVERED";
    badgeBg = "#ECFDF5";
    badgeBorder = "#A7F3D0";
    badgeColor = "#065F46";
    title = "Your Order Has Arrived!";
    headline = "Your package has been successfully delivered. We hope you enjoy wearing your narrative.";
    subject = `Delivered: Your BACSTORY Order #${order.orderId} - BACSTORY`;
  } else if (norm.includes("cancel")) {
    badgeText = "ORDER CANCELLED";
    badgeBg = "#FEF2F2";
    badgeBorder = "#FECACA";
    badgeColor = "#991B1B";
    title = "Order Cancelled";
    headline = notes || "Your order has been cancelled. If payment was made, your refund has been processed according to policy.";
    subject = `Order #${order.orderId} Cancelled - BACSTORY`;
  } else if (norm.includes("return request") || (norm.includes("request") && type === "return")) {
    badgeText = "RETURN REQUESTED";
    badgeBg = "#FEF3C7";
    badgeBorder = "#FDE68A";
    badgeColor = "#92400E";
    title = "Return Request Received";
    headline = "We have received your return request. Our support team is reviewing the details and will notify you within 24-48 hours.";
    subject = `Return Request Received for Order #${order.orderId} - BACSTORY`;
  } else if (norm.includes("return approved")) {
    badgeText = "RETURN APPROVED";
    badgeBg = "#ECFDF5";
    badgeBorder = "#A7F3D0";
    badgeColor = "#065F46";
    title = "Return Request Approved";
    headline = "Your return request has been approved! Please keep the item securely packed with original tags for courier pickup.";
    subject = `Return Request Approved: Order #${order.orderId} - BACSTORY`;
  } else if (norm.includes("reject")) {
    badgeText = "REQUEST UPDATE";
    badgeBg = "#FEF2F2";
    badgeBorder = "#FECACA";
    badgeColor = "#991B1B";
    title = "Return/Exchange Request Update";
    headline = notes ? `Your request could not be approved for the following reason: ${notes}` : "Your request could not be approved according to our policy guidelines.";
    subject = `Update on Return/Exchange for Order #${order.orderId} - BACSTORY`;
  } else if (norm.includes("picked up") || norm.includes("received")) {
    badgeText = "ITEM RECEIVED";
    badgeBg = "#EFF6FF";
    badgeBorder = "#BFDBFE";
    badgeColor = "#1D4ED8";
    title = "Returned Item Received";
    headline = "We have received your returned item at our inspection facility. Quality inspection and refund/exchange processing is underway.";
    subject = `Item Received for Order #${order.orderId} - BACSTORY`;
  } else if (norm.includes("refund processing") || norm.includes("refund initiated") || (type === "refund" && !norm.includes("refunded"))) {
    badgeText = "REFUND INITIATED";
    badgeBg = "#EFF6FF";
    badgeBorder = "#BFDBFE";
    badgeColor = "#1D4ED8";
    const refAmt = meta.refundAmount || order.refundDetails?.refundAmount || order.totalAmount || 0;
    title = "Refund Processing Initiated";
    headline = `A refund of ₹${Number(refAmt).toLocaleString("en-IN")} has been initiated. Estimated credit window: ${order.refundDetails?.estimatedCreditWindow || notes || "5-7 Business Days"}.`;
    subject = `Refund Initiated for Order #${order.orderId} - BACSTORY`;
  } else if (norm === "refunded" || (type === "refund" && norm.includes("refunded"))) {
    badgeText = "REFUND COMPLETED";
    badgeBg = "#ECFDF5";
    badgeBorder = "#A7F3D0";
    badgeColor = "#065F46";
    const refAmt = meta.refundAmount || order.refundDetails?.refundAmount || order.totalAmount || 0;
    const refMethod = meta.refundMethod || order.refundDetails?.refundMethod || "Original Payment Method";
    title = "Refund Completed";
    headline = `Your refund of ₹${Number(refAmt).toLocaleString("en-IN")} has been processed and credited to your ${refMethod}.`;
    subject = `Refund Completed for Order #${order.orderId} - BACSTORY`;
  } else if (norm.includes("exchange request") || (norm.includes("request") && type === "exchange")) {
    badgeText = "EXCHANGE REQUESTED";
    badgeBg = "#FEF3C7";
    badgeBorder = "#FDE68A";
    badgeColor = "#92400E";
    title = "Exchange Request Received";
    headline = "We have received your exchange request and our team is preparing the replacement variant.";
    subject = `Exchange Request Received for Order #${order.orderId} - BACSTORY`;
  } else if (norm.includes("exchange approved")) {
    badgeText = "EXCHANGE APPROVED";
    badgeBg = "#ECFDF5";
    badgeBorder = "#A7F3D0";
    badgeColor = "#065F46";
    title = "Exchange Request Approved";
    headline = "Your exchange request has been approved! We are preparing your replacement piece.";
    subject = `Exchange Approved for Order #${order.orderId} - BACSTORY`;
  } else if (norm.includes("exchange completed") || norm === "exchanged") {
    badgeText = "EXCHANGE COMPLETED";
    badgeBg = "#ECFDF5";
    badgeBorder = "#A7F3D0";
    badgeColor = "#065F46";
    title = "Exchange Completed";
    headline = "Your exchange process is complete. We hope your new BACSTORY piece fits your narrative perfectly.";
    subject = `Exchange Completed for Order #${order.orderId} - BACSTORY`;
  }

  return { badgeText, badgeBg, badgeBorder, badgeColor, title, headline, subject };
};

/**
 * Generate brand HTML template for Order Status / Refund / Return / Exchange Update
 */
const generateOrderStatusEmailHtml = ({ order, statusDetails, notes = "", meta = {} }) => {
  const baseUrl = getFrontendUrl();
  const logoUrl = getEmailLogoUrl();
  const addr = order.shippingAddress || {};
  const recipientName = `${addr.firstName || ""} ${addr.lastName || ""}`.trim() || order.user?.name || "Customer";
  const orderId = order.orderId || "N/A";
  const formattedDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const itemsRows = (order.items || []).map((item) => {
    const itemPrice =
      Number(item.priceNum) ||
      Number(String(item.price || "").replace(/[^0-9.]/g, "")) ||
      0;
    const itemTotal = itemPrice * (item.quantity || 1);
    let imageUrl = item.image || "";
    if (imageUrl && imageUrl.startsWith("/")) {
      imageUrl = `${baseUrl}${imageUrl}`;
    }

    return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f0ece3; vertical-align: top;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              ${imageUrl ? `
                <td style="width: 55px; vertical-align: top; padding-right: 12px;">
                  <img src="${imageUrl}" alt="${item.name || "Product"}" width="55" height="68" style="width: 55px; height: 68px; object-fit: cover; border-radius: 8px; border: 1px solid #ebe7df; display: block;" />
                </td>` : `
                <td style="width: 55px; vertical-align: top; padding-right: 12px;">
                  <div style="width: 55px; height: 68px; border-radius: 8px; background-color: #f7f6f2; border: 1px solid #ebe7df; text-align: center; line-height: 68px; font-size: 9px; font-weight: 500; color: #8a8277;">BACSTORY</div>
                </td>`
              }
              <td style="vertical-align: top;">
                <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #111111; line-height: 1.3;">
                  ${item.name || "BACSTORY Garment"}
                </p>
                <div style="margin: 0 0 4px; font-size: 12px; color: #666666;">
                  <span>Size: <strong>${item.size || "M"}</strong></span>
                  ${item.color ? ` &bull; <span>Color: <strong>${item.color}</strong></span>` : ""}
                </div>
                <div style="margin: 0; font-size: 11px; color: #8a8277;">
                  Qty: ${item.quantity || 1} &times; &#8377;${itemPrice.toLocaleString("en-IN")}
                </div>
              </td>
              <td style="vertical-align: top; text-align: right; white-space: nowrap; padding-left: 10px;">
                <p style="margin: 0; font-size: 13px; font-weight: 600; color: #111111;">
                  &#8377;${itemTotal.toLocaleString("en-IN")}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }).join("");

  const refundAmt = meta.refundAmount || order.refundDetails?.refundAmount;
  const refMethod = meta.refundMethod || order.refundDetails?.refundMethod;
  const creditWin = order.refundDetails?.estimatedCreditWindow || meta.estimatedCreditWindow;

  const normStatus = String(statusDetails.badgeText || "").toLowerCase().trim();
  const isFulfillmentStatus = [
    "order confirmed",
    "ready to pack & ship",
    "ready to pack",
    "dispatched & in transit",
    "dispatched",
    "in transit",
    "out for delivery",
    "delivered",
  ].some((s) => normStatus.includes(s) || normStatus === s);

  const hasRelevantExtraInfo =
    !isFulfillmentStatus &&
    (
      (refundAmt && Number(refundAmt) > 0) ||
      (refMethod && String(refMethod).toLowerCase() !== "none" && String(refMethod).trim() !== "") ||
      (notes && String(notes).trim() !== "" && !notes.startsWith("http"))
    );

  const infoBlockHtml = hasRelevantExtraInfo ? `
          <!-- Key Info Block -->
          <tr>
            <td style="padding: 0 32px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #faf8f5; border: 1px solid #ede8de; border-radius: 12px; padding: 14px 18px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 12px; color: #777;">Order Number</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #111; text-align: right;">#${orderId}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 12px; color: #777;">Update Date</td>
                  <td style="padding: 6px 0; font-size: 12px; font-weight: 500; color: #111; text-align: right;">${formattedDate}</td>
                </tr>
                ${refundAmt && Number(refundAmt) > 0 ? `
                  <tr>
                    <td style="padding: 6px 0; font-size: 12px; color: #777;">Refund Amount</td>
                    <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #059669; text-align: right;">&#8377;${Number(refundAmt).toLocaleString("en-IN")}</td>
                  </tr>
                ` : ""}
                ${refMethod && String(refMethod).toLowerCase() !== "none" ? `
                  <tr>
                    <td style="padding: 6px 0; font-size: 12px; color: #777;">Payout Method</td>
                    <td style="padding: 6px 0; font-size: 12px; font-weight: 500; color: #111; text-align: right;">${refMethod}</td>
                  </tr>
                ` : ""}
                ${creditWin && normStatus.includes("refund") ? `
                  <tr>
                    <td style="padding: 6px 0; font-size: 12px; color: #777;">Estimated Credit</td>
                    <td style="padding: 6px 0; font-size: 12px; font-weight: 500; color: #111; text-align: right;">${creditWin}</td>
                  </tr>
                ` : ""}
                ${notes && !notes.startsWith("http") ? `
                  <tr>
                    <td colspan="2" style="padding: 8px 0 2px; font-size: 12px; line-height: 1.5; color: #555; border-top: 1px dashed #e5dfd5;">
                      <strong>Details:</strong> ${notes}
                    </td>
                  </tr>
                ` : ""}
              </table>
            </td>
          </tr>
  ` : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${statusDetails.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f6f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f7f6f2; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 18px; border: 1px solid #ebe7df; overflow: hidden; box-shadow: 0 4px 25px rgba(0,0,0,0.04);">
          <!-- Top Accent Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #111111 0%, #7A5236 100%);"></td>
          </tr>

          <!-- Header / Brand Logo -->
          <tr>
            <td style="padding: 32px 32px 20px; text-align: center;">
              <a href="${baseUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                <img src="${logoUrl}" alt="BACSTORY - Wear Your Narrative" width="180" height="52" style="max-width: 180px; width: 100%; height: auto; display: block; margin: 0 auto; border: 0; outline: none; text-decoration: none;" />
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <hr style="border: none; border-top: 1px solid #f0ece3; margin: 0;">
            </td>
          </tr>

          <!-- Status Hero -->
          <tr>
            <td style="padding: 32px 32px 20px; text-align: center;">
              <div style="display: inline-block; background-color: ${statusDetails.badgeBg}; border: 1px solid ${statusDetails.badgeBorder}; border-radius: 20px; padding: 6px 16px; font-size: 12px; font-weight: 600; color: ${statusDetails.badgeColor}; letter-spacing: 0.5px; margin-bottom: 16px;">
                ${statusDetails.badgeText}
              </div>
              <h2 style="margin: 0 0 10px; font-size: 22px; font-weight: 600; color: #111111;">
                ${statusDetails.title}
              </h2>
              <p style="margin: 0 auto; max-width: 480px; font-size: 14px; line-height: 1.6; color: #555555;">
                Hi <strong>${recipientName}</strong>, ${statusDetails.headline}
              </p>
            </td>
          </tr>

          ${infoBlockHtml}


          <!-- Items Ordered Section -->
          ${itemsRows ? `
            <tr>
              <td style="padding: 0 32px 20px;">
                <div style="font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #8a8277; margin-bottom: 8px; border-bottom: 1px solid #ebe7df; padding-bottom: 6px;">
                  Items in this Order
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  ${itemsRows}
                </table>
              </td>
            </tr>
          ` : ""}

          <!-- CTA Button -->
          <tr>
            <td style="padding: 10px 32px 32px; text-align: center;">
              <a href="${baseUrl}/account/orders" target="_blank" style="display: inline-block; background-color: #111111; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; padding: 14px 32px; border-radius: 8px;">
                View Order Details
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px 32px; background-color: #FAFAFA; border-top: 1px solid #F0ECE3; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #666666;">
                Have any questions? Reach our support team anytime at <a href="mailto:ceo@bacstory.com" style="color: #111111; text-decoration: underline; font-weight: 500;">ceo@bacstory.com</a>
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
 * Generate plain text fallback for Order Status Update
 */
const generateOrderStatusEmailText = ({ order, statusDetails, notes = "", meta = {} }) => {
  const addr = order.shippingAddress || {};
  const recipientName = `${addr.firstName || ""} ${addr.lastName || ""}`.trim() || "Customer";
  const orderId = order.orderId || "N/A";

  return `BACSTORY - Wear Your Narrative\n\nOrder Update: #${orderId}\nStatus: ${statusDetails.badgeText}\n\nHi ${recipientName},\n\n${statusDetails.headline}\n\n${notes ? `Notes: ${notes}\n` : ""}Track your order anytime at: ${getFrontendUrl()}/account/orders\n\nNeed assistance? Contact ceo@bacstory.com`;
};

/**
 * Send Order Status / Refund / Return / Exchange Update Email
 * @param {Object} options
 * @param {Object} options.order - The updated order document/object
 * @param {string} [options.recipientEmail] - Target customer email (falls back to shippingAddress.email)
 * @param {string} [options.statusType="orderStatus"] - "orderStatus" | "refund" | "return" | "exchange" | "cancellation"
 * @param {string} options.newStatus - The new status string
 * @param {string} [options.notes] - Context notes or custom message (e.g. rejection reason, credit window)
 * @param {Object} [options.meta] - Extra metadata (refundAmount, etc.)
 * @returns {Promise<{success: boolean, provider?: string, messageId?: string, error?: string}>}
 */
const sendOrderStatusUpdateEmail = async ({
  order,
  recipientEmail,
  statusType = "orderStatus",
  newStatus,
  notes = "",
  meta = {},
}) => {
  try {
    if (!order) return { success: false, error: "Order object is required" };

    const toEmail = String(
      recipientEmail ||
      order?.shippingAddress?.email ||
      order?.user?.email ||
      ""
    ).toLowerCase().trim();

    if (!toEmail) {
      console.warn(`[EmailService] No recipient email found for order update #${order.orderId || order._id}; email skipped.`);
      return { success: false, error: "No recipient email provided" };
    }

    const statusDetails = getStatusDetails(newStatus, statusType, order, notes, meta);
    const htmlContent = generateOrderStatusEmailHtml({
      order,
      statusDetails,
      notes,
      meta,
    });
    const textContent = generateOrderStatusEmailText({
      order,
      statusDetails,
      notes,
      meta,
    });

    return await dispatchEmail({
      to: toEmail,
      subject: statusDetails.subject,
      html: htmlContent,
      text: textContent,
      purpose: `Order #${order.orderId || ""} update (${newStatus})`,
    });
  } catch (error) {
    console.error("[EmailService] Error sending order status update email:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOtpEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  generateOrderEmailHtml,
  generateOtpEmailHtml,
  generateOrderStatusEmailHtml,
  generateOrderEmailText,
  generateOrderStatusEmailText,
  initSendGrid,
  dispatchEmail,
};

