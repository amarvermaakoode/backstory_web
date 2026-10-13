const http = require("https");

const MSG91_HOSTNAME = "api.msg91.com";
const DEFAULT_WIDGET_ID = "366a6d67716a333633383431";

/**
 * Get configured MSG91 auth key
 */
const getAuthKey = () => {
  return (
    process.env.MSG91_AUTHKEY ||
    process.env.MSG91_AUTH_KEY ||
    ""
  ).trim();
};

/**
 * Get configured MSG91 widget ID
 */
const getWidgetId = () => {
  return (
    process.env.MSG91_WIDGET_ID ||
    DEFAULT_WIDGET_ID
  ).trim();
};

/**
 * Normalize phone number for MSG91 (e.g. 10 digits -> "919876543210")
 */
const formatPhoneForMsg91 = (phone) => {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  // If 10 digits (standard Indian number), prefix 91
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
};

/**
 * Helper to make HTTPS requests to MSG91 API
 */
const msg91Request = (path, payload) => {
  return new Promise((resolve, reject) => {
    const authKey = getAuthKey();
    const dataString = JSON.stringify(payload);

    const options = {
      method: "POST",
      hostname: MSG91_HOSTNAME,
      port: 443,
      path,
      headers: {
        authkey: authKey,
        "content-type": "application/json",
        "Content-Length": Buffer.byteLength(dataString),
      },
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const bodyStr = Buffer.concat(chunks).toString();
        try {
          const parsed = JSON.parse(bodyStr);
          resolve({ status: res.statusCode, data: parsed, raw: bodyStr });
        } catch {
          resolve({ status: res.statusCode, data: null, raw: bodyStr });
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(dataString);
    req.end();
  });
};

/**
 * Send OTP via MSG91 Widget
 * @param {string} phone - Mobile number
 * @returns {Promise<{ success: boolean, reqId?: string, error?: string, raw?: any }>}
 */
const sendWidgetOtp = async (phone) => {
  const authKey = getAuthKey();
  const widgetId = getWidgetId();
  const identifier = formatPhoneForMsg91(phone);

  if (!authKey) {
    console.warn(
      "[MSG91] Warning: MSG91_AUTHKEY is not configured in backend/.env. Real SMS cannot be dispatched."
    );
    return {
      success: false,
      missingAuthKey: true,
      error: "MSG91_AUTHKEY is not configured.",
    };
  }

  try {
    console.log(`[MSG91] Dispatching OTP via widget (${widgetId}) to ${identifier}...`);
    const res = await msg91Request("/api/v5/widget/sendOtp", {
      widgetId,
      identifier,
    });

    console.log("[MSG91] sendOtp response:", res.data || res.raw);

    // MSG91 success returns: { "type": "success", "message": "<reqId>" }
    if (res.data && res.data.type === "success") {
      const reqId = res.data.message;
      return {
        success: true,
        reqId,
        data: res.data,
      };
    }

    const errorMsg =
      res.data?.message ||
      res.data?.errors ||
      res.data?.error ||
      "Failed to send OTP via MSG91";

    if (typeof errorMsg === "string" && errorMsg.toLowerCase().includes("captcha")) {
      console.warn(
        "\n⚠️ [MSG91 Notice] 'Invalid Captcha Token' error received from MSG91.\n" +
          "👉 FIX: Log in to your MSG91 Dashboard > OTP Widget (366a6d67716a333633383431) > Settings,\n" +
          "   and toggle OFF 're-Captcha validation'. Then click Save.\n"
      );
    }

    return {
      success: false,
      error: errorMsg,
      data: res.data,
    };
  } catch (err) {
    console.error("[MSG91] Error sending OTP:", err.message);
    return {
      success: false,
      error: err.message,
    };
  }
};

/**
 * Retry / Resend OTP via MSG91 Widget
 * @param {string} reqId - Request ID from previous sendWidgetOtp
 */
const retryWidgetOtp = async (reqId) => {
  const authKey = getAuthKey();
  const widgetId = getWidgetId();

  if (!authKey || !reqId) {
    return { success: false, error: "Missing authkey or reqId" };
  }

  try {
    console.log(`[MSG91] Retrying OTP for reqId: ${reqId}...`);
    const res = await msg91Request("/api/v5/widget/retryOtp", {
      widgetId,
      reqId,
    });

    console.log("[MSG91] retryOtp response:", res.data || res.raw);

    if (res.data && res.data.type === "success") {
      return { success: true, data: res.data };
    }

    return {
      success: false,
      error: res.data?.message || "Failed to retry OTP",
    };
  } catch (err) {
    console.error("[MSG91] Error retrying OTP:", err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Verify OTP via MSG91 Widget
 * @param {string} reqId - Request ID from sendWidgetOtp
 * @param {string} otp - User entered OTP
 */
const verifyWidgetOtp = async (reqId, otp) => {
  const authKey = getAuthKey();
  const widgetId = getWidgetId();

  if (!authKey) {
    return {
      success: false,
      missingAuthKey: true,
      error: "MSG91_AUTHKEY is not configured.",
    };
  }

  if (!reqId || !otp) {
    return {
      success: false,
      error: "Missing reqId or OTP",
    };
  }

  try {
    console.log(`[MSG91] Verifying OTP for reqId: ${reqId}...`);
    const res = await msg91Request("/api/v5/widget/verifyOtp", {
      widgetId,
      reqId,
      otp: String(otp).trim(),
    });

    console.log("[MSG91] verifyOtp response:", res.data || res.raw);

    // MSG91 success returns: { "type": "success", "message": "OTP verified successfully", "access-token": "..." }
    if (res.data && res.data.type === "success") {
      return {
        success: true,
        accessToken: res.data["access-token"],
        message: res.data.message || "OTP verified successfully",
      };
    }

    const errorMsg =
      res.data?.message ||
      res.data?.errors ||
      "Invalid or expired OTP code.";

    return {
      success: false,
      error: errorMsg,
      data: res.data,
    };
  } catch (err) {
    console.error("[MSG91] Error verifying OTP:", err.message);
    return {
      success: false,
      error: err.message,
    };
  }
};

module.exports = {
  sendWidgetOtp,
  retryWidgetOtp,
  verifyWidgetOtp,
  formatPhoneForMsg91,
};
