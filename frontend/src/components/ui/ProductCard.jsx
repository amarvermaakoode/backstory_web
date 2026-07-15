"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { allProducts as dbProducts } from "@/data/products";

export default function ProductCard({ 
    product, 
    isHome = false, 
    isSmall = false,
    showTag = null,
    showRating = null,
    showSwatches = null
}) {
    const { toggleWishlist, wishlistItems } = useWishlist();
    const { addToCart } = useCart();

    const isFavorite = wishlistItems.some(
        item => item.id === product.id || item.name.toLowerCase() === product.name.toLowerCase()
    );

    const handleWishlistToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Find full product object from database for wishlist context if necessary
        const fullProduct = dbProducts.find(
            p => p.id === product.id || p.name.toLowerCase() === product.name.toLowerCase()
        ) || product;
        
        toggleWishlist(fullProduct);
    };

    // Helper to get image URL safely
    const getImageUrl = (url) => {
        if (!url) return "/images/placeholder.png";
        return url;
    };

    // Calculate visibilities dynamically with fallback to defaults
    const shouldShowTag = showTag !== null ? showTag : !isHome;
    const shouldShowRating = showRating !== null ? showRating : !isHome;
    const shouldShowSwatches = showSwatches !== null ? showSwatches : !isHome;

    return (
        <Link
            href={`/products/${product.id}`}
            className="group flex flex-col cursor-pointer w-full select-none"
        >
            {/* Image Container */}
            <div 
                className={`relative w-full bg-[#F4F0EA] flex items-center justify-center overflow-hidden transition-all duration-300 ${
                    isSmall ? "aspect-[4/5]" : "aspect-square"
                }`}
            >
                {/* Badges Container (top-left) */}
                {shouldShowTag && (product.tag || product.offer) && (
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                        {product.tag && (
                            <div className="bg-[#101820] text-white text-[8px] sm:text-[10px] font-normal tracking-wider px-2.5 py-1 rounded-full uppercase flex items-center justify-center select-none">
                                {product.tag}
                            </div>
                        )}
                        {product.offer && (
                            <div 
                                className="text-[8px] sm:text-[10px] font-bold tracking-tight px-2 rounded-full uppercase flex items-center justify-center select-none py-1"
                                style={{ backgroundColor: "#C5B9AC", color: "#1F1108" }}
                            >
                                {product.offer}
                            </div>
                        )}
                    </div>
                )}

                {/* Favorite Heart Button */}
                <button
                    onClick={handleWishlistToggle}
                    className={
                        isHome
                            ? "absolute top-4 right-4 z-10 p-0 bg-transparent hover:scale-110 transition-all duration-300 cursor-pointer"
                            : "absolute top-3 right-3 z-10 transition hover:scale-110 cursor-pointer h-7 w-7 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-xs hover:bg-white/60"
                    }
                    aria-label="Add to favorites"
                >
                    <Heart
                        className={`transition-all ${isHome ? "h-6 w-6" : "h-4.5 w-4.5"} ${
                            isFavorite
                                ? "fill-red-500 text-red-500 stroke-red-500"
                                : "text-black stroke-[1.5]"
                        }`}
                    />
                </button>

                {/* Rating badge on bottom-left */}
                {shouldShowRating && product.rating && (
                    <div className="absolute bottom-3 left-3 z-10 bg-white/70 backdrop-blur-xs text-[8px] sm:text-[10px] font-medium text-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-black/10">
                        <span className="text-black">★</span>
                        <span>{product.rating}</span>
                        {product.reviewsCount !== undefined && (
                            <span className="text-neutral-500">({product.reviewsCount})</span>
                        )}
                        {product.reviews !== undefined && product.reviewsCount === undefined && (
                            <span className="text-neutral-500">({product.reviews})</span>
                        )}
                    </div>
                )}

                {/* Image rendering with Home Hover Swap Effect */}
                {isHome && product.hoverImage ? (
                    <>
                        {/* Default Front Image */}
                        <div className="absolute w-[90%] h-[90%] transition-all duration-200 ease-out group-hover:scale-105 opacity-100 group-hover:opacity-0">
                            <Image
                                src={getImageUrl(product.image)}
                                alt={product.name}
                                fill
                                sizes="(max-width: 768px) 280px, 350px"
                                className="object-contain select-none"
                                priority
                            />
                        </div>

                        {/* Hover Image */}
                        <div className="absolute inset-0 transition-all duration-500 ease-out group-hover:scale-105 opacity-0 group-hover:opacity-100">
                            <Image
                                src={getImageUrl(product.hoverImage)}
                                alt={product.name}
                                fill
                                sizes="(max-width: 768px) 280px, 350px"
                                className="object-contain object-center select-none"
                            />
                        </div>
                    </>
                ) : (
                    /* Static Image with hover zoom (No swap on listing pages) */
                    <div className="relative w-[85%] h-[85%] transition-transform duration-500 ease-out group-hover:scale-105">
                        <Image
                            src={getImageUrl(product.image)}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-contain select-none"
                            priority
                        />
                    </div>
                )}
            </div>

            {/* Product Details Section below image */}
            <div className={`mt-3 flex justify-between items-center ${isSmall ? "mx-1" : "mx-2"}`}>
                <div className="min-w-0">
                    <h3 
                        className={`font-sans text-black leading-snug truncate ${
                            isSmall ? "text-xs sm:text-sm font-medium" : "text-sm sm:text-base md:text-lg font-normal"
                        }`}
                    >
                        {product.name}
                    </h3>
                    
                    {/* Price & original strike-through if discount exists */}
                    <div className="flex items-baseline gap-2 mt-0.5">
                        <p 
                            className={`font-clashDisplay font-semibold text-black ${
                                isSmall ? "text-sm sm:text-base" : "text-base sm:text-xl md:text-2xl"
                            }`}
                        >
                            {product.price}
                        </p>
                        {product.originalPrice && (
                            <p 
                                className={`font-clashDisplay font-normal text-neutral-400 line-through ${
                                    isSmall ? "text-xs" : "text-xs sm:text-sm md:text-base"
                                }`}
                            >
                                {product.originalPrice}
                            </p>
                        )}
                    </div>

                    {/* Color Swatch Circles */}
                    {shouldShowSwatches && product.colors && product.colors.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-2 pb-1">
                            {product.colors.slice(0, 4).map((color, index) => {
                                const hexColor = typeof color === "object" ? color.hex : color;
                                return (
                                    <span
                                        key={index}
                                        className="w-3 h-3 rounded-full border border-black/10 shadow-xs"
                                        style={{ backgroundColor: hexColor }}
                                    />
                                );
                            })}
                            {product.colors.length > 4 && (
                                <span className="text-[9px] font-semibold text-neutral-500 ml-0.5">
                                    +{product.colors.length - 4}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Plus Add to Cart button */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const fullProduct = dbProducts.find(
                            p => p.id === product.id || p.name.toLowerCase() === product.name.toLowerCase()
                        ) || product;
                        addToCart(fullProduct, 1);
                    }}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F0EEE9] text-black hover:bg-neutral-200 transition-colors cursor-pointer shrink-0"
                    aria-label="Add to cart"
                >
                    <Plus className="h-4 w-4 stroke-[2]" />
                </button>
            </div>
        </Link>
    );
}
