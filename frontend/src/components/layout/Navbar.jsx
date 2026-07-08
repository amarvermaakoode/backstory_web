"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Heart, ShoppingBag, User, Menu, X } from "lucide-react";

export default function Navbar({ cartCount = 0, onSearchClick, solid = false, light = false }) {
    const [scrolled, setScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        handleScroll(); // Check on initial load 
        window.addEventListener("scroll", handleScroll);

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${light
                ? scrolled || isMobileMenuOpen
                    ? "bg-white text-black"
                    : "bg-white text-black"
                : scrolled || isMobileMenuOpen || solid
                    ? "bg-black/90 backdrop-blur-md text-white"
                    : "bg-transparent text-white"
                }`}
        >
            <div className="relative mx-auto max-w-full px-4 sm:px-6 md:px-12 h-17 flex items-center justify-between">
                {/* Mobile Menu Icon (Left) */}
                <div className="flex md:hidden items-center">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={`transition-colors cursor-pointer ${light ? "text-black hover:text-neutral-600" : "text-white hover:text-[#dfd7cc]"}`}
                        aria-label="Toggle Menu"
                    >
                        {isMobileMenuOpen ? (
                            <X className="h-6 w-6 stroke-[1.25]" />
                        ) : (
                            <Menu className="h-6 w-6 stroke-[1.25]" />
                        )}
                    </button>
                </div>

                {/* Logo (Centered on mobile, static on desktop) */}
                <div className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 flex items-center">
                    <Image
                        src="/images/logo.png"
                        alt="bacstory logo"
                        width={120}
                        height={26}
                        className={`h-6 sm:h-7 w-auto object-contain ${light ? "invert" : ""}`}
                        priority
                    />
                </div>

                {/* Navigation (Desktop) */}
                <nav className={`hidden md:flex items-center gap-10 ${light ? "text-neutral-700" : "text-white"}`}>
                    <Link href="/#tribe" className={`text-[15px] font-normal transition-colors ${light ? "hover:text-black" : "hover:text-[#dfd7cc]"}`}>
                        Tribe
                    </Link>
                    <Link href="/#identity" className={`text-[15px] font-normal transition-colors ${light ? "hover:text-black" : "hover:text-[#dfd7cc]"}`}>
                        Identity
                    </Link>
                    <Link href="/#shop" className={`text-[15px] font-normal transition-colors ${light ? "hover:text-black" : "hover:text-[#dfd7cc]"}`}>
                        Shop
                    </Link>
                    <Link href="/#brand" className={`text-[15px] font-normal transition-colors ${light ? "hover:text-black" : "hover:text-[#dfd7cc]"}`}>
                        The Brand
                    </Link>
                </nav>

                {/* Header Action Icons */}
                <div className={`flex items-center gap-4 sm:gap-6 ${light ? "text-neutral-700" : "text-white/90"}`}>
                    <button
                        onClick={onSearchClick}
                        className={`hidden md:block transition-colors cursor-pointer ${light ? "hover:text-black" : "hover:text-white"}`}
                        aria-label="Search"
                    >
                        <Search className="h-5 w-5 stroke-[1.25]" />
                    </button>
                    <button className={`transition-colors cursor-pointer ${light ? "hover:text-black" : "hover:text-white"}`} aria-label="Favorites">
                        <Heart className="h-5 w-5 stroke-[1.25]" />
                    </button>
                    <button className={`relative transition-colors cursor-pointer ${light ? "hover:text-black" : "hover:text-white"}`} aria-label="Cart">
                        <ShoppingBag className="h-5 w-5 stroke-[1.25]" />
                        {cartCount > 0 && (
                            <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center ${light ? "bg-black text-white" : "bg-white text-black"
                                }`}>
                                {cartCount}
                            </span>
                        )}
                    </button>
                    <button className={`transition-colors cursor-pointer ${light ? "hover:text-black" : "hover:text-white"}`} aria-label="Account">
                        <User className="h-5 w-5 stroke-[1.25]" />
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className={`md:hidden fixed inset-x-0 top-17 border-b z-40 animate-fade-in ${light
                    ? "bg-white/95 backdrop-blur-lg border-neutral-200"
                    : "bg-[#030303]/95 backdrop-blur-lg border-neutral-900"
                    }`}>
                    <nav className="flex flex-col p-6 space-y-4 text-center font-clashDisplay text-lg font-medium">
                        <Link
                            href="/#tribe"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`transition-colors py-2 ${light ? "text-neutral-800 hover:text-black" : "text-white hover:text-[#dfd7cc]"}`}
                        >
                            Tribe
                        </Link>
                        <Link
                            href="/#identity"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`transition-colors py-2 ${light ? "text-neutral-800 hover:text-black" : "text-white hover:text-[#dfd7cc]"}`}
                        >
                            Identity
                        </Link>
                        <Link
                            href="/#shop"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`transition-colors py-2 ${light ? "text-neutral-800 hover:text-black" : "text-white hover:text-[#dfd7cc]"}`}
                        >
                            Shop
                        </Link>
                        <Link
                            href="/#brand"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`transition-colors py-2 ${light ? "text-neutral-800 hover:text-black" : "text-white hover:text-[#dfd7cc]"}`}
                        >
                            The Brand
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
}
