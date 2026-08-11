"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, User, Package, Heart, Tag, Scan, Headphones, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useUserAuth } from "@/context/UserAuthContext";
import { fetchListingData } from "@/services/productService";
import SearchOverlay from "@/components/layout/SearchOverlay";

const userMenuItems = [
    { label: "Account", href: "/account", icon: User },
    { label: "Orders", href: "/account/orders", icon: Package },
    { label: "Wishlist", href: "/account/wishlist", icon: Heart },
    { label: "Coupons", href: "/account/coupons", icon: Tag },
    { label: "QR Identity", href: "/account/qr-identity", icon: Scan },
    { label: "Support", href: "/account/support", icon: Headphones },
];

export default function Navbar({ onSearchClick, solid = false, light = false }) {
    const [scrolled, setScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { cartCount, openCart } = useCart();
    const { wishlistCount, openWishlist } = useWishlist();
    const { user, logout } = useUserAuth();

    // Opens the built-in search overlay unless a custom handler is supplied
    const handleSearchClick = onSearchClick || (() => setIsSearchOpen(true));
    const closeSearch = useCallback(() => setIsSearchOpen(false), []);

    const handleWishlistClick = () => {
        if (pathname === "/" && wishlistCount > 0) {
            router.push("/wishlist");
        } else {
            openWishlist();
        }
    };

    const handleCartClick = () => {
        if (pathname === "/" && cartCount > 0) {
            router.push("/cart");
        } else {
            openCart();
        }
    };

    useEffect(() => {
        // Pre-fetch listing data in background for instant navigation
        fetchListingData().catch(() => { });

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        handleScroll(); // Check on initial load 
        window.addEventListener("scroll", handleScroll);

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
        <header
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${light
                ? "bg-[#FAF9F6] text-black border-b border-neutral-200/60"
                : scrolled || isMobileMenuOpen || solid
                    ? "bg-black/90 backdrop-blur-md text-white"
                    : "bg-transparent text-white"
                }`}
        >
            <div className="relative mx-auto max-w-full px-4 sm:px-6 md:px-12 h-17 flex items-center justify-between">
                {/* Left Section: Mobile Menu Icon + Logo */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={`md:hidden transition-colors cursor-pointer ${light ? "text-black hover:text-neutral-600" : "text-white hover:text-[#dfd7cc]"}`}
                        aria-label="Toggle Menu"
                    >
                        {isMobileMenuOpen ? (
                            <X className="h-6 w-6 stroke-[1.25]" />
                        ) : (
                            <Menu className="h-6 w-6 stroke-[1.25]" />
                        )}
                    </button>

                    {/* Logo */}
                    <Link href="/" className="flex items-center cursor-pointer">
                        <Image
                            src="/images/logo.png"
                            alt="bacstory logo"
                            width={130}
                            height={28}
                            className={`h-6.5 sm:h-7.5 md:h-8 w-auto object-contain ${light ? "invert" : ""}`}
                            priority
                        />
                    </Link>
                </div>

                {/* Navigation (Desktop) */}
                <nav className={`hidden md:flex items-center gap-10 ${light ? "text-neutral-700" : "text-white"}`}>
                    <Link href="/product-list/tribe/all" className={`text-[1.2vw] font-normal transition-colors ${light ? "hover:text-black" : "hover:text-[#dfd7cc]"}`}>
                        Tribe
                    </Link>
                    <Link href="/about-us#philosophy" className={`text-[1.2vw] font-normal transition-colors ${light ? "hover:text-black" : "hover:text-[#dfd7cc]"}`}>
                        Identity
                    </Link>
                    <Link href="/product-list" className={`text-[1.2vw] font-normal transition-colors ${light ? "hover:text-black" : "hover:text-[#dfd7cc]"}`}>
                        Shop
                    </Link>
                    <Link href="/about-us" className={`text-[1.2vw] font-normal transition-colors ${light ? "hover:text-black" : "hover:text-[#dfd7cc]"}`}>
                        The Brand
                    </Link>
                </nav>

                {/* Header Action Icons */}
                <div className={`flex items-center gap-3.5 sm:gap-4 ${light ? "text-neutral-700" : "text-white/90"}`}>
                    <button
                        onClick={handleSearchClick}
                        className={`transition-colors cursor-pointer ${light ? "hover:text-black" : "hover:text-white"}`}
                        aria-label="Search"
                    >
                        <Image
                            src="/images/landing-page/search.svg"
                            alt="Search"
                            width={22}
                            height={22}
                            className={`h-5.5 w-5.5 object-contain transition-transform hover:scale-105 ${light ? "invert" : ""}`}
                        />
                    </button>
                    <button
                        onClick={handleWishlistClick}
                        className={`relative transition-colors cursor-pointer ${light ? "hover:text-black" : "hover:text-white"}`}
                        aria-label="Favorites"
                    >
                        <Image
                            src="/images/landing-page/like.svg"
                            alt="Favorites"
                            width={22}
                            height={22}
                            className={`h-5 w-5 sm:h-5.5 sm:w-5.5 object-contain transition-transform hover:scale-105 ${light ? "invert" : ""}`}
                        />
                        {wishlistCount > 0 && (
                            <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center ${light ? "bg-black text-white" : "bg-white text-black"
                                }`}>
                                {wishlistCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={handleCartClick}
                        className={`relative transition-colors cursor-pointer ${light ? "hover:text-black" : "hover:text-white"}`}
                        aria-label="Cart"
                    >
                        <Image
                            src="/images/landing-page/bag.svg"
                            alt="Cart"
                            width={22}
                            height={22}
                            className={`h-5 w-5 sm:h-5.5 sm:w-5.5 object-contain transition-transform hover:scale-105 ${light ? "invert" : ""}`}
                        />
                        {cartCount > 0 && (
                            <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center ${light ? "bg-black text-white" : "bg-white text-black"
                                }`}>
                                {cartCount}
                            </span>
                        )}
                    </button>
                    {user ? (
                        <div className="relative group select-none flex items-center">
                            <Link href="/account" className={`transition-colors cursor-pointer ${light ? "hover:text-black" : "hover:text-white"}`} aria-label="Account">
                                <Image
                                    src="/images/landing-page/user.svg"
                                    alt="Account"
                                    width={22}
                                    height={22}
                                    className={`h-5 w-5 sm:h-5.5 sm:w-5.5 object-contain transition-transform hover:scale-105 ${light ? "invert" : ""}`}
                                />
                            </Link>
                            <div className="absolute right-0 top-full pt-2 w-56 hidden group-hover:block transition-all z-50">
                                <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-xl shadow-black/10 p-2 space-y-0.5 text-neutral-900">
                                    {userMenuItems.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <Link
                                                key={item.label}
                                                href={item.href}
                                                className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-neutral-900 hover:bg-[#f4f4f5] transition-colors"
                                            >
                                                <Icon className="w-4.5 h-4.5 text-neutral-800 stroke-[1.6]" />
                                                <span>{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                    <div className="pt-1 mt-1 border-t border-neutral-100">
                                        <button
                                            onClick={logout}
                                            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                                        >
                                            <LogOut className="w-4.5 h-4.5 stroke-[1.6]" />
                                            <span>Log Out</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Link href="/login" className={`transition-colors cursor-pointer ${light ? "hover:text-black" : "hover:text-white"}`} aria-label="Account">
                            <Image
                                src="/images/landing-page/user.svg"
                                alt="Account"
                                width={22}
                                height={22}
                                className={`h-5 w-5 sm:h-5.5 sm:w-5.5 object-contain transition-transform hover:scale-105 ${light ? "invert" : ""}`}
                            />
                        </Link>
                    )}
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className={`md:hidden fixed inset-x-0 top-17 border-b z-40 animate-fade-in ${light
                    ? "bg-white/95 backdrop-blur-lg border-neutral-200"
                    : "bg-[#030303] backdrop-blur-lg border-neutral-900"
                    }`}>
                    <nav className="flex flex-col p-6 space-y-4 text-center font-clashDisplay text-lg font-medium">
                        <Link
                            href="/product-list/tribe/all"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`transition-colors py-2 ${light ? "text-neutral-800 hover:text-black" : "text-white hover:text-[#dfd7cc]"}`}
                        >
                            Tribe
                        </Link>
                        <Link
                            href="/about-us#philosophy"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`transition-colors py-2 ${light ? "text-neutral-800 hover:text-black" : "text-white hover:text-[#dfd7cc]"}`}
                        >
                            Identity
                        </Link>
                        <Link
                            href="/product-list"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`transition-colors py-2 ${light ? "text-neutral-800 hover:text-black" : "text-white hover:text-[#dfd7cc]"}`}
                        >
                            Shop
                        </Link>
                        <Link
                            href="/about-us"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`transition-colors py-2 ${light ? "text-neutral-800 hover:text-black" : "text-white hover:text-[#dfd7cc]"}`}
                        >
                            The Brand
                        </Link>
                    </nav>
                </div>
            )}
        </header>

        <SearchOverlay isOpen={isSearchOpen} onClose={closeSearch} />
        </>
    );
}
