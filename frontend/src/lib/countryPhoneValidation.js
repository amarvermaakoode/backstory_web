import { countries } from "countries-list";
import { isValidPhoneNumber, getCountryCallingCode } from "libphonenumber-js";
import PostalCodes from "postal-codes-js";

// Countries that do not use or require postal/ZIP codes
const NO_POSTAL_CODE_COUNTRIES = new Set([
    "HK", // Hong Kong
    "MO", // Macao
    "AE", // United Arab Emirates
    "QA", // Qatar
    "KW", // Kuwait
    "BH", // Bahrain
    "OM", // Oman
    "MC", // Monaco
    "AW", // Aruba
    "AG", // Antigua and Barbuda
    "BS", // Bahamas
    "BZ", // Belize
    "BJ", // Benin
    "BW", // Botswana
    "BF", // Burkina Faso
    "BI", // Burundi
    "CM", // Cameroon
    "CF", // Central African Republic
    "KM", // Comoros
    "CG", // Congo
    "CD", // Congo (DRC)
    "DJ", // Djibouti
    "DM", // Dominica
    "GQ", // Equatorial Guinea
    "ER", // Eritrea
    "FJ", // Fiji
    "GA", // Gabon
    "GM", // Gambia
    "GH", // Ghana
    "GD", // Grenada
    "GN", // Guinea
    "GW", // Guinea-Bissau
    "GY", // Guyana
    "CI", // Ivory Coast
    "JM", // Jamaica
    "KI", // Kiribati
    "KP", // North Korea
    "LY", // Libya
    "MW", // Malawi
    "ML", // Mali
    "MR", // Mauritania
    "MU", // Mauritius
    "NR", // Nauru
    "NU", // Niue
    "RW", // Rwanda
    "KN", // Saint Kitts and Nevis
    "LC", // Saint Lucia
    "VC", // Saint Vincent and the Grenadines
    "WS", // Samoa
    "ST", // Sao Tome and Principe
    "SC", // Seychelles
    "SL", // Sierra Leone
    "SB", // Solomon Islands
    "SO", // Somalia
    "SS", // South Sudan
    "SR", // Suriname
    "SY", // Syria
    "TL", // Timor-Leste
    "TG", // Togo
    "TO", // Tonga
    "TT", // Trinidad and Tobago
    "TV", // Tuvalu
    "UG", // Uganda
    "VU", // Vanuatu
    "YE", // Yemen
    "ZW", // Zimbabwe
]);

// Department & Numerical postal code range boundaries for known countries
const POSTAL_RANGES = {
    // Honduras: 18 departments, valid postal codes range strictly between 11101 and 54203
    HN: { min: 11101, max: 54203 },
    // Guatemala: 22 departments, valid postal codes range between 01001 and 22000
    GT: { min: 1001, max: 22000 },
    // El Salvador: valid postal codes range between 1101 and 3401
    SV: { min: 1101, max: 3401 },
    // Nicaragua: valid postal codes range between 10000 and 52000
    NI: { min: 10000, max: 52000 },
    // Costa Rica: 7 provinces, 10101 to 70604
    CR: { min: 10101, max: 70604 },
    // Panama: 0801 to 1212
    PA: { min: 801, max: 1212 },
    // India: PIN codes range strictly from 110001 to 855999
    IN: { min: 110001, max: 855999 },
    // United States: 00501 to 99950
    US: { min: 501, max: 99950 },
};

// Custom phone validation rules for key countries
const PHONE_RULES = {
    IN: { minLength: 10, maxLength: 10, pattern: /^[6-9]\d{9}$/, placeholder: "98765 43210" },
    US: { minLength: 10, maxLength: 10, pattern: /^\d{10}$/, placeholder: "555 000 0000" },
    GB: { minLength: 10, maxLength: 11, pattern: /^\d{10,11}$/, placeholder: "7911 123456" },
    CA: { minLength: 10, maxLength: 10, pattern: /^\d{10}$/, placeholder: "555 000 0000" },
    AU: { minLength: 9, maxLength: 10, pattern: /^\d{9,10}$/, placeholder: "412 345 678" },
    HK: { minLength: 8, maxLength: 8, pattern: /^\d{8}$/, placeholder: "9123 4567" },
    AE: { minLength: 9, maxLength: 9, pattern: /^\d{9}$/, placeholder: "50 123 4567" },
    SG: { minLength: 8, maxLength: 8, pattern: /^\d{8}$/, placeholder: "8123 4567" },
    DE: { minLength: 10, maxLength: 11, pattern: /^\d{10,11}$/, placeholder: "151 12345678" },
    FR: { minLength: 9, maxLength: 9, pattern: /^\d{9}$/, placeholder: "6 12 34 56 78" },
    HN: { minLength: 8, maxLength: 8, pattern: /^\d{8}$/, placeholder: "9900 1234" },
};

