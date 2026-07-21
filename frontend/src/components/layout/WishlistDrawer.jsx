"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Heart } from "lucide-react";
import Link from "next/link";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { getImageUrl } from "@/lib/api";
import SelectOptionsModal from "@/components/ui/SelectOptionsModal";

export default function WishlistDrawer() {
    const {
        wishlistItems,
        isWishlistOpen,
        wishlistCount,
        removeFromWishlist,
        closeWishlist
    } = useWishlist();

    const { addToCart } = useCart();
    const drawerRef = useRef(null);
    const [selectedProductForOptions, setSelectedProductForOptions] = useState(null);

    // Close on Escape key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                closeWishlist();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [closeWishlist]);

    // Prevent body scroll when wishlist is open
    useEffect(() => {
        if (isWishlistOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isWishlistOpen]);

    const handleOpenOptionsModal = (item) => {
        setSelectedProductForOptions(item);
    };

    const handleConfirmAddToCart = (product, quantity, size, color) => {
        addToCart(product, quantity, size, color);
        closeWishlist();
    };

    const handleAddAllToCart = () => {
        if (wishlistItems.length > 0) {
            // Prompt for the first item or handle options selection
            setSelectedProductForOptions(wishlistItems[0]);
        }
    };

    return (
        <>
            {/* Backdrop Overlay */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300 ${isWishlistOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                onClick={closeWishlist}
            />

            {/* Slide-out Wishlist Drawer Panel */}
            <div
                ref={drawerRef}
                className={`fixed top-0 right-0 h-full w-full sm:max-w-[540px] bg-[#FAF9F6] text-black shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${isWishlistOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200/80">
                    <h2 className="font-clashDisplay text-2xl font-semibold text-black flex items-baseline gap-2">
                        Wishlist
                        {wishlistCount > 0 && (
                            <span className="font-sans text-sm font-normal text-neutral-400">
                                ({wishlistCount})
                            </span>
                        )}
                    </h2>
                    <button
                        onClick={closeWishlist}
                        className="p-1 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer text-neutral-500 hover:text-black"
                        aria-label="Close wishlist"
                    >
                        <X className="w-6 h-6 stroke-[1.5]" />
                    </button>
                </div>

                {/* Wishlist Items Content */}
                <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                    {wishlistItems.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2">
                            <div className="w-16 h-16 bg-[#F4F0EA] rounded-full flex items-center justify-center text-neutral-400/80 mb-4 select-none">
                                <Heart className="w-6 h-6 stroke-[1.25]" />
                            </div>
                            <h3 className="font-sans text-lg font-semibold text-black">Nothing saved yet</h3>
                            <p className="text-xs sm:text-sm text-neutral-400 max-w-[280px] leading-relaxed pb-4">
                                Tap the heart on any piece to save it here for later.
                            </p>
                            <button
                                onClick={closeWishlist}
                                className="px-6 py-2 border border-black hover:bg-black hover:text-white transition-colors rounded-full text-xs font-semibold cursor-pointer text-black bg-transparent"
                            >
                                Explore Collection
                            </button>
                        </div>
                    ) : (
                        <div className="px-6 py-6 grid grid-cols-2 gap-4">
                            {wishlistItems.map((item, index) => {
                                const displayOffer = item.offer;
                                const displayTag = item.tag;

                                return (
                                    <div
                                        key={item.id + "-" + index}
                                        className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/40 overflow-hidden shadow-xs flex flex-col"
                                    >
                                        {/* Image Box */}
                                        <div className="relative w-full aspect-[4/5] bg-[#F4F0EA] flex items-center justify-center flex-shrink-0 group">
                                            {/* Top badges (Top-left) */}
                                            <div className="absolute top-3 left-3 z-10 flex flex-row gap-1">
                                                {displayOffer && (
                                                    <div className="text-[8px] sm:text-[9px] font-bold tracking-tight px-2 py-0.5 rounded-full uppercase bg-[#C5B9AC] text-[#1F1108] w-fit">
                                                        {displayOffer}
                                                    </div>
                                                )}
                                                <span className="bg-black text-white text-[8px] sm:text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase select-none w-fit">
                                                    {displayTag || "Original Series"}
                                                </span>
                                            </div>

                                            {/* Active Red Heart Icon (Top-right) */}
                                            <button
                                                onClick={() => removeFromWishlist(item.id)}
                                                className="absolute top-3 right-3 z-10 p-1 text-red-500 hover:scale-105 transition-transform cursor-pointer"
                                                aria-label="Remove from wishlist"
                                            >
                                                <Heart className="w-4.5 h-4.5 fill-red-500 stroke-red-500" />
                                            </button>

                                            {/* Product Image */}
                                            <Link
                                                href={item.link || `/products/${item.slug || item.id}`}
                                                onClick={closeWishlist}
                                                className="relative w-[75%] h-[75%] transition-transform duration-300 group-hover:scale-105 block"
                                            >
                                                <Image
                                                    src={getImageUrl(item.image)}
                                                    alt={item.name}
                                                    fill
                                                    className="object-contain select-none"
                                                    sizes="(max-width: 640px) 40vw, 200px"
                                                    unoptimized
                                                />
                                            </Link>
                                        </div>

                                        {/* Details Body */}
                                        <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                                            <Link
                                                href={item.link || `/products/${item.slug || item.id}`}
                                                onClick={closeWishlist}
                                                className="block hover:underline"
                                            >
                                                <h3 className="font-sans text-xs sm:text-sm font-bold text-black leading-snug line-clamp-2">
                                                    {item.name}
                                                </h3>
                                                <p className="font-clashDisplay text-xs sm:text-sm font-bold text-black mt-1">
                                                    {item.price}
                                                </p>
                                            </Link>

                                            {/* Add to Cart button */}
                                            <button
                                                onClick={() => handleOpenOptionsModal(item)}
                                                className="w-full bg-[#DFD7CC]/80 hover:bg-[#DFD7CC] text-black font-semibold text-[10px] sm:text-xs py-2 rounded-full mt-3 cursor-pointer text-center select-none transition-colors"
                                            >
                                                Add to Cart
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer (Add All to Cart button) */}
                {wishlistItems.length > 0 && (
                    <div className="px-6 py-6 border-t border-neutral-200/80 bg-[#FAF9F6]">
                        <button
                            onClick={handleAddAllToCart}
                            className="w-full h-12 bg-[#0F172A] hover:bg-black text-white rounded-full font-bold text-sm tracking-wide flex items-center justify-center cursor-pointer transition-colors shadow-md shadow-black/5"
                        >
                            Add All to Cart
                        </button>
                    </div>
                )}
            </div>

            {/* Select Options Modal for Wishlist Drawer */}
            <SelectOptionsModal
                isOpen={!!selectedProductForOptions}
                onClose={() => setSelectedProductForOptions(null)}
                product={selectedProductForOptions}
                onConfirmAddToCart={handleConfirmAddToCart}
            />
        </>
    );
}
