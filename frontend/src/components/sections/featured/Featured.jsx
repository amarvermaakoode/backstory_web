"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, Plus } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { allProducts } from "@/data/products";
import Button from "@/components/ui/Button";

const API_BASE_URL = "http://localhost:5000/api";

const defaultProducts = [
    {
        id: "lost-on-purpose",
        name: "Lost on Purpose",
        price: "Rs 1100",
        priceNum: 1100,
        image: "/images/landing-page/featured3.png",
        hoverImage: "",
        sizes: ["S", "M", "L"],
        colors: [{ name: "Default", hex: "#CCCCCC" }],
        tag: "Travel Series",
        link: "#shop"
    },
    {
        id: "miles-over-words",
        name: "Miles Over Words",
        price: "Rs 1090",
        priceNum: 1090,
        image: "/images/landing-page/biker-tshirt.png",
        hoverImage: "",
        sizes: ["S", "M", "L"],
        colors: [{ name: "Default", hex: "#CCCCCC" }],
        tag: "Biker Series",
        link: "#shop"
    },
    {
        id: "coding-t-shirt",
        name: "Coding T-Shirt",
        price: "Rs 990",
        priceNum: 990,
        image: "/images/landing-page/coding-tshirt.png",
        hoverImage: "",
        sizes: ["S", "M", "L"],
        colors: [{ name: "Default", hex: "#CCCCCC" }],
        tag: "Coding Series",
        link: "#shop"
    },
];

export default function FeaturedProducts() {
    const { addToCart } = useCart();
    const { toggleWishlist, wishlistItems } = useWishlist();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/frontend/products/featured`);
                const data = await res.json();
                if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
                    const mapped = data.data.map(item => {
                        const colorsList = (item.colors || []).map(c => ({
                            name: c.color?.name || "Default",
                            hex: c.color?.hexCode || "#CCCCCC"
                        }));
                        const sizesList = item.sizeGuide?.chart?.map(sz => sz.size) || ["S", "M", "L"];
                        const mainImg = item.colors?.[0]?.images?.[0] || "";
                        const hoverImg = item.colors?.[0]?.images?.[1] || item.colors?.[1]?.images?.[0] || "";

                        return {
                            id: item._id,
                            name: item.title,
                            price: `Rs ${item.price}`,
                            priceNum: Number(item.price),
                            image: mainImg,
                            hoverImage: hoverImg,
                            sizes: sizesList,
                            colors: colorsList,
                            tag: item.subCategory?.name || item.category?.Name || "Featured",
                            link: `/products/${item._id}`
                        };
                    });
                    setProducts(mapped);
                } else {
                    setProducts(defaultProducts);
                }
            } catch (err) {
                console.error("Failed to fetch featured products:", err);
                setProducts(defaultProducts);
            } finally {
                setLoading(false);
            }
        };

        fetchFeatured();
    }, []);

    const getImageUrl = (path) => {
        if (!path) return "/images/placeholder.png";
        if (path.startsWith("http") || path.startsWith("data:")) return path;
        if (path.startsWith("/images/")) return path;
        return `http://localhost:5000${path.startsWith("/") ? "" : "/"}${path}`;
    };

    return (
        <section className="w-full bg-[#FFFFFF] py-10 md:py-10 px-6 sm:px-10 md:px-16 lg:px-[4%] select-none text-black">
            <div className="mx-auto max-w-[1600px] space-y-8">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <h2 className="font-clashDisplay text-3xl md:text-[3.3vw] font-semibold tracking-tight">
                        Featured Products
                    </h2>
                    <Button href="/featured-products" hasArrow={false} variant="outline">
                        See All
                    </Button>
                </div>

                {/* Grid layout for featured products on desktop, carousel on mobile */}
                <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-8 overflow-x-auto md:overflow-visible no-scrollbar pb-4 md:pb-0">
                    <style>{`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .no-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>
                    {products.map((product) => (
                        <Link
                            key={product.id}
                            href={`/products/${product.id}`}
                            className="group w-[50vw] md:w-auto shrink-0 flex flex-col cursor-pointer"
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
                                        className={`h-5 w-5 transition-all ${wishlistItems.some(item => item.id === product.id || item.name.toLowerCase() === product.name.toLowerCase())
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
                                <div>
                                    <h3 className="font-sans text-base md:text-lg font-medium text-black">
                                        {product.name}
                                    </h3>
                                    <p className="font-clashDisplay text-lg md:text-[2vw] leading-[1.3] font-semibold text-black">
                                        {product.price}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        addToCart(product, 1);
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
        </section>
    );
}
