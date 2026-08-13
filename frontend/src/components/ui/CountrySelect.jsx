"use client";

import { useMemo } from "react";
import { ALL_COUNTRIES, getCountryByNameOrCode } from "@/lib/countryPhoneValidation";

/**
 * Reusable ISO 3166-1 Alpha-2 Country Select Component
 * 
 * - Displays official country names to users.
 * - Uses 2-letter ISO 3166-1 alpha-2 codes (e.g. "IN", "US", "GB") as values.
 * - Works natively on mobile and desktop with accessible keyboard navigation.
 */
export default function CountrySelect({
    value = "IN",
    onChange,
    name = "country",
    id,
    label,
    className = "",
    disabled = false,
    required = false,
}) {
    // Normalize incoming value (whether code "IN" or name "India") to ISO alpha-2 code
    const selectedIsoCode = useMemo(() => {
        return getCountryByNameOrCode(value).code;
    }, [value]);

    const handleChange = (e) => {
        const selectedCode = e.target.value;
        if (onChange) {
            // Support both standard event object and direct value callback
            onChange(e);
        }
    };

    const inputId = id || `country-select-${name}`;

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-[10px] sm:text-xs font-bold text-neutral-400 tracking-wider mb-1.5 block uppercase"
                >
                    {label}
                </label>
            )}
            <div className="relative w-full">
                <select
                    id={inputId}
                    name={name}
                    value={selectedIsoCode}
                    onChange={handleChange}
                    disabled={disabled}
                    required={required}
                    className={`w-full h-11 sm:h-12 border border-neutral-200 rounded-xl px-4 text-sm font-semibold transition-colors bg-white text-neutral-900 focus:outline-none focus:border-black cursor-pointer appearance-none ${className}`}
                >
                    {ALL_COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                            {c.name}
                        </option>
                    ))}
                </select>
                {/* Subtle custom dropdown arrow icon */}
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
