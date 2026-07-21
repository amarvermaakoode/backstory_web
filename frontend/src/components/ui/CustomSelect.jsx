"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";

/**
 * CustomSelect - Reusable custom dropdown component matching exact text field styles
 * 
 * @param {Array} options - Array of { value: string|number, label: string } or strings
 * @param {any} value - Currently selected value
 * @param {Function} onChange - Callback triggered on selection change: onChange(value) or onChange({ target: { value } })
 * @param {string} placeholder - Placeholder text when no value is selected
 * @param {boolean} disabled - Whether the dropdown is disabled
 * @param {string} className - Optional additional classes for the trigger
 * @param {boolean} required - Whether selection is required
 */
export default function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select Option",
  disabled = false,
  className = "",
  required = false,
  name
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Normalize options array into [{ value, label }]
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "object" && opt !== null) {
      return {
        value: opt.value !== undefined ? opt.value : opt._id || opt.id || "",
        label: opt.label !== undefined ? opt.label : opt.name || opt.title || opt.Name || String(opt.value || "")
      };
    }
    return { value: opt, label: String(opt) };
  });

  // Find selected option object
  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value) && String(opt.value) !== ""
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optionValue) => {
    if (disabled) return;
    if (onChange) {
      // Support both standard value callback and synthetic event
      onChange({ target: { value: optionValue, name } });
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full select-none">
      {/* Hidden Native Select for HTML Form Validation if required */}
      {required && (
        <select
          tabIndex={-1}
          name={name}
          value={value || ""}
          required={required}
          onChange={() => {}}
          className="sr-only absolute inset-0 opacity-0 pointer-events-none"
        >
          <option value="">{placeholder}</option>

          {normalizedOptions.map((opt, i) => (
            <option key={i} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {/* Dropdown Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-neutral-50 text-neutral-900 border border-neutral-200 rounded-xl py-3 px-4 outline-none text-sm font-semibold transition-all duration-200 flex items-center justify-between cursor-pointer ${
          isOpen
            ? "border-[#a39889] ring-1 ring-[#dfd7cc]/50 bg-white shadow-xs"
            : "hover:border-neutral-300 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50"
        } ${disabled ? "opacity-50 cursor-not-allowed bg-neutral-100" : ""} ${className}`}
      >
        <span
          className={`truncate ${
            selectedOption ? "text-neutral-900 font-semibold" : "text-neutral-400 font-normal"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 shrink-0 ml-2 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-neutral-800" : ""
          }`}
        />
      </button>

      {/* Options Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-neutral-200 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-150">
          {placeholder && (
            <button
              type="button"
              onClick={() => handleSelect("")}
              className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:bg-neutral-50 transition-colors flex items-center justify-between cursor-pointer border-b border-neutral-100`}
            >
              <span>{placeholder}</span>
            </button>
          )}

          {normalizedOptions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-neutral-400 font-medium text-center">
              No options available
            </div>
          ) : (
            normalizedOptions.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value) && String(opt.value) !== "";
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-[#FAF6F0] text-black font-bold"
                      : "text-neutral-700 hover:bg-neutral-50 hover:text-black"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-black shrink-0 ml-2" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
