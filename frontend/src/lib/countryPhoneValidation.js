import { countries } from "countries-list";
import { isValidPhoneNumber, getCountryCallingCode, getExampleNumber } from "libphonenumber-js";
import examples from "libphonenumber-js/mobile/examples";

/**
 * Country-specific maximum postal code lengths for fast, bundler-safe resolution.
 */
const COUNTRY_POSTAL_MAX_LENGTHS = {
    US: 10, // 12345-6789
    CA: 7,  // K1A 0B1
    GB: 8,  // SW1A 1AA
    IN: 6,  // 110001
    AU: 4,  // 2000
    NZ: 4,  // 6011
    DE: 5,  // 10115
    FR: 5,  // 75001
    IT: 5,  // 00100
    ES: 5,  // 28001
    NL: 7,  // 1012 JS
    BE: 4,  // 1000
    BR: 9,  // 01000-000
    JP: 8,  // 100-0001
    CN: 6,  // 100000
    RU: 6,  // 101000
    KR: 5,  // 03187
    SG: 6,  // 049318
    MY: 5,  // 50000
    TH: 5,  // 10100
    ID: 5,  // 10110
    PH: 4,  // 1000
    VN: 6,  // 100000
    SA: 10, // 12211-3388
    AE: 10,
    ZA: 4,  // 0001
    MX: 5,  // 01000
    AR: 8,  // C1024CWN
    CL: 7,  // 8320000
    CO: 6,  // 110111
    PL: 6,  // 00-001
    SE: 6,  // 111 22
    NO: 4,  // 0010
    FI: 5,  // 00100
    DK: 4,  // 1000
    AT: 4,  // 1010
    CH: 4,  // 8000
    CZ: 6,  // 110 00
    SK: 6,  // 811 01
    HU: 4,  // 1011
    RO: 6,  // 010011
    BG: 4,  // 1000
    GR: 6,  // 104 31
    PT: 8,  // 1000-001
    IE: 7,  // D02 X285
    IL: 7,  // 9100000
    TR: 5,  // 34000
    UA: 5,  // 01001
};

/**
 * Country-specific postal code validation regex patterns.
 */
const COUNTRY_POSTAL_PATTERNS = {
    IN: /^\d{6}$/,
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/,
    GB: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/,
    AU: /^\d{4}$/,
    NZ: /^\d{4}$/,
    DE: /^\d{5}$/,
    FR: /^\d{5}$/,
    IT: /^\d{5}$/,
    ES: /^\d{5}$/,
    NL: /^\d{4}\s?[A-Za-z]{2}$/,
    BE: /^\d{4}$/,
    BR: /^\d{5}-?\d{3}$/,
    JP: /^\d{3}-?\d{4}$/,
    CN: /^\d{6}$/,
    RU: /^\d{6}$/,
    KR: /^\d{5}$/,
    SG: /^\d{6}$/,
    MY: /^\d{5}$/,
    TH: /^\d{5}$/,
    ID: /^\d{5}$/,
    PH: /^\d{4}$/,
    VN: /^\d{6}$/,
    MX: /^\d{5}$/,
    PL: /^\d{2}-?\d{3}$/,
    SE: /^\d{3}\s?\d{2}$/,
    NO: /^\d{4}$/,
    FI: /^\d{5}$/,
    DK: /^\d{4}$/,
    AT: /^\d{4}$/,
    CH: /^\d{4}$/,
    PT: /^\d{4}-?\d{3}$/,
    IE: /^[A-Za-z0-9]{3}\s?[A-Za-z0-9]{4}$/,
    IL: /^\d{7}$/,
    TR: /^\d{5}$/,
    UA: /^\d{5}$/,
    SA: /^\d{5}(-\d{4})?$/,
};

/**
 * Dynamically derives national phone number max length for any ISO country code using `libphonenumber-js`.
 */
export function getPhoneMaxLength(code) {
    if (!code) return 15;
    try {
        const example = getExampleNumber(code, examples);
        if (example && example.nationalNumber) {
            return example.nationalNumber.length;
        }
    } catch (e) {}
    return 15;
}

