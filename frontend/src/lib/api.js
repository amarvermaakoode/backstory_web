// Centralized API configuration and shared helpers.
// Previously these were duplicated (identically) across ~13 components/pages.

// Base origin of the Express backend (no trailing slash).
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Base URL for all REST endpoints.
export const API_BASE_URL = `${API_URL}/api`;

/**
 * Resolve an image path to a fully-qualified, renderable URL.
 * - Falsy paths fall back to the local placeholder.
 * - Absolute (http/data) and local public (/images/...) paths are returned as-is.
 * - Everything else (e.g. backend "/uploads/..") is resolved against the API origin.
 */
export const getImageUrl = (path) => {
  if (!path || typeof path !== "string" || !path.trim() || path === "null" || path === "undefined") {
    return "/images/landing-page/coding-tshirt.png";
  }
  const cleanPath = path.trim();
  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://") || cleanPath.startsWith("data:")) return cleanPath;
  if (cleanPath.startsWith("/images/")) return cleanPath;
  if (cleanPath.startsWith("images/")) return `/${cleanPath}`;
  if (cleanPath.includes("tshirt") || cleanPath.includes("coding") || cleanPath.includes("biker") || cleanPath.includes("wonderlust") || cleanPath.includes("first") || cleanPath.includes("pants") || cleanPath.includes("featured")) {
    return `/images/landing-page/${cleanPath.replace(/^\//, "")}`;
  }
  if (cleanPath.startsWith("/uploads") || cleanPath.startsWith("uploads")) {
    return `${API_URL}${cleanPath.startsWith("/") ? "" : "/"}${cleanPath}`;
  }
  if (cleanPath.startsWith("/")) return cleanPath;
  return `/images/landing-page/${cleanPath}`;
};
