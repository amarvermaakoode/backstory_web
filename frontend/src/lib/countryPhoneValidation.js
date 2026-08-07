export const COUNTRIES = [
    { code: "IN", name: "India", dialCode: "+91", minLength: 10, maxLength: 10, pattern: /^[6-9]\d{9}$/, placeholder: "98765 43210", error: "Please enter a valid 10-digit mobile number for India (starting with 6, 7, 8, or 9)." },
    { code: "US", name: "United States", dialCode: "+1", minLength: 10, maxLength: 10, pattern: /^\d{10}$/, placeholder: "555 000 0000", error: "Please enter a valid 10-digit phone number for United States." },
    { code: "GB", name: "United Kingdom", dialCode: "+44", minLength: 10, maxLength: 11, pattern: /^\d{10,11}$/, placeholder: "7911 123456", error: "Please enter a valid 10-11 digit phone number for United Kingdom." },
    { code: "CA", name: "Canada", dialCode: "+1", minLength: 10, maxLength: 10, pattern: /^\d{10}$/, placeholder: "555 000 0000", error: "Please enter a valid 10-digit phone number for Canada." },
    { code: "AU", name: "Australia", dialCode: "+61", minLength: 9, maxLength: 10, pattern: /^\d{9,10}$/, placeholder: "412 345 678", error: "Please enter a valid 9-10 digit phone number for Australia." },
    { code: "AE", name: "United Arab Emirates", dialCode: "+971", minLength: 9, maxLength: 9, pattern: /^\d{9}$/, placeholder: "50 123 4567", error: "Please enter a valid 9-digit phone number for UAE." },
    { code: "SG", name: "Singapore", dialCode: "+65", minLength: 8, maxLength: 8, pattern: /^\d{8}$/, placeholder: "8123 4567", error: "Please enter a valid 8-digit phone number for Singapore." },
    { code: "DE", name: "Germany", dialCode: "+49", minLength: 10, maxLength: 11, pattern: /^\d{10,11}$/, placeholder: "151 12345678", error: "Please enter a valid 10-11 digit phone number for Germany." },
    { code: "FR", name: "France", dialCode: "+33", minLength: 9, maxLength: 9, pattern: /^\d{9}$/, placeholder: "6 12 34 56 78", error: "Please enter a valid 9-digit phone number for France." },
    { code: "OTHER", name: "Other", dialCode: "", minLength: 7, maxLength: 15, pattern: /^\d{7,15}$/, placeholder: "Phone number", error: "Please enter a valid phone number (7-15 digits)." },
];

export function getCountryByNameOrCode(nameOrCode = "India") {
    if (!nameOrCode) return COUNTRIES[0];
    const search = String(nameOrCode).trim().toLowerCase();
    return COUNTRIES.find(c => c.name.toLowerCase() === search || c.code.toLowerCase() === search) || COUNTRIES[0];
}

export function validatePhoneNumber(phone, countryNameOrCode = "India") {
    const country = getCountryByNameOrCode(countryNameOrCode);
    const cleanDigits = String(phone || "").replace(/\D/g, "");

    if (!cleanDigits) {
        return { isValid: false, error: "Phone number is required.", cleanPhone: "" };
    }

    if (cleanDigits.length < country.minLength || cleanDigits.length > country.maxLength) {
        return { isValid: false, error: country.error, cleanPhone: cleanDigits };
    }

    if (country.pattern && !country.pattern.test(cleanDigits)) {
        return { isValid: false, error: country.error, cleanPhone: cleanDigits };
    }

    return { isValid: true, error: "", cleanPhone: cleanDigits };
}
