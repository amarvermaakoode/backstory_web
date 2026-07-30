"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { getImageUrl } from "@/lib/api";

export default function WishlistCard({ item, onRemove, onAddToCart }) {
    const displayOffer = item.offer;
    const displayTag = item.tag;
    const displayRating = item.rating || "4.7";
    const displayReviewsCount = item.reviewsCount || item.reviews || 63;

    return (
        <div className="group bg-white rounded-[24px] sm:rounded-[28px] border border-neutral-200/60 flex flex-col relative transition-all duration-300 hover:shadow-xs overflow-hidden w-full">
            {/* Image Box Container */}
            <div className="relative w-full aspect-square bg-[#F4F0EA] flex items-center justify-center overflow-hidden rounded-[18px] sm:rounded-[22px]">
                {/* Series & Offer badges (top-left) */}
                <div className="absolute top-3 left-3 z-10 flex flex-row gap-1">
                    {displayOffer && (
                        <div className="text-[9px] font-bold tracking-tight px-2 rounded-full uppercase bg-[#C5B9AC] text-[#1F1108] w-fit h-5 flex items-center justify-center">
                            {displayOffer}
                        </div>
                    )}
                    {displayTag && (
                        <div className="bg-[#101820] text-white text-[8px] sm:text-[9px] font-bold tracking-wider px-3 rounded-full uppercase w-fit h-5 flex items-center justify-center">
                            {displayTag}
                        </div>
                    )}
                </div>

                {/* Delete trash button (top-right) */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemove(item.id);
                    }}
                    className="absolute top-3 right-3 z-10 p-2 rounded-full bg-[#EBE7DF]/80 hover:bg-[#EBE7DF] hover:scale-105 transition-transform cursor-pointer shadow-xs flex items-center justify-center text-neutral-500 hover:text-black"
                    aria-label="Remove from Wishlist"
                >
                    <Trash2 className="h-4 w-4 stroke-[2]" />
                </button>

                {/* Image Wrapper */}
                <Link 
                    href={`/products/${item.slug || item.id}`} 
                    className="relative w-[75%] h-[75%] transition-transform duration-300 group-hover:scale-105"
                >
                    <Image
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        fill
                        className="object-contain select-none"
                        sizes="(max-width: 640px) 40vw, 250px"
                        unoptimized
                    />
                </Link>

                {/* Rating badge (bottom-left) */}
                <div className="absolute bottom-3 left-3 z-10 bg-transparent border border-black text-[10px] font-semibold text-black px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <span className="text-black">★</span>
                    <span>{displayRating} ({displayReviewsCount})</span>
                </div>
            </div>

            {/* Bottom Content Section (White Background details and Add to Cart button) */}
            <div className="p-4 flex flex-col flex-grow">
                {/* Details info */}
                <div className="flex flex-col gap-1 flex-1">
                    <h3 className="font-sans text-sm sm:text-base md:text-lg font-normal text-black leading-snug line-clamp-1">
                        {item.name}
                    </h3>
                    <p className="font-clashDisplay text-base sm:text-xl md:text-2xl font-semibold text-black mt-0.5">
                        {item.price}
                    </p>
                </div>

                {/* Add to Cart button */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onAddToCart(item);
                    }}
                    className="w-full mt-4 py-2.5 bg-white border border-black rounded-full font-semibold text-xs sm:text-sm text-black hover:bg-black hover:text-white transition-all cursor-pointer text-center"
                >
                    Add to Cart
                </button>
            </div>
        </div>
    );
}