// Custom postal/pin code validation rules per ISO country code
const POSTAL_RULES = {
    IN: { maxLength: 6, pattern: /^[1-9]\d{5}$/, placeholder: "Pin Code*", error: "Enter a valid PIN code.", isIndia: true },
    US: { maxLength: 10, pattern: /^\d{5}(-\d{4})?$/, placeholder: "ZIP Code*", error: "Enter a valid ZIP code.", isIndia: false },
    GB: { maxLength: 8, pattern: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i, placeholder: "Postcode*", error: "Enter a valid UK postcode.", isIndia: false },
    CA: { maxLength: 7, pattern: /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/, placeholder: "Postal Code*", error: "Enter a valid Canadian postal code.", isIndia: false },
    AU: { maxLength: 4, pattern: /^\d{4}$/, placeholder: "Postcode*", error: "Enter a valid 4-digit postcode.", isIndia: false },
    SG: { maxLength: 6, pattern: /^\d{6}$/, placeholder: "Postal Code*", error: "Enter a valid 6-digit postal code.", isIndia: false },
    DE: { maxLength: 5, pattern: /^\d{5}$/, placeholder: "PLZ*", error: "Enter a valid 5-digit PLZ.", isIndia: false },
    FR: { maxLength: 5, pattern: /^\d{5}$/, placeholder: "Code Postal*", error: "Enter a valid 5-digit postal code.", isIndia: false },
    GT: { maxLength: 5, pattern: /^\d{5}$/, placeholder: "Postal Code*", error: "Enter a valid 5-digit postal code.", isIndia: false },
    HN: { maxLength: 5, pattern: /^\d{5}$/, placeholder: "Postal Code*", error: "Enter a valid postal code.", isIndia: false },
};

