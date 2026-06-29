"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Search, Heart, ShoppingBag, User } from "lucide-react";

export default function Navbar({ cartCount = 0, onSearchClick }) {
    const [scrolled, setScrolled] = useState(false);

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
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled
                ? "bg-black/90 backdrop-blur-md "
                : "bg-transparent"
                }`}
        >
            <div className="mx-auto max-w-full px-12 h-17 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center">
                    <Image
                        src="/images/logo.png"
                        alt="bacstory logo"
                        width={120}
                        height={26}
                        className="h-7 w-auto object-contain"
                        priority
                    />
                </div>

                {/* Navigation */}
                <nav className="hidden md:flex items-center gap-10 text-white  ">
                    <a href="#tribe" className="text-[15px] font-normal hover:text-[#dfd7cc]">
                        Tribe
                    </a>
                    <a href="#identity" className="text-[15px] font-normal hover:text-[#dfd7cc]">
                        Identity
                    </a>
                    <a href="#shop" className="text-[15px] font-normal hover:text-[#dfd7cc]">
                        Shop
                    </a>
                    <a href="#brand" className="text-[15px] font-normal hover:text-[#dfd7cc]">
                        The Brand
                    </a>
                </nav>

                {/* Header Action Icons */}
                <div className="flex items-center gap-6 text-white/90">
                    <button
                        onClick={onSearchClick}
                        className="hover:text-white transition-colors cursor-pointer"
                        aria-label="Search"
                    >
                        <Search className="h-5 w-5 stroke-[1.25]" />
                    </button>
                    <button className="hover:text-white transition-colors cursor-pointer" aria-label="Favorites">
                        <Heart className="h-5 w-5 stroke-[1.25]" />
                    </button>
                    <button className="relative hover:text-white transition-colors cursor-pointer" aria-label="Cart">
                        <ShoppingBag className="h-5 w-5 stroke-[1.25]" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                                {cartCount}
                            </span>
                        )}
                    </button>
                    <button className="hover:text-white transition-colors cursor-pointer" aria-label="Account">
                        <User className="h-5 w-5 stroke-[1.25]" />
                    </button>
                </div>
            </div>
        </header>
    );
}
