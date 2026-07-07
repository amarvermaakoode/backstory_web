"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Heart, Plus, ChevronLeft, ChevronRight } from "lucide-react";

export default function Collections() {
    const products = [
        {
            id: "built-in-public",
            name: "Built in Public",
            price: "Rs 1200",
            image: "/images/landing-page/featured11.png",
            link: "#shop",
        },
        {
            id: "life-through-my-lenses",
            name: "Life Through My Lenses",
            price: "Rs 1100",
            image: "/images/landing-page/featured2.png",
            link: "#shop",
        },
        {
            id: "lost-on-purpose",
            name: "Lost on Purpose",
            price: "Rs 1100",
            image: "/images/landing-page/featured3.png",
            link: "#shop",
        },
        {
            id: "built-in-public-2",
            name: "Built in Public (Alternate)",
            price: "Rs 1200",
            image: "/images/landing-page/featured11.png",
            link: "#shop",
        },
        {
            id: "life-through-my-lenses-2",
            name: "Life Through My Lenses (Alternate)",
            price: "Rs 1100",
            image: "/images/landing-page/featured2.png",
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

    // Carousel Ref
    const carouselRef = useRef(null);

    const scroll = (direction) => {
        if (carouselRef.current) {
            const cardWidth = 380; // card width + gap
            const scrollAmount = direction === "left" ? -cardWidth : cardWidth;
            carouselRef.current.scrollBy({
                left: scrollAmount,
                behavior: "smooth",
            });
        }
    };

    return (
        <section className="relative w-full bg-[#FFFFFF] xmd:py-16 py-8 pl-6 sm:pl-10 md:pl-16 lg:pl-[4%] select-none">
            <div className=" max-w-full flex flex-col md:flex-row gap-12 md:gap-16 items-start">

                {/* Left Content (Static) */}
                <div className="w-full md:w-[38%] lg:w-[35%] flex flex-col justify-between self-stretch">
                    <div>
                        <h2 className="font-clashDisplay text-3xl md:text-4xl font-semibold tracking-tight text-[#030303] select-none">
                            Shop our<br />Latest Collection
                        </h2>
                        <p className="text-black font-geist text-base md:text-xl md:mt-4 mt-2 leading-relaxed font-medium">
                            Inspired by journeys.<br />Designed to be remembered.
                        </p>
                        <a
                            href="#shop"
                            className="inline-block md:mt-8 mt-4 border-2 border-black text-black font-semibold rounded-full px-6 py-2.5 hover:bg-black hover:text-white transition-colors duration-300 text-sm cursor-pointer"
                        >
                            Shop Now
                        </a>
                    </div>
                </div>

                {/* Right Carousel Column */}
                <div className="w-full md:w-[62%] lg:w-[65%]  relative">
                    <style>{`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .no-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>

                    <div
                        ref={carouselRef}
                        className="flex md:gap-6 gap-4 overflow-x-auto scroll-smooth no-scrollbar pb-4"
                    >
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="group md:w-[24vw] w-[34vw] shrink-0 flex flex-col cursor-pointer"
                            >
                                {/* Card Body (Image Container) */}
                                <div className="relative w-full aspect-square bg-[#F4F0EA] flex items-center justify-center overflow-hidden">
                                    <div className="relative w-[90%] h-[90%] transition-transform duration-500 ease-out group-hover:scale-105">
                                        <Image
                                            src={product.image}
                                            alt={product.name}
                                            fill
                                            sizes="(max-width: 768px) 280px, 350px"
                                            className="object-contain select-none"
                                        />
                                    </div>

                                    {/* Favorite Heart Button */}
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleFavorite(product.id);
                                        }}
                                        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                                        aria-label="Add to favorites"
                                    >
                                        <Heart
                                            className={`h-5 w-5 transition-all ${favorites[product.id]
                                                ? "fill-red-500 text-red-500"
                                                : "text-black stroke-[1.5]"
                                                }`}
                                        />
                                    </button>
                                </div>

                                {/* Product Info (Below Card) */}
                                <div className="md:mt-4 mt-2 flex justify-between items-start">
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
                                        className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 text-black hover:bg-neutral-200 transition-colors cursor-pointer"
                                        aria-label="Add to cart"
                                    >
                                        <Plus className="h-4 w-4 stroke-[2]" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Right Edge Gradient Overlay & Next Button */}
            <div
                className="absolute hidden md:block right-0 top-0 bottom-0 w-28 z-20 pointer-events-none flex items-center justify-end pr-4"
                style={{
                    background: "linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.21) 100%)"
                }}
            >
                <button
                    onClick={() => scroll("right")}
                    className="pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full bg-white text-black hover:bg-neutral-200 transition-colors shadow-lg cursor-pointer"
                    aria-label="Scroll right"
                >
                    <ChevronRight className="h-6 w-6 stroke-[2]" />
                </button>
            </div>
        </section>
    );
}
