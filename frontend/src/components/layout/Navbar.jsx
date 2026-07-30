"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useUserAuth } from "@/context/UserAuthContext";

export default function Navbar({ onSearchClick, solid = false, light = false }) {
    const [scrolled, setScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { cartCount, openCart } = useCart();
    const { wishlistCount, openWishlist } = useWishlist();
    const { user, logout } = useUserAuth();

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
                ? "bg-[#FAF9F6] text-black"
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
                <Link href="/" className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 flex items-center cursor-pointer">
                    <Image
                        src="/images/logo.png"
                        alt="bacstory logo"
                        href="/"
                        cursor="pointer"
                        width={120}
                        height={26}
                        className={`h-6 sm:h-7 w-auto object-contain ${light ? "invert" : ""}`}
                        priority
                    />
                </Link>

                {/* Navigation (Desktop) */}
                <nav className={`hidden md:flex items-center gap-10 ${light ? "text-neutral-700" : "text-white"}`}>
                    <Link href="/#tribe" className={`text-[1.2vw] font-normal transition-colors ${light ? "hover:text-black" : "hover:text-[#dfd7cc]"}`}>
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
                <div className={`flex items-center gap-4 ${light ? "text-neutral-700" : "text-white/90"}`}>
                    <button
                        onClick={onSearchClick}
                        className={`hidden md:block transition-colors cursor-pointer ${light ? "hover:text-black" : "hover:text-white"}`}
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
                            className={`h-5.5 w-5.5 object-contain transition-transform hover:scale-105 ${light ? "invert" : ""}`}
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
                            className={`h-5.5 w-5.5 object-contain transition-transform hover:scale-105 ${light ? "invert" : ""}`}
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
                            <button className={`transition-colors cursor-pointer ${light ? "hover:text-black" : "hover:text-white"}`} aria-label="Account">
                                <Image
                                    src="/images/landing-page/user.svg"
                                    alt="Account"
                                    width={22}
                                    height={22}
                                    className={`h-5.5 w-5.5 object-contain transition-transform hover:scale-105 ${light ? "invert" : ""}`}
                                />
                            </button>
                            <div className="absolute right-0 top-full pt-2 w-48 hidden group-hover:block transition-all z-50">
                                <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-xl py-2">
                                    <div className="px-4 py-2 border-b border-neutral-100">
                                        <p className="text-[10px] text-neutral-400 font-medium">Logged in via</p>
                                        <p className="text-xs font-bold text-neutral-800 truncate mt-0.5">{user.email || user.phoneNumber}</p>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    >
                                        Log Out
                                    </button>
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
                                className={`h-5.5 w-5.5 object-contain transition-transform hover:scale-105 ${light ? "invert" : ""}`}
                            />
                        </Link>
                    )}
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
                        {user ? (
                            <div className="flex flex-col pt-4 border-t border-neutral-200/40">
                                <span className={`text-xs font-medium mb-2 ${light ? "text-neutral-500" : "text-neutral-400"}`}>
                                    Logged in as <span className="font-bold text-black dark:text-white">{user.name}</span>
                                </span>
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        logout();
                                    }}
                                    className="transition-colors py-2 text-red-600 font-bold cursor-pointer text-sm"
                                >
                                    Log Out
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`transition-colors py-2 border-t border-neutral-200/40 text-sm font-bold ${light ? "text-neutral-800 hover:text-black" : "text-white hover:text-[#dfd7cc]"}`}
                            >
                                Login / Sign Up
                            </Link>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}