// Build authoritative list of all ISO 3166-1 alpha-2 countries
export const ALL_COUNTRIES = Object.entries(countries)
    .map(([code, c]) => {
        let dialCode = "";
        try {
            dialCode = `+${getCountryCallingCode(code)}`;
        } catch (e) {
            const primaryPhone = Array.isArray(c.phone) ? c.phone[0] : c.phone;
            dialCode = primaryPhone ? `+${primaryPhone}` : "";
        }

        const customRules = PHONE_RULES[code] || {
            minLength: 7,
            maxLength: 15,
            pattern: /^\d{7,15}$/,
            placeholder: "Phone number",
        };

        return {
            code, // ISO 3166-1 alpha-2 code (e.g., "IN", "HK", "US")
            name: c.name,
            dialCode,
            postalCodeRequired: !NO_POSTAL_CODE_COUNTRIES.has(code),
            ...customRules,
        };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

export const COUNTRIES = ALL_COUNTRIES;

/**
 * Normalizes input (ISO code or country name) to a valid ISO 3166-1 alpha-2 country object.
 */
export function getCountryByNameOrCode(nameOrCode = "IN") {
    if (!nameOrCode) return ALL_COUNTRIES.find((c) => c.code === "IN") || ALL_COUNTRIES[0];
    const str = String(nameOrCode).trim();
    
    const byCode = ALL_COUNTRIES.find((c) => c.code.toUpperCase() === str.toUpperCase());
    if (byCode) return byCode;

    const byName = ALL_COUNTRIES.find((c) => c.name.toLowerCase() === str.toLowerCase());
    if (byName) return byName;

    return ALL_COUNTRIES.find((c) => c.code === "IN") || ALL_COUNTRIES[0];
}

export function getCountry(nameOrCode = "IN") {
    return getCountryByNameOrCode(nameOrCode);
}

export function getCountryCode(nameOrCode = "IN") {
    return getCountryByNameOrCode(nameOrCode).code;
}

export function getCountryName(codeOrName = "IN") {
    return getCountryByNameOrCode(codeOrName).name;
}

export function getDialCode(countryCodeOrName = "IN") {
    return getCountryByNameOrCode(countryCodeOrName).dialCode || "+91";
}

/**
 * Gets postal code / pin code rules for a specific country.
 */
export function getPostalRule(countryCodeOrName = "IN") {
    const country = getCountryByNameOrCode(countryCodeOrName);
    const code = country.code;
    const isRequired = !NO_POSTAL_CODE_COUNTRIES.has(code);

    let label = "Postal Code";
    if (code === "IN") label = "PIN Code";
    else if (code === "US") label = "ZIP Code";
    else if (code === "GB" || code === "CA" || code === "AU" || code === "NZ") label = "Postcode";

    const displayLabel = isRequired ? `${label}*` : `${label} (Optional)`;

    const rule = POSTAL_RULES[code] || {
        maxLength: isRequired ? 10 : 12,
        pattern: /^[A-Z0-9 -]{3,10}$/i,
        placeholder: displayLabel,
        error: `Enter a valid ${label.toLowerCase()}.`,
        isIndia: code === "IN",
    };

    return {
        ...rule,
        countryCode: code,
        countryName: country.name,
        isRequired,
        label: displayLabel,
        isIndia: code === "IN",
    };
}

// In-memory cache for live postal code verification results
const postalCodeCache = new Map();

/**
 * Synchronous format-only postal code check (Layer 1 + Layer 2 + Layer 3).
 */
export function validatePostalCodeFormat(postalCode, countryCodeOrName = "IN") {
    const country = getCountryByNameOrCode(countryCodeOrName);
    const rule = getPostalRule(country.code);
    const cleanStr = String(postalCode || "").trim();

    if (!rule.isRequired && !cleanStr) {
        return { isValid: true, error: "", cleanPin: "" };
    }

    if (rule.isRequired && !cleanStr) {
        const errorMsg = rule.countryCode === "IN" ? "PIN code is required." : "Postal code is required.";
        return { isValid: false, error: errorMsg, cleanPin: "" };
    }

    // Format regex check
    if (rule.pattern && !rule.pattern.test(cleanStr)) {
        return { isValid: false, error: rule.error, cleanPin: cleanStr };
    }

    // Range / Department check for numerical postal codes
    const range = POSTAL_RANGES[country.code];
    if (range && /^\d+$/.test(cleanStr)) {
        const num = parseInt(cleanStr, 10);
        if (isNaN(num) || num < range.min || num > range.max) {
            return {
                isValid: false,
                error: `Enter a valid ${rule.countryCode === "IN" ? "PIN code" : "postal code"}.`,
                cleanPin: cleanStr,
            };
        }
    }

    return { isValid: true, error: "", cleanPin: cleanStr };
}

/**
 * Multi-layered postal code recognition & existence verification (Layer 1 -> 4).
 * Evaluates countryCode + postalCode together asynchronously.
 */
export async function verifyPostalCode({ countryCode, postalCode }) {
    const country = getCountryByNameOrCode(countryCode);
    const rule = getPostalRule(country.code);
    const cleanStr = String(postalCode || "").trim();

    // Layers 1, 2, & 3 check
    const formatCheck = validatePostalCodeFormat(cleanStr, country.code);
    if (!formatCheck.isValid) {
        return formatCheck;
    }

    // If country doesn't require postal code and empty
    if (!rule.isRequired && !cleanStr) {
        return { isValid: true, error: "" };
    }

    const cacheKey = `${country.code}:${cleanStr}`;
    if (postalCodeCache.has(cacheKey)) {
        return postalCodeCache.get(cacheKey);
    }

    // Layer 4: Live Postal Code Recognition Service
    try {
        // Query OpenStreetMap Nominatim API for exact { countryCode, postalCode }
        const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(cleanStr)}&countrycodes=${encodeURIComponent(country.code.toLowerCase())}&format=json`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(url, {
            headers: { "Accept": "application/json" },
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                const result = { isValid: true, error: "", locationName: data[0].display_name };
                postalCodeCache.set(cacheKey, result);
                return result;
            } else {
                // Postal code not recognized for this country
                const result = {
                    isValid: false,
                    error: `Enter a valid ${rule.countryCode === "IN" ? "PIN code" : "postal code"}.`,
                };
                postalCodeCache.set(cacheKey, result);
                return result;
            }
        }
    } catch (err) {
        console.warn("Postal code recognition service unavailable, falling back to format rules:", err);
        // Fallback safely on network error/timeout without blocking valid formats
        return { isValid: true, error: "" };
    }

    return { isValid: true, error: "" };
}

/**
 * Backward compatible helper alias.
 */
export function validatePostalCode(postalCode, countryCodeOrName = "IN") {
    return validatePostalCodeFormat(postalCode, countryCodeOrName);
}

/**
 * Validates a mobile number according to country rules using libphonenumber-js.
 */
export function validatePhoneNumber(phone, countryNameOrCode = "IN") {
    const country = getCountryByNameOrCode(countryNameOrCode);
    const cleanPhone = String(phone || "").trim();
    const cleanDigits = cleanPhone.replace(/\D/g, "");

    if (!cleanDigits) {
        return { isValid: false, error: "Mobile number is required.", cleanPhone: "" };
    }

    try {
        const fullNumber = `+${country.dialCode.replace("+", "")}${cleanDigits}`;
        const isValid = isValidPhoneNumber(cleanPhone, country.code) || isValidPhoneNumber(fullNumber, country.code);
        if (isValid) {
            return { isValid: true, error: "", cleanPhone: cleanDigits };
        }
    } catch (e) {
        // Fallback
    }

    if (cleanDigits.length < country.minLength || cleanDigits.length > country.maxLength) {
        return { isValid: false, error: "Enter a valid mobile number.", cleanPhone: cleanDigits };
    }

    if (country.pattern && !country.pattern.test(cleanDigits)) {
        return { isValid: false, error: "Enter a valid mobile number.", cleanPhone: cleanDigits };
    }

    return { isValid: true, error: "", cleanPhone: cleanDigits };
}
