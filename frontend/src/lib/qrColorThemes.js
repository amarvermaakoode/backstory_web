/**
 * QR Color Themes & Optical Scanning Contrast Validator
 * Adheres to ISO/IEC 18004 QR specification and WCAG 2.1 luminance standards.
 */

export const QR_COLOR_PRESETS = [
  {
    id: "classic-obsidian",
    name: "Classic Obsidian",
    dark: "#000000",
    light: "#FFFFFF",
    badge: "100% Reliable",
  },
  {
    id: "midnight-navy",
    name: "Midnight Navy",
    dark: "#0F172A",
    light: "#FFFFFF",
    badge: "Brand Favorite",
  },
  {
    id: "slate-minimal",
    name: "Slate Minimal",
    dark: "#1E293B",
    light: "#F8FAFC",
    badge: "Soft Light",
  },
  {
    id: "espresso-cream",
    name: "Espresso & Cream",
    dark: "#231815",
    light: "#FAF7F2",
    badge: "Luxury Warm",
  },
  {
    id: "royal-indigo",
    name: "Royal Indigo",
    dark: "#1E1B4B",
    light: "#EEF2FF",
    badge: "Premium Tint",
  },
  {
    id: "forest-emerald",
    name: "Forest Emerald",
    dark: "#064E3B",
    light: "#F0FDF4",
    badge: "Botanical",
  },
  {
    id: "deep-wine",
    name: "Deep Wine",
    dark: "#4C0519",
    light: "#FFF1F2",
    badge: "Velvet",
  },
];

/**
 * Parses 3-digit or 6-digit hex color to RGB [r, g, b] (0-255)
 */
export function hexToRgb(hex) {
  if (!hex || typeof hex !== "string") return [0, 0, 0];
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  if (clean.length === 6) {
    return [
      parseInt(clean.substring(0, 2), 16),
      parseInt(clean.substring(2, 4), 16),
      parseInt(clean.substring(4, 6), 16),
    ];
  }
  return [0, 0, 0];
}

/**
 * Calculates WCAG 2.1 relative luminance (0 to 1)
 */
export function getRelativeLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Analyzes contrast ratio and scan reliability for QR code colors
 *
 * @param {string} darkHex - Foreground (module) color
 * @param {string} lightHex - Background (base) color
 * @returns {object} { ratio, isDarkOnLight, status, rating, message }
 */
export function checkQRContrast(darkHex, lightHex) {
  const [r1, g1, b1] = hexToRgb(darkHex);
  const [r2, g2, b2] = hexToRgb(lightHex);

  const l1 = getRelativeLuminance(r1, g1, b1); // foreground
  const l2 = getRelativeLuminance(r2, g2, b2); // background

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);

  const isDarkOnLight = l1 < l2;

  // Evaluate scanning safety
  if (!isDarkOnLight) {
    return {
      ratio: Number(ratio.toFixed(1)),
      isDarkOnLight: false,
      status: "inverted",
      rating: "Inverted (Risky)",
      colorClass: "text-amber-600 bg-amber-50 border-amber-200",
      message:
        "Warning: Foreground is lighter than base. Many hardware and built-in camera scanners fail on inverted QR codes.",
    };
  }

  if (ratio >= 7.0) {
    return {
      ratio: Number(ratio.toFixed(1)),
      isDarkOnLight: true,
      status: "excellent",
      rating: "Optimal Scanning (100% Verified)",
      colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
      message: "High contrast ensures fast, reliable scanning in low light and all cameras.",
    };
  }

  if (ratio >= 4.0) {
    return {
      ratio: Number(ratio.toFixed(1)),
      isDarkOnLight: true,
      status: "good",
      rating: "Moderate Contrast (Good)",
      colorClass: "text-blue-700 bg-blue-50 border-blue-200",
      message: "Scannable on modern smartphones, but higher contrast is recommended for dim lighting.",
    };
  }

  return {
    ratio: Number(ratio.toFixed(1)),
    isDarkOnLight: true,
    status: "poor",
    rating: "Low Contrast (Scanning Issues Likely)",
    colorClass: "text-rose-700 bg-rose-50 border-rose-200",
    message: "Camera sensors may not distinguish QR modules from the base color. Please darken the QR or lighten the base.",
  };
}
