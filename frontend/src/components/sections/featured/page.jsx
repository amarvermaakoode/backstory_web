"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Heart, Plus } from "lucide-react";
import Link from "next/link";

export default function FeaturedProducts() {
    const products = [
        {
            id: "lost-on-purpose",
            name: "Lost on Purpose",
            price: "Rs 1100",
            image: "/images/landing-page/featured3.png",
            tag: "Travel Series",
            link: "#shop",
        },
        {
            id: "miles-over-words",
            name: "Miles Over Words",
            price: "Rs 1090",
            image: "/images/landing-page/biker-tshirt.png",
            tag: "Biker Series",
            link: "#shop",
        },
        {
            id: "coding-t-shirt",
            name: "Coding T-Shirt",
            price: "Rs 990",
            image: "/images/landing-page/coding-tshirt.png",
            tag: "Coding Series",
            link: "#shop",
        },
    ];

    // State for favorites
    const [favorites, setFavorites] = useState({});

    const toggleFavorite = (id) => {
        setFavorites((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    return (
        <section className="w-full bg-[#FFFFFF] py-10 md:py-20 px-6 sm:px-10 md:px-16 lg:px-[4%] select-none text-black">
            <div className="mx-auto max-w-[1600px] space-y-12">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <h2 className="font-clashDisplay text-3xl md:text-4xl font-semibold tracking-tight">
                        Featured Products
                    </h2>
                    <Link
                        href="/featured-products"
                        className="border-2 border-black text-black font-semibold rounded-full px-5 py-1.5 hover:bg-black whitespace-nowrap hover:text-white transition-colors duration-300 text-sm cursor-pointer"
                    >
                        See All
                    </Link>
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
                                <div className="absolute top-4 left-4 z-10 bg-[#101820] text-white text-[10px] md:text-sm font-normal tracking-wider px-3 py-1 rounded-full uppercase">
                                    {product.tag}
                                </div>

                                {/* Favorite Heart Button */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleFavorite(product.id);
                                    }}
                                    className="absolute top-2 md:top-4 right-2 md:right-4 z-10 p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                                    aria-label="Add to favorites"
                                >
                                    <Heart
                                        className={`h-5 w-5 transition-all ${favorites[product.id]
                                            ? "fill-red-500 text-red-500"
                                            : "text-black stroke-[1.5]"
                                            }`}
                                    />
                                </button>

                                {/* Product Image */}
                                <div className="relative w-[85%] h-[85%] transition-transform duration-500 ease-out group-hover:scale-105">
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        fill
                                        sizes="(max-width: 768px) 38vw, 33vw"
                                        className="object-contain select-none"
                                        priority
                                    />
                                </div>
                            </div>

                            {/* Product Info (Below Card) */}
                            <div className="mt-2 md:mt-4 flex justify-between items-start">
                                <div>
                                    <h3 className="font-sans text-base md:text-lg font-medium text-black">
                                        {product.name}
                                    </h3>
                                    <p className="font-sans text-lg md:text-xl font-bold text-black mt-1">
                                        {product.price}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    className="flex items-center justify-center w-8 h-8 mr-2 rounded-full bg-neutral-100 text-black hover:bg-neutral-200 transition-colors cursor-pointer"
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
