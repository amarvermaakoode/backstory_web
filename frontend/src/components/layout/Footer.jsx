"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";

export default function Footer() {
    const brandLinks = [
        { name: "About", href: "/about-us" },
        { name: "Mission", href: "/about-us#philosophy" },
        { name: "Stories", href: "/about-us" },
    ];

    const shopLinks = [
        { name: "New Arrivals", href: "/product-list" },
        { name: "Tribes", href: "/product-list/tribe/all" },
    ];

    const supportLinks = [
        { name: "Customer Support", href: "/account/support" },
        { name: "Track Order", href: "#" },
        { name: "Return & Exchange", href: "/return-and-exchange" },
        { name: "FAQs", href: "/faq" },
    ];

    const identityLinks = [
        { name: "How It Works", href: "#" },
        { name: "Profiles", href: "#" },
        { name: "Community", href: "#" },
    ];

    return (
        <footer className="w-full bg-[#101820] text-white pt-20 pb-0 px-6 sm:px-10 md:px-12 overflow-hidden">
            <div className="mx-auto max-w-[1600px] space-y-16">

                {/* Top Section */}
                <div className="flex flex-col md:flex-row justify-between gap-12 lg:gap-8">
                    {/* Left Column (Brand Slogan & Socials) */}
                    <div className="flex flex-col justify-between md:max-w-[42%] max-w-[100%] space-y-8">
                        <div className="space-y-6">
                            <h2 className="font-sans text-2xl md:text-[2.5vw] font-medium leading-tight tracking-tight">
                                Every person has a story worth wearing.
                            </h2>
                            {/* Social Icons */}
                            <div className="flex items-center gap-4">
                                <a href="#instagram" className="hover:opacity-80 transition-opacity cursor-pointer" aria-label="Instagram">
                                    <Image
                                        src="/images/landing-page/instagram.svg"
                                        alt="Instagram"
                                        width={24}
                                        height={24}
                                        className="h-6 w-6 object-contain"
                                    />
                                </a>
                                <a href="#linkedin" className="hover:opacity-80 transition-opacity cursor-pointer" aria-label="LinkedIn">
                                    <Image
                                        src="/images/landing-page/linkedin.svg"
                                        alt="LinkedIn"
                                        width={24}
                                        height={24}
                                        className="h-6 w-6 object-contain"
                                    />
                                </a>
                                <a href="#twitter" className="hover:opacity-80 transition-opacity cursor-pointer" aria-label="X (Twitter)">
                                    <Image
                                        src="/images/landing-page/twitter.svg"
                                        alt="Twitter"
                                        width={24}
                                        height={24}
                                        className="h-6 w-6 object-contain"
                                    />
                                </a>
                            </div>
                        </div>

                        {/* Copyright Details */}
                        <div className="flex items-end gap-8 sm:gap-14 text-sm md:text-base text-white font-sans">
                            <a
                                href="https://www.akoode.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Akoode Technology - AI & Software Company"
                                className="relative inline-flex items-center gap-1 group hover:text-white transition-colors shrink-0 font-light text-white"
                            >
                                <span>Made with</span>
                                <Heart className="text-white fill-white w-3.5 h-3.5" />
                                <span className="sr-only">Akoode Technology</span>

                                <span className="absolute bottom-full left-0 mb-2.5 hidden group-hover:block bg-[#474972] text-white text-xs px-2.5 py-1 rounded-md whitespace-nowrap pointer-events-none shadow-md z-30">
                                    AI & Software company in India | USA
                                </span>
                            </a>
                            <div className="space-y-1">
                                <p className="font-normal text-white">© 2026 Bacstory</p>
                                <p className="whitespace-nowrap space-x-1.5 text-neutral-300 font-light">
                                    <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
                                    <span>•</span>
                                    <a href="#terms" className="hover:text-white transition-colors">Terms & Conditions</a>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Columns (Nav Menus) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 md:-mr-10 mr-0">
                        {/* Brand Column */}
                        <div className="space-y-4">
                            <h3 className="font-clashDisplay text-base lg:text-lg font-semibold tracking-wide">Brand</h3>
                            <ul className="space-y-2.5">
                                {brandLinks.map((link) => (
                                    <li key={link.name}>
                                        <Link href={link.href} className="text-neutral-400 hover:text-white transition-colors duration-200 text-sm md:text-[1.2vw] font-sans font-light">
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Shop Column */}
                        <div className="space-y-4">
                            <h3 className="font-clashDisplay text-base lg:text-lg font-semibold tracking-wide">Shop</h3>
                            <ul className="space-y-2.5">
                                {shopLinks.map((link) => (
                                    <li key={link.name}>
                                        <Link href={link.href} className="text-neutral-400 hover:text-white transition-colors duration-200 text-sm md:text-[1.2vw] font-sans font-light">
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Support Column */}
                        <div className="space-y-4">
                            <h3 className="font-clashDisplay text-base lg:text-lg font-semibold tracking-wide">Support</h3>
                            <ul className="space-y-2.5">
                                {supportLinks.map((link) => (
                                    <li key={link.name}>
                                        <Link href={link.href} className="text-neutral-400 hover:text-white transition-colors duration-200 text-sm md:text-[1.2vw] font-sans font-light">
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Identity Column */}
                        <div className="space-y-4">
                            <h3 className="font-clashDisplay text-base lg:text-lg font-semibold tracking-wide">Identity</h3>
                            <ul className="space-y-2.5">
                                {identityLinks.map((link) => (
                                    <li key={link.name}>
                                        <Link href={link.href} className="text-neutral-400 hover:text-white transition-colors duration-200 text-sm md:text-[1.2vw] font-sans font-light">
                                            {link.name}
                                        </Link>
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
