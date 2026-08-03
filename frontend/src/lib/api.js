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
  if (!path || typeof path !== "string") return "/images/logo.png";
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  if (path.startsWith("/images/")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};
