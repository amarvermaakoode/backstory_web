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

// Claim an unlinked QR code using Order ID (Authenticated)
export async function claimQRCode(userFetch, code, orderId) {
  try {
    const res = await userFetch("/qr/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, orderId }),
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error claiming QR code:", error);
    return {
      success: false,
      message: "Failed to claim QR code. Please try again.",
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