/**
 * Dynamically derives maximum postal code length for any ISO country code.
 */
export function getPostalMaxLength(code) {
    if (!code) return 10;
    const upper = String(code).trim().toUpperCase();
    return COUNTRY_POSTAL_MAX_LENGTHS[upper] || 10;
}

/**
 * Dynamic registry of all ISO 3166-1 alpha-2 countries.
 * Dialing prefixes and length metadata derived dynamically from `libphonenumber-js`.
 */
export const ALL_COUNTRIES = Object.entries(countries)
    .map(([code, c]) => {
        let dialCode = "";
        try {
            dialCode = `+${getCountryCallingCode(code)}`;
        } catch (e) {
            const primaryPhone = Array.isArray(c.phone) ? c.phone[0] : c.phone;
            dialCode = primaryPhone ? `+${primaryPhone}` : "";
        }

        return {
            code, // ISO 3166-1 alpha-2 code (e.g. "IN", "US", "GB")
            name: c.name,
            dialCode,
            phoneMaxLength: getPhoneMaxLength(code),
            postalMaxLength: getPostalMaxLength(code),
        };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

export const COUNTRIES = ALL_COUNTRIES;

/**
 * Centralized Country Normalizer.
 * Accepts ISO code ("IN", "US") or Country Name ("India", "United States").
 * Returns normalized country object or null if unresolvable.
 */
export function getCountry(nameOrCode) {
    if (!nameOrCode) return null;
    const str = String(nameOrCode).trim();

    // Match by ISO Alpha-2 code
    const byCode = ALL_COUNTRIES.find((c) => c.code.toUpperCase() === str.toUpperCase());
    if (byCode) return byCode;

    // Match by Country Name
    const byName = ALL_COUNTRIES.find((c) => c.name.toLowerCase() === str.toLowerCase());
    if (byName) return byName;

    return null;
}

export function getCountryByNameOrCode(nameOrCode) {
    const c = getCountry(nameOrCode);
    if (c) return c;
    const fallback = ALL_COUNTRIES[0];
    return {
        ...fallback,
        phoneMaxLength: getPhoneMaxLength(fallback.code),
        postalMaxLength: getPostalMaxLength(fallback.code),
    };
}

export function getCountryCode(nameOrCode) {
    const c = getCountry(nameOrCode);
    return c ? c.code : "";
}

export function getCountryName(codeOrName) {
    const c = getCountry(codeOrName);
    return c ? c.name : "";
}

export function getDialCode(countryCodeOrName) {
    const c = getCountry(countryCodeOrName);
    return c ? c.dialCode : "";
}

/**
 * Authoritative Phone Validation using `libphonenumber-js`.
 * Dynamically enforces exact country-specific maximum digit length.
 */
export function validatePhoneNumber(phone, countryCodeOrName) {
    const country = getCountry(countryCodeOrName);
    if (!country) {
        return { isValid: false, error: "Country selection is required.", cleanPhone: "" };
    }

    const maxLen = getPhoneMaxLength(country.code);
    const cleanPhone = String(phone || "").trim();
    const cleanDigits = cleanPhone.replace(/\D/g, "").slice(0, maxLen);

    if (!cleanDigits) {
        return { isValid: false, error: "Mobile number is required.", cleanPhone: "" };
    }

    if (cleanDigits.length > maxLen) {
        return { isValid: false, error: "Enter a valid mobile number.", cleanPhone: cleanDigits };
    }

    try {
        const fullNumber = `+${country.dialCode.replace("+", "")}${cleanDigits}`;
        const isValid = isValidPhoneNumber(cleanPhone, country.code) || isValidPhoneNumber(fullNumber, country.code);

        if (isValid) {
            return { isValid: true, error: "", cleanPhone: cleanDigits };
        }
    } catch (e) {
        // Handled cleanly
    }

    return { isValid: false, error: "Enter a valid mobile number.", cleanPhone: cleanDigits };
}

/**
 * Dynamic Postal Rule Generator.
 * Dynamically resolves postal maximum length per ISO country code.
 */
export function getPostalRule(countryCodeOrName) {
    const country = getCountry(countryCodeOrName);
    const code = country ? country.code : "";
    const maxLen = getPostalMaxLength(code);

    return {
        countryCode: code,
        countryName: country ? country.name : "",
        isRequired: true,
        label: "Postal Code*",
        placeholder: "Postal Code*",
        maxLength: maxLen,
        error: "Enter a valid postal code.",
    };
}

/**
 * Dynamic Postal Code Validator.
 * Validates postal code formats for any ISO country.
 */
export function validatePostalCodeFormat(postalCode, countryCodeOrName) {
    const country = getCountry(countryCodeOrName);
    if (!country) {
        return { isValid: false, error: "Country selection is required.", cleanPin: "" };
    }

    const maxLen = getPostalMaxLength(country.code);
    const cleanStr = String(postalCode || "").trim().slice(0, maxLen);

    if (!cleanStr) {
        return { isValid: false, error: "Postal code is required.", cleanPin: "" };
    }

    const pattern = COUNTRY_POSTAL_PATTERNS[country.code.toUpperCase()];
    if (pattern) {
        if (pattern.test(cleanStr)) {
            return { isValid: true, error: "", cleanPin: cleanStr };
        } else {
            return { isValid: false, error: "Enter a valid postal code.", cleanPin: cleanStr };
        }
    }

    // Generic fallback for countries without explicit custom regex:
    const genericPattern = /^[a-zA-Z0-9\s-]{2,10}$/;
    if (genericPattern.test(cleanStr)) {
        return { isValid: true, error: "", cleanPin: cleanStr };
    }

    return { isValid: false, error: "Enter a valid postal code.", cleanPin: cleanStr };
}

export function validatePostalCode(postalCode, countryCodeOrName) {
    return validatePostalCodeFormat(postalCode, countryCodeOrName);
}

const postalCodeCache = new Map();

export async function verifyPostalCode({ countryCode, postalCode }) {
    const country = getCountry(countryCode);
    if (!country) {
        return { isValid: false, error: "Country selection is required." };
    }

    const maxLen = getPostalMaxLength(country.code);
    const cleanStr = String(postalCode || "").trim().slice(0, maxLen);
    const formatCheck = validatePostalCodeFormat(cleanStr, country.code);
    if (!formatCheck.isValid) {
        return formatCheck;
    }

    const cacheKey = `${country.code}:${cleanStr}`;
    if (postalCodeCache.has(cacheKey)) {
        return postalCodeCache.get(cacheKey);
    }

    try {
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
                const result = { isValid: false, error: "Enter a valid postal code." };
                postalCodeCache.set(cacheKey, result);
                return result;
            }
        }
    } catch (err) {
        return { isValid: true, error: "" };
    }

    return { isValid: true, error: "" };
}

