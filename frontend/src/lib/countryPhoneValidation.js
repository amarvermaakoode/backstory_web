import { countries } from "countries-list";
import { isValidPhoneNumber, getCountryCallingCode, getExampleNumber } from "libphonenumber-js";
import examples from "libphonenumber-js/mobile/examples";
import PostalCodes from "postal-codes-js";

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
 * Dynamically derives maximum postal code length for any ISO country code using `postal-codes-js`.
 */
export function getPostalMaxLength(code) {
    if (!code) return 12;
    for (let l = 12; l >= 1; l--) {
        const testNumeric = "1".repeat(l);
        if (PostalCodes.validate(code, testNumeric) === true) {
            return l;
        }
    }
    if (PostalCodes.validate(code, "SW1A 1AA") === true) return 8;
    if (PostalCodes.validate(code, "K1A 0B1") === true) return 7;
    return 12;
}

/**
 * Dynamic registry of all ISO 3166-1 alpha-2 countries.
 * Dialing prefixes and length metadata derived dynamically from `libphonenumber-js` & `postal-codes-js`.
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
 * Dynamic Postal Code Validator powered by `postal-codes-js`.
 * Validates postal code formats for any ISO country dynamically.
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

    // Authoritative country-specific validation via postal-codes-js library
    const result = PostalCodes.validate(country.code, cleanStr);

    if (result === true) {
        return { isValid: true, error: "", cleanPin: cleanStr };
    }

    const errorMsg = typeof result === "string" ? result : "Enter a valid postal code.";
    return { isValid: false, error: errorMsg, cleanPin: cleanStr };
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
