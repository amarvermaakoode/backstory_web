"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Heart, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { allProducts as dbProducts } from "@/data/products";
import WishlistCard from "@/components/ui/WishlistCard";

export default function WishlistPage() {
    const { wishlistItems, removeFromWishlist, toggleWishlist, isInWishlist } = useWishlist();
    const { addToCart } = useCart();
    const [activeCategory, setActiveCategory] = useState("T-SHIRTS");
    const [currentPage, setCurrentPage] = useState(1);

    const getImageUrl = (path) => {
        if (!path) return "/images/placeholder.png";
        if (path.startsWith("http") || path.startsWith("data:")) return path;
        if (path.startsWith("/images/")) return path;
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        return `${apiBase}${path.startsWith("/") ? "" : "/"}${path}`;
    };

    // Categorize wishlist items
    const categorizeItem = (item) => {
        const name = item.name.toLowerCase();
        if (name.includes("hoodie") || name.includes("sweater") || name.includes("zip")) {
            return "HOODIES";
        }
        if (name.includes("accessory") || name.includes("bag") || name.includes("cap") || name.includes("mug")) {
            return "ACCESSORIES";
        }
        return "T-SHIRTS"; // Default category
    };

    const filteredWishlist = wishlistItems.filter(
        (item) => categorizeItem(item) === activeCategory
    );

    // Pagination constants
    const ITEMS_PER_PAGE = 8;
    const totalPages = Math.max(1, Math.ceil(filteredWishlist.length / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedWishlist = filteredWishlist.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Get 4 explore products that are not currently in the wishlist
    const exploreProducts = dbProducts
        .filter((product) => !wishlistItems.some((item) => item.id === product.id))
        .slice(0, 4);

    const handleAddToCart = (item) => {
        addToCart(item, 1, "M", item.colors?.[0] || { name: "Default", hex: "#000" });
    };

    return (
        <div className="min-h-screen mt-16 bg-[#FAF9F6] text-black selection:bg-neutral-200">
            <Navbar solid={true} light={true} />

            <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-10">
                {/* Breadcrumbs */}
                <nav className="text-xs text-neutral-400 font-normal">
                    <Link href="/" className="text-black hover:underline">Home</Link>
                    <span className="mx-1">/</span>
                    <span className="text-neutral-500">Wishlist</span>
                </nav>

                {/* Page Title */}
                <h1 className="font-clashDisplay text-3xl md:text-[3vw] font-semibold tracking-tight text-black mt-4">
                    Wishlist
                </h1>

                {/* Filters & Actions Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 pb-5 border-b border-neutral-200/50">
                    {/* Category tabs */}
                    <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
                        {["T-SHIRTS", "HOODIES", "ACCESSORIES"].map((category) => {
                            const isActive = activeCategory === category;
                            return (
                                <button
                                    key={category}
                                    onClick={() => {
                                        setActiveCategory(category);
                                        setCurrentPage(1);
                                    }}
                                    className={`text-xs font-semibold tracking-wider uppercase whitespace-nowrap transition-colors duration-200 cursor-pointer relative py-1 ${isActive ? "text-black" : "text-neutral-400 hover:text-black"
                                        }`}
                                >
                                    {category}
                                    {isActive && (
                                        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Filter button */}
                    <button className="flex items-center bg-[#F4F0EA] gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-black hover:border-black transition-colors cursor-pointer self-end sm:self-auto">
                        Filter
                        <SlidersHorizontal className="stroke-2 w-3 h-3" />
                    </button>
                </div>

                {/* Wishlist Grid */}
                {paginatedWishlist.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12 mt-10">
                        {paginatedWishlist.map((item) => (
                            <div key={item.id} className="w-full">
                                <WishlistCard 
                                    item={item} 
                                    onRemove={removeFromWishlist} 
                                    onAddToCart={handleAddToCart} 
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 bg-[#F4F0EA] rounded-full flex items-center justify-center text-neutral-400 mb-4">
                            <Heart className="w-6 h-6 stroke-[1.25]" />
                        </div>
                        <h3 className="font-sans text-lg font-bold text-black">Your wishlist is empty</h3>
                        <p className="text-xs sm:text-sm text-neutral-400 max-w-[280px] mt-2 leading-relaxed">
                            No items found in {activeCategory.toLowerCase()}. Explore our collection to add items.
                        </p>
                        <Link
                            href="/products"
                            className="mt-6 px-6 py-2.5 bg-black text-white hover:bg-neutral-800 transition-colors rounded-full text-xs font-semibold"
                        >
                            Explore Collection
                        </Link>
                    </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-16">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-neutral-200 rounded-full hover:border-black transition-colors disabled:opacity-30 disabled:hover:border-neutral-200 cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-full text-xs font-semibold transition-all cursor-pointer ${currentPage === page
                                        ? "bg-black text-white"
                                        : "hover:bg-neutral-100 text-neutral-600"
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-neutral-200 rounded-full hover:border-black transition-colors disabled:opacity-30 disabled:hover:border-neutral-200 cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Explore More Section */}
                {exploreProducts.length > 0 && (
                    <div className="mt-24 pt-12 border-t border-neutral-200/50">
                        <h2 className="font-clashDisplay text-2xl font-semibold text-black tracking-tight mb-8">
                            Explore more Products
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12">
                            {exploreProducts.map((product) => {
                                const isWish = isInWishlist(product.id);
                                return (
                                    <div key={product.id} className="group bg-white rounded-[24px] sm:rounded-[28px] border border-neutral-200/60 flex flex-col relative transition-all duration-300 hover:shadow-xs overflow-hidden">
                                        <div className="relative w-full aspect-[4/5] bg-[#F4F0EA] flex items-center justify-center overflow-hidden">
                                            {/* Top badges */}
                                            <div className="absolute top-3 left-3 z-10 flex flex-row gap-1.5">
                                                {product.offer && (
                                                    <div className="text-[9px] font-bold tracking-tight px-2 rounded-full uppercase bg-[#C5B9AC] text-[#1F1108] w-fit h-5 flex items-center justify-center">
                                                        {product.offer}
                                                    </div>
                                                )}
                                                {product.tag && (
                                                    <div className="bg-[#101820] text-white text-[8px] sm:text-[9px] font-bold tracking-wider px-3 rounded-full uppercase w-fit h-5 flex items-center justify-center select-none">
                                                        {product.tag}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Heart Toggle Button */}
                                            <button
                                                onClick={() => toggleWishlist(product)}
                                                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white hover:scale-105 transition-transform cursor-pointer shadow-xs flex items-center justify-center text-neutral-500 hover:text-black"
                                                aria-label="Toggle Wishlist"
                                            >
                                                <Heart
                                                    className={`h-4 w-4 transition-all ${isWish
                                                        ? "fill-red-500 stroke-red-500 scale-110"
                                                        : "stroke-neutral-500 hover:stroke-black"
                                                        }`}
                                                />
                                            </button>

                                            {/* Image */}
                                            <Link href={`/products/${product.id}`} className="relative w-[75%] h-[75%] transition-transform duration-300 group-hover:scale-105">
                                                <Image
                                                    src={getImageUrl(product.image)}
                                                    alt={product.name}
                                                    fill
                                                    className="object-contain select-none"
                                                    sizes="(max-width: 640px) 40vw, 250px"
                                                    unoptimized
                                                />
                                            </Link>

                                            {/* Rating badge (bottom-left) */}
                                            <div className="absolute bottom-3 left-3 z-10 bg-white border border-neutral-300/80 text-[10px] font-semibold text-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs select-none">
                                                <span className="text-black">★</span>
                                                <span>{product.rating || "4.7"} ({product.reviewsCount || 63})</span>
                                            </div>
                                        </div>

                                        {/* Bottom Content Section (White Background details and button) */}
                                        <div className="p-4 flex flex-col flex-grow">
                                            {/* Info */}
                                            <div className="flex flex-col gap-1 flex-1">
                                                <h3 className="font-sans text-sm sm:text-base font-semibold text-black leading-snug line-clamp-1">
                                                    {product.name}
                                                </h3>
                                                <p className="font-clashDisplay text-lg sm:text-xl font-bold text-black mt-0.5">
                                                    {product.price}
                                                </p>
                                            </div>

                                            {/* Add to Cart */}
                                            <button
                                                onClick={() => handleAddToCart(product)}
                                                className="w-full mt-4 py-2.5 bg-white border border-black rounded-full font-semibold text-xs sm:text-sm text-black hover:bg-black hover:text-white transition-all cursor-pointer text-center"
                                            >
                                                Add to Cart
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