/**
 * Dynamic location (City/State) lookup using OpenStreetMap Nominatim for any ISO country code.
 */
export async function fetchPostalCodeDetails(countryCode, postalCode) {
    const country = getCountry(countryCode);
    if (!country || !postalCode) return null;
    const maxLen = getPostalMaxLength(country.code);
    const cleanPin = String(postalCode).trim().slice(0, maxLen);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(cleanPin)}&countrycodes=${encodeURIComponent(country.code.toLowerCase())}&format=json&addressdetails=1`,
            {
                headers: { "Accept": "application/json" },
                signal: controller.signal,
            }
        );
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0 && data[0]?.address) {
                const addr = data[0].address;
                const rawCity = addr.city || addr.town || addr.village || addr.municipality || addr.state_district || addr.county || "";
                const state = addr.state || "";

                const cleanCity = rawCity
                    .replace(/\s+Corporation$/i, "")
                    .replace(/\s+District$/i, "")
                    .replace(/\s+Rural$/i, "")
                    .trim();

                if (cleanCity || state) {
                    return { city: cleanCity, state };
                }
            }
        }
    } catch (e) {
        // Silent catch
    }

    return null;
}

export function fetchIndiaPincodeDetails(pin) {
    return fetchPostalCodeDetails("IN", pin);
}
