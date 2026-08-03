"use client";

import Image from "next/image";
import Link from "next/link";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { getImageUrl } from "@/lib/api";
import { Heart, Trash2, ShoppingBag } from "lucide-react";

export default function AccountWishlistPage() {
    const { wishlistItems, removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();

    if (wishlistItems.length === 0) {
        return (
            <div className="text-center py-16">
                <Heart className="w-12 h-12 stroke-[1.2] text-neutral-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold font-clashDisplay text-neutral-900 mb-2">No Wishlist Items Yet</h3>
                <p className="text-sm text-neutral-500 mb-6">When you save items to your wishlist, they will appear here.</p>
                <Link
                    href="/product-list"
                    className="bg-neutral-900 text-white rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-neutral-800 transition-colors inline-block"
                >
                    Explore Shop
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <h2 className="text-xl sm:text-2xl font-bold font-clashDisplay text-neutral-900">My Wishlist</h2>
                <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full">
                    {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"}
                </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistItems.map((item) => (
                    <div
                        key={item.id || item._id}
                        className="border border-neutral-200 rounded-2xl overflow-hidden group flex flex-col justify-between bg-white hover:border-neutral-300 transition-colors"
                    >
                        <div className="relative aspect-square w-full bg-neutral-100 overflow-hidden">
                            <Image
                                src={getImageUrl(item.image || item.images?.[0])}
                                alt={item.name || item.title || "Product"}
                                fill
                                unoptimized
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <button
                                onClick={() => removeFromWishlist(item)}
                                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-neutral-600 hover:text-red-600 hover:bg-white transition-colors shadow-xs cursor-pointer"
                                aria-label="Remove from wishlist"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                            <div>
                                <h4 className="font-bold text-neutral-900 text-sm line-clamp-1">{item.name || item.title}</h4>
                                <p className="text-xs font-medium text-neutral-500 mt-1">{item.price}</p>
                            </div>
                            <button
                                onClick={() => addToCart(item)}
                                className="w-full bg-neutral-900 text-white rounded-xl py-2.5 text-xs font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                Add to Cart
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
