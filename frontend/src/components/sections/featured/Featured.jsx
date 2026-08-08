"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, Plus } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import Button from "@/components/ui/Button";
import ProductCard from "@/components/ui/ProductCard";
import SelectOptionsModal from "@/components/ui/SelectOptionsModal";
import { API_BASE_URL, getImageUrl } from "@/lib/api";
import { mapProductItem } from "@/services/productService";

export default function FeaturedProducts() {
    const { addToCart } = useCart();
    const { toggleWishlist, wishlistItems } = useWishlist();
    const [products, setProducts] = useState([]);
    const [selectedProductForOptions, setSelectedProductForOptions] = useState(null);

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/frontend/products/featured`);
                const data = await res.json();
                if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
                    const mapped = data.data.map(mapProductItem);
                    setProducts(mapped);
                } else {
                    setProducts([]);
                }
            } catch (err) {
                console.error("Failed to fetch featured products:", err);
                setProducts([]);
            }
        };

        fetchFeatured();
    }, []);

    const handleConfirmAddToCart = (prod, quantity, size, color) => {
        addToCart(prod, quantity, size, color);
    };

    return (
        <section className="w-full bg-[#FFFFFF] py-10 md:py-16 md:px-16 lg:px-[4%] text-black overflow-hidden">
            <div className="mx-auto max-w-[1600px] space-y-8">
                {/* Header Section */}
                <div className="flex items-center justify-between px-6 sm:px-10 md:px-0">
                    <h2 className="heading-section">
                        Featured Products
                    </h2>
                    <Button href="/product-list" hasArrow={false} variant="outline" className="whitespace-nowrap">
                        See All
                    </Button>
                </div>

                {/* Grid layout for featured products on desktop, carousel on mobile */}
                <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-8 overflow-x-auto md:overflow-visible no-scrollbar pb-4 md:pb-0 pl-6 sm:pl-10 md:pl-0 pr-6 sm:pr-10 md:pr-0">
                    <style jsx global>{`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .no-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>
                    {products.slice(0, 3).map((product) => (
                        <Link
                            key={product.id}
                            href={product.link || `/products/${product.slug || product.id}`}
                            className="group w-[75vw] sm:w-[60vw] md:w-auto shrink-0 flex flex-col cursor-pointer"
                        >
                            {/* Image Container Card */}
                            <div className="relative w-full aspect-square bg-[#F4F0EA] flex items-center justify-center overflow-hidden">
                                {/* Tag label on top-left */}
                                <div className="absolute top-4 left-4 z-10 bg-[#101820] text-white text-[10px] md:text-xs font-light tracking-tight px-2 py-1 rounded-full uppercase">
                                    {product.tag}
                                </div>

                                {/* Favorite Heart Button */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleWishlist(product);
                                    }}
                                    className="absolute top-2 md:top-4 right-2 md:right-4 z-10 transition-colors cursor-pointer"
                                    aria-label="Add to favorites"
                                >
                                    <Heart
                                        className={`h-5 w-5 transition-all ${wishlistItems.some(item => item.id === product.id)
                                            ? "fill-red-500 text-red-500 stroke-red-500"
                                            : "text-black stroke-[1.5]"
                                            }`}
                                    />
                                </button>

                                {/* Product Image */}
                                <div className="relative w-[85%] h-[85%] transition-transform duration-500 ease-out group-hover:scale-105">
                                    <Image
                                        src={getImageUrl(product.image)}
                                        alt={product.name}
                                        fill
                                        sizes="(max-width: 768px) 38vw, 33vw"
                                        className="object-contain select-none"
                                        priority
                                        unoptimized
                                    />
                                </div>
                            </div>

                            {/* Product Info (Below Card) */}
                            <div className="mt-2 md:mt-4 ml-3 flex justify-between items-end">
                                <div className="min-w-0">
                                    <h3 className="font-sans text-sm sm:text-base md:text-lg font-normal text-black leading-snug truncate">
                                        {product.name}
                                    </h3>
                                    <p className="font-clashDisplay text-base sm:text-xl md:text-2xl font-semibold text-black mt-0.5">
                                        {product.price}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedProductForOptions(product);
                                    }}
                                    className="flex items-center justify-center w-8 h-8 mr-3 rounded-full bg-[#F0EEE9] text-black hover:bg-neutral-200 transition-colors cursor-pointer"
                                    aria-label="Add to cart"
                                >
                                    <Plus className="h-4 w-4 stroke-[2]" />
                                </button>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <SelectOptionsModal
                isOpen={!!selectedProductForOptions}
                onClose={() => setSelectedProductForOptions(null)}
                product={selectedProductForOptions}
                onConfirmAddToCart={handleConfirmAddToCart}
            />
        </section>
    );
}
