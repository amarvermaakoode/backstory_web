"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Heart } from "lucide-react";
import Link from "next/link";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useUserAuth } from "@/context/UserAuthContext";
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

    const { user } = useUserAuth();
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
        if (selectedProductForOptions) {
            removeFromWishlist(selectedProductForOptions);
        }
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
                aria-hidden="true"
                className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300 ${isWishlistOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                onClick={closeWishlist}
            />

            {/* Slide-out Wishlist Drawer Panel */}
            <div
                ref={drawerRef}
                role="dialog"
                aria-modal="true"
                aria-label="Wishlist Drawer"
                inert={!isWishlistOpen}
                className={`fixed top-0 right-0 h-full w-full sm:max-w-[540px] bg-[#FAF9F6] text-black z-50 flex flex-col transition-transform duration-300 ease-in-out ${isWishlistOpen ? "translate-x-0 shadow-2xl" : "translate-x-full shadow-none"
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200/80">
                    <h2 className="font-clashDisplay text-2xl font-semibold text-black flex items-baseline gap-2">
                        Wishlist
                        {user && wishlistCount > 0 && (
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
                        <X className="w-6 h-6 stroke-[1.5]" aria-hidden="true" />
                    </button>
                </div>

                {/* Wishlist Items Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                    {!user ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                            <div className="w-16 h-16 bg-[#F4F0EA] rounded-full flex items-center justify-center text-neutral-400/80 select-none">
                                <Heart className="w-6 h-6 stroke-[1.25]" aria-hidden="true" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-sans text-lg font-semibold text-black">Sign in to view wishlist</h3>
                                <p className="text-xs sm:text-sm text-neutral-400 max-w-[280px] leading-relaxed">
                                    Save your favorite items across devices and get notified about special offers.
                                </p>
                            </div>
                            <Link
                                href="/login"
                                onClick={closeWishlist}
                                className="px-8 py-2.5 bg-[#0F172A] hover:bg-black text-white transition-colors rounded-full text-xs font-bold tracking-wide cursor-pointer shadow-sm"
                            >
                                Log In
                            </Link>
                        </div>
                    ) : wishlistItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                            <div className="w-16 h-16 bg-[#F4F0EA] rounded-full flex items-center justify-center text-neutral-400/80 select-none">
                                <Heart className="w-6 h-6 stroke-[1.25]" aria-hidden="true" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-sans text-lg font-semibold text-black">Your wishlist is empty</h3>
                                <p className="text-xs sm:text-sm text-neutral-400 max-w-[280px] leading-relaxed">
                                    Explore our collections and save pieces that tell your story.
                                </p>
                            </div>
                            <Link
                                href="/product-list"
                                onClick={closeWishlist}
                                className="px-6 py-2 border border-black hover:bg-black hover:text-white transition-colors rounded-full text-xs font-semibold cursor-pointer text-black bg-transparent inline-block"
                            >
                                Explore Collection
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 sm:gap-6">
                            {wishlistItems.map((item) => {
                                const displayTag = item.tag || item.category || "BACSTORY";
                                const displayOffer = item.offer || item.discount;

                                return (
                                    <div
                                        key={item.id}
                                        className="bg-white rounded-2xl border border-neutral-200/80 overflow-hidden flex flex-col justify-between group shadow-sm hover:shadow-md transition-all duration-300 relative"
                                    >
                                        {/* Image Container + Badges */}
                                        <div className="relative w-full aspect-square bg-[#FAF9F6] flex items-center justify-center p-4">
                                            {/* Badges (Top-left) */}
                                            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
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
                                                aria-label={`Remove ${item.name || 'item'} from wishlist`}
                                            >
                                                <Heart className="w-4.5 h-4.5 fill-red-500 stroke-red-500" aria-hidden="true" />
                                            </button>

                                            {/* Product Image */}
                                            <Link
                                                href={item.link || `/products/${item.slug || item.id}`}
                                                onClick={closeWishlist}
                                                className="relative w-full h-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                                            >
                                                <Image
                                                    src={getImageUrl(item.image)}
                                                    alt={item.name || "Product image"}
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
                                                aria-label={`Add ${item.name} to cart`}
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
