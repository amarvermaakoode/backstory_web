// Centralized API configuration and shared helpers.
// Previously these were duplicated (identically) across ~13 components/pages.

// Base origin of the Express backend (no trailing slash).
const getApiBaseOrigin = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    // If user loaded the site via 127.0.0.1 or local network IP, keep the host aligned with window.location
    if (window.location.hostname === "127.0.0.1" && (!envUrl || envUrl.includes("localhost"))) {
      return "http://127.0.0.1:5000";
    }
  }
  return envUrl || "http://localhost:5000";
};

export const API_URL = getApiBaseOrigin();

// Base URL for all REST endpoints.
export const API_BASE_URL = `${API_URL}/api`;

/**
 * Resolve an image path to a fully-qualified, renderable URL.
 * - Falsy paths fall back to the local placeholder.
 * - Absolute (http/data/blob) URLs are returned as-is.
 * - Public static site images (/images/...) are resolved locally.
 * - Uploads (/uploads/... or backend relative paths) are resolved against API_URL origin.
 */
export const getImageUrl = (path) => {
  if (!path || typeof path !== "string" || !path.trim() || path === "null" || path === "undefined") {
    return "/images/landing-page/coding-tshirt.png";
  }
  const cleanPath = path.trim();

  // 1. Data URLs, Blob URLs, or external HTTP(S) links
  if (
    cleanPath.startsWith("http://") ||
    cleanPath.startsWith("https://") ||
    cleanPath.startsWith("data:") ||
    cleanPath.startsWith("blob:")
  ) {
    return cleanPath;
  }

  // 2. Explicit public static site images (/images/... or images/...)
  if (cleanPath.startsWith("/images/")) return cleanPath;
  if (cleanPath.startsWith("images/")) return `/${cleanPath}`;

  // 3. Explicit backend uploads (/uploads/... or uploads/...)
  if (cleanPath.startsWith("/uploads") || cleanPath.startsWith("uploads")) {
    return `${API_URL}${cleanPath.startsWith("/") ? "" : "/"}${cleanPath}`;
  }
  if (cleanPath.includes("uploads/")) {
    return `${API_URL}/${cleanPath.substring(cleanPath.indexOf("uploads/"))}`;
  }

  // 4. Landing page static shirt/collection assets
  const isLandingPageProduct = [
    "tshirt", "coding", "biker", "wonderlust", "first", "pants", "featured"
  ].some(keyword => cleanPath.toLowerCase().includes(keyword));

  // 5. Proof photo / Return upload / Media files
  const isProofOrUpload =
    /\.(mp4|webm|ogg|mov|avi|mkv|jpg|jpeg|png|webp|gif|svg)$/i.test(cleanPath) ||
    cleanPath.toLowerCase().includes("proof") ||
    cleanPath.toLowerCase().includes("return") ||
    cleanPath.toLowerCase().includes("upload") ||
    cleanPath.toLowerCase().includes("screenrecording");

  if (isLandingPageProduct && !isProofOrUpload) {
    return `/images/landing-page/${cleanPath.replace(/^\//, "")}`;
  }

  if (isProofOrUpload) {
    return `${API_URL}/uploads/${cleanPath.replace(/^\//, "")}`;
  }

  if (cleanPath.startsWith("/")) return cleanPath;
  return `${API_URL}/uploads/${cleanPath}`;
};
