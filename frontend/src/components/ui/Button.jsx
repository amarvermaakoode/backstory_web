"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Button({
    text,
    children,
    href,
    onClick,
    hasArrow = false,
    variant = "primary", // primary, outline, dark
    type = "button",
    className = "",
    ...props
}) {
    const content = text || children;

    // Styles configurations
    let baseStyles = "group inline-flex items-center justify-center rounded-full font-bold transition-all duration-300 cursor-pointer w-fit select-none";
    let variantStyles = "";
    let paddingStyles = "";

    if (variant === "primary") {
        variantStyles = "bg-white text-black hover:bg-neutral-200 shadow-lg shadow-white/5 border border-transparent text-xs md:text-lg";
        // Specific padding from mockup when arrow is present
        paddingStyles = hasArrow
            ? "pl-2 pr-1.5 py-0.5 md:pl-4 md:pr-2 md:py-1"
            : "px-6 py-2.5";
    } else if (variant === "outline") {
        variantStyles = "border-2 border-black text-black hover:bg-black hover:text-white transition-colors text-sm md:text-lg";
        paddingStyles = hasArrow
            ? "pl-5 pr-2 py-2 md:pl-6 md:pr-3 md:py-2"
            : "px-5 py-1.5 md:px-4 md:py-1";
    } else if (variant === "outline-white") {
        variantStyles = "border border-white text-white hover:bg-white hover:text-black transition-colors text-xs md:text-[1.3vw]";
        paddingStyles = hasArrow
            ? "pl-5 pr-2 py-1 md:pl-6 md:pr-3 md:py-2"
            : "px-3 py-1 md:px-6 md:py-2";
    } else if (variant === "dark") {
        variantStyles = "bg-[#0F172A] hover:bg-black text-white text-sm tracking-wide shadow-md shadow-black/5";
        paddingStyles = hasArrow
            ? "pl-6 pr-4 py-3.5"
            : "px-6 py-3.5";
    }

    const arrowIcon = (
        <span className={`flex items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5
            ${variant === "primary" ? "w-5 h-5 md:w-8 md:h-8 bg-black text-white ml-2" : "ml-2"}
            ${variant === "outline-white" ? "w-5 h-5 bg-white text-black group-hover:bg-black group-hover:text-white" : ""}
            ${variant === "outline" ? "w-5 h-5 bg-black text-white group-hover:bg-white group-hover:text-black" : ""}
            ${variant === "dark" ? "w-4 h-4 text-white" : ""}
        `}>
            <ArrowRight className={`
                ${variant === "primary" ? "h-3.5 w-3.5 md:h-4 md:w-4" : "h-4 w-4"}
            `} />
        </span>
    );

    const buttonContent = (
        <>
            <span>{content}</span>
            {hasArrow && arrowIcon}
        </>
    );

    if (href) {
        if (href.startsWith("/")) {
            return (
                <Link href={href} className={`${baseStyles} ${variantStyles} ${paddingStyles} ${className}`} {...props}>
                    {buttonContent}
                </Link>
            );
        }
        return (
            <a href={href} className={`${baseStyles} ${variantStyles} ${paddingStyles} ${className}`} {...props}>
                {buttonContent}
            </a>
        );
    }

    return (
        <button
            type={type}
            onClick={onClick}
            className={`${baseStyles} ${variantStyles} ${paddingStyles} ${className}`}
            {...props}
        >
            {buttonContent}
        </button>
    );
}
