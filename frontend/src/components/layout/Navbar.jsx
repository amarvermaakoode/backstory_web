"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

export default function Navbar({ onSearchClick, solid = false, light = false }) {
    const [scrolled, setScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { cartCount, openCart } = useCart();
    const { wishlistCount, openWishlist } = useWishlist();

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
                <div className={`flex items-center gap-4 ${light ? "text-neutral-700" : "text-white/90"}`}>
                    <button
                        onClick={onSearchClick}
                        className={`hidden md:block transition-colors cursor-pointer ${light ? "hover:text-black" : "hover:text-white"}`}
                        aria-label="Search"
                    >
                        <svg width="20" height="20" viewBox="0 0 25 25" fill="none" className="h-5.5 w-5.5" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.625 15.625L21.875 21.875M10.4167 17.7083C6.38959 17.7083 3.125 14.4437 3.125 10.4167C3.125 6.38959 6.38959 3.125 10.4167 3.125C14.4437 3.125 17.7083 6.38959 17.7083 10.4167C17.7083 14.4437 14.4437 17.7083 10.4167 17.7083Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <button
                        onClick={openWishlist}
                        className={`relative transition-colors cursor-pointer ${light ? "hover:text-black" : "hover:text-white"}`}
                        aria-label="Favorites"
                    >
                        <svg width="20" height="20" viewBox="0 0 25 25" fill="none" className="h-5.5 w-5.5" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M21.875 8.8542C21.875 15.3587 12.5004 20.8334 12.5004 20.8334C12.5004 20.8334 3.125 15.2778 3.125 8.86738C3.125 6.25003 5.20833 4.1667 7.8125 4.1667C10.4167 4.1667 12.5 7.2917 12.5 7.2917C12.5 7.2917 14.5833 4.1667 17.1875 4.1667C19.7917 4.1667 21.875 6.25003 21.875 8.8542Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {wishlistCount > 0 && (
                            <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center ${light ? "bg-black text-white" : "bg-white text-black"
                                }`}>
                                {wishlistCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={openCart}
                        className={`relative transition-colors cursor-pointer ${light ? "hover:text-black" : "hover:text-white"}`}
                        aria-label="Cart"
                    >
                        <svg width="20" height="20" viewBox="0 0 25 25" fill="none" className="h-5.5 w-5.5" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12.5002 2.375C14.6403 2.375 16.3752 4.1099 16.3752 6.25V6.54199H18.7512L18.8947 6.55566C19.2198 6.61893 19.4719 6.8927 19.4982 7.23438L20.5402 20.7764C20.5561 20.9843 20.4846 21.1897 20.343 21.3428C20.201 21.4959 20.001 21.584 19.7922 21.584H5.20918C5.00035 21.584 4.80131 21.4959 4.65938 21.3428C4.51757 21.1896 4.44529 20.9845 4.46114 20.7764L5.50313 7.23438L5.52754 7.09277C5.61531 6.7731 5.90816 6.54199 6.25117 6.54199H8.6252V6.25C8.6252 4.1099 10.3601 2.375 12.5002 2.375ZM6.01973 20.084H18.9826L18.0568 8.04199H16.3752V9.375C16.3752 9.78921 16.0394 10.125 15.6252 10.125C15.211 10.125 14.8752 9.78921 14.8752 9.375V8.04199H10.1252V9.375C10.1252 9.78921 9.78941 10.125 9.3752 10.125C8.96098 10.125 8.6252 9.78921 8.6252 9.375V8.04199H6.94453L6.01973 20.084ZM12.5002 3.875C11.1885 3.875 10.1252 4.93832 10.1252 6.25V6.54199H14.8752V6.25C14.8752 4.93832 13.8119 3.875 12.5002 3.875Z" fill="currentColor" />
                        </svg>
                        {cartCount > 0 && (
                            <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center ${light ? "bg-black text-white" : "bg-white text-black"
                                }`}>
                                {cartCount}
                            </span>
                        )}
                    </button>
                    <button className={`transition-colors cursor-pointer ${light ? "hover:text-black" : "hover:text-white"}`} aria-label="Account">
                        <svg width="20" height="20" viewBox="0 0 25 25" fill="none" className="h-5.5 w-5.5" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16.4062 14.875C18.7078 14.8752 20.541 16.7839 20.541 19.0977V20.833C20.541 21.2472 20.2052 21.583 19.791 21.583H5.20801C4.79379 21.583 4.45801 21.2472 4.45801 20.833V19.0977C4.45801 16.7838 6.29204 14.875 8.59375 14.875H16.4062ZM8.59375 16.375C7.15604 16.375 5.95801 17.5762 5.95801 19.0977V20.083H19.041V19.0977C19.041 17.5763 17.8438 16.3752 16.4062 16.375H8.59375ZM12.5 2.375C15.2153 2.37518 17.416 4.5767 17.416 7.29199C17.4158 10.0071 15.2151 12.2078 12.5 12.208C9.78471 12.208 7.58318 10.0072 7.58301 7.29199C7.58301 4.57659 9.7846 2.375 12.5 2.375ZM12.5 3.875C10.613 3.875 9.08301 5.40502 9.08301 7.29199C9.08318 9.17882 10.6131 10.708 12.5 10.708C14.3867 10.7078 15.9158 9.17871 15.916 7.29199C15.916 5.40513 14.3868 3.87518 12.5 3.875Z" fill="currentColor" />
                        </svg>
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
