import { API_BASE_URL } from "@/lib/api";

/**
 * Service functions for QR Code operations
 */

// Fetch public details of a QR code by unique code (e.g. BAC-BEE16B-1ED469)
export async function getQRCodeByCode(code) {
  try {
    const res = await fetch(`${API_BASE_URL}/frontend/qr/${encodeURIComponent(code)}`, {
      cache: "no-store",
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching QR code details:", error);
    return {
      success: false,
      message: "Failed to connect to server. Please try again later.",
    };
  }
}

// Step 1: Send OTP to Email or Mobile Number for claiming QR Code with Order ID
export async function sendClaimOTP(code, orderId, identifier) {
  try {
    const res = await fetch(`${API_BASE_URL}/frontend/qr/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, orderId, identifier, email: identifier }),
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error sending claim OTP:", error);
    return {
      success: false,
      message: "Failed to send OTP verification code.",
    };
  }
}

// Step 2: Verify OTP & Claim QR Code (Links to User Account and logs user in)
export async function verifyClaimOTP(code, orderId, identifier, otp) {
  try {
    const res = await fetch(`${API_BASE_URL}/frontend/qr/verify-claim-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, orderId, identifier, email: identifier, otp }),
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error verifying claim OTP:", error);
    return {
      success: false,
      message: "Failed to verify OTP and claim QR code.",
    };
  }
}

// Update QR Code Profile / Story (Authenticated owner)
export async function updateQRProfile(userFetch, profilePayload) {
  try {
    const res = await userFetch("/qr/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profilePayload),
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error updating QR profile:", error);
    return {
      success: false,
      message: "Failed to update profile.",
    };
  }
}

// Get all claimed QR codes for current user
export async function getMyQRCodes(userFetch) {
  try {
    const res = await userFetch("/qr/my-qrs");
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching user QR codes:", error);
    return { success: false, qrCodes: [] };
  }
}
