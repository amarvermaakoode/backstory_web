"use client";

import React from "react";
import Image from "next/image";

export default function Footer() {
    const brandLinks = [
        { name: "About", href: "#about" },
        { name: "Mission", href: "#mission" },
        { name: "Stories", href: "#stories" },
    ];

    const shopLinks = [
        { name: "Shop All", href: "#shop" },
        { name: "New Arrivals", href: "#new-arrivals" },
        { name: "Collection", href: "#collection" },
        { name: "Tribes", href: "#tribes" },
    ];

    const supportLinks = [
        { name: "Customer Support", href: "#support" },
        { name: "Track Order", href: "#track-order" },
        { name: "Return & Exchange", href: "#returns" },
        { name: "FAQs", href: "#faqs" },
    ];

    const identityLinks = [
        { name: "How It Works", href: "#how-it-works" },
        { name: "Profiles", href: "#profiles" },
        { name: "Community", href: "#community" },
    ];

    return (
        <footer className="w-full bg-[#101820] text-white pt-20 pb-0 px-6 sm:px-10 md:px-16 lg:px-[7%] select-none overflow-hidden">
            <div className="mx-auto max-w-[1600px] space-y-16">

                {/* Top Section */}
                <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-8">
                    {/* Left Column (Brand Slogan & Socials) */}
                    <div className="flex flex-col justify-between max-w-sm space-y-8">
                        <div className="space-y-6">
                            <h2 className="font-geist text-2xl md:text-3xl font-medium leading-snug tracking-wide">
                                Every person has a story worth wearing.
                            </h2>
                            {/* Social Icons */}
                            <div className="flex items-center gap-4 text-white/80">
                                <a href="#instagram" className="hover:text-white transition-colors cursor-pointer" aria-label="Instagram">
                                    <svg className="h-6 w-6 stroke-[1.5] stroke-current fill-none" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                    </svg>
                                </a>
                                <a href="#linkedin" className="hover:text-white transition-colors cursor-pointer" aria-label="LinkedIn">
                                    <svg className="h-6 w-6 stroke-[1.5] stroke-current fill-none" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                                        <rect x="2" y="9" width="4" height="12" />
                                        <circle cx="4" cy="4" r="2" />
                                    </svg>
                                </a>
                                <a href="#twitter" className="hover:text-white transition-colors cursor-pointer" aria-label="X (Twitter)">
                                    {/* Custom SVG for X Logo */}
                                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* Copyright Details */}
                        <div className="text-[11px] md:text-xs text-neutral-400 space-y-1 font-sans">
                            <p>© 2026 Backstory</p>
                            <p className="space-x-1.5">
                                <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
                                <span>•</span>
                                <a href="#terms" className="hover:text-white transition-colors">Terms & Conditions</a>
                            </p>
                        </div>
                    </div>

                    {/* Right Columns (Nav Menus) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 lg:gap-12 xl:gap-16">
                        {/* Brand Column */}
                        <div className="space-y-4">
                            <h3 className="font-clashDisplay text-base md:text-lg font-semibold tracking-wide">Brand</h3>
                            <ul className="space-y-2.5">
                                {brandLinks.map((link) => (
                                    <li key={link.name}>
                                        <a href={link.href} className="text-neutral-400 hover:text-white transition-colors duration-200 text-sm font-sans font-light">
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Shop Column */}
                        <div className="space-y-4">
                            <h3 className="font-clashDisplay text-base md:text-lg font-semibold tracking-wide">Shop</h3>
                            <ul className="space-y-2.5">
                                {shopLinks.map((link) => (
                                    <li key={link.name}>
                                        <a href={link.href} className="text-neutral-400 hover:text-white transition-colors duration-200 text-sm font-sans font-light">
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Support Column */}
                        <div className="space-y-4">
                            <h3 className="font-clashDisplay text-base md:text-lg font-semibold tracking-wide">Support</h3>
                            <ul className="space-y-2.5">
                                {supportLinks.map((link) => (
                                    <li key={link.name}>
                                        <a href={link.href} className="text-neutral-400 hover:text-white transition-colors duration-200 text-sm font-sans font-light">
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Identity Column */}
                        <div className="space-y-4">
                            <h3 className="font-clashDisplay text-base md:text-lg font-semibold tracking-wide">Identity</h3>
                            <ul className="space-y-2.5">
                                {identityLinks.map((link) => (
                                    <li key={link.name}>
                                        <a href={link.href} className="text-neutral-400 hover:text-white transition-colors duration-200 text-sm font-sans font-light">
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Watermark Logo */}
                <div className="pt-8 border-t border-white/5 flex justify-center w-full">
                    <Image
                        src="/images/landing-page/footer.png"
                        alt="bacstory"
                        width={1920}
                        height={450}
                        className="w-full h-auto select-none"
                        priority
                    />
                </div>

            </div>
        </footer>
    );
}
