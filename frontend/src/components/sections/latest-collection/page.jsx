"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { allProducts } from "@/app/products/products";
import Button from "@/components/ui/Button";

export default function Collections() {
    const { addToCart } = useCart();
    const { toggleWishlist, wishlistItems } = useWishlist();
    const products = [
        {
            id: "built-in-public",
            name: "Built in Public",
            price: "Rs 1200",
            image: "/images/landing-page/featured11.png",
            hoverImage: "/images/person-image-1-removebg-preview.png",
            link: "#shop",
        },
        {
            id: "life-through-my-lenses",
            name: "Life Through My Lenses",
            price: "Rs 1100",
            image: "/images/landing-page/featured2.png",
            hoverImage: "/images/person-image-2-removebg-preview.png",
            link: "#shop",
        },
        {
            id: "lost-on-purpose",
            name: "Lost on Purpose",
            price: "Rs 1100",
            image: "/images/landing-page/featured3.png",
            hoverImage: "/images/person-image-3-removebg-preview.png",
            link: "#shop",
        },
        {
            id: "built-in-public-2",
            name: "Built in Public (Alternate)",
            price: "Rs 1200",
            image: "/images/landing-page/featured11.png",
            hoverImage: "/images/person-image-1-removebg-preview.png",
            link: "#shop",
        },
        {
            id: "life-through-my-lenses-2",
            name: "Life Through My Lenses (Alternate)",
            price: "Rs 1100",
            image: "/images/landing-page/featured2.png",
            hoverImage: "/images/person-image-2-removebg-preview.png",
            link: "#shop",
        },
    ];

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
            <div className=" max-w-full flex flex-col md:flex-row gap-12 md:gap-14 items-start">

                {/* Left Content (Static) */}
                <div className="w-full md:w-[38%] lg:w-[35%] flex flex-col justify-between self-stretch">
                    <div>
                        <h2 className="font-clashDisplay text-3xl md:text-[3.5vw] font-semibold tracking-tight text-[#030303] select-none">
                            Shop our<br />Latest Collection
                        </h2>
                        <p className="text-black font-geist text-base md:text-[1.8vw] md:mt-2 mt-2 leading-tight font-normal">
                            Inspired by journeys.<br />Designed to be remembered.
                        </p>
                        <Button href="#shop" hasArrow={false} variant="outline" className="md:mt-6 mt-4">
                            Shop Now
                        </Button>
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
                            <Link
                                key={product.id}
                                href={`/products/${product.id}`}
                                className="group md:w-[24vw] w-[50vw] shrink-0 flex flex-col cursor-pointer"
                            >
                                {/* Card Body (Image Container) */}
                                <div className="relative w-full aspect-square bg-[#F4F0EA] flex items-center justify-center overflow-hidden">
                                    {/* Default Image (Front Flat Layout) */}
                                    <div className="absolute w-[90%] h-[90%] transition-all duration-200 ease-out group-hover:scale-105 opacity-100 group-hover:opacity-0">
                                        <Image
                                            src={product.image}
                                            alt={product.name}
                                            fill
                                            sizes="(max-width: 768px) 280px, 350px"
                                            className="object-contain select-none"
                                        />
                                    </div>

                                    {/* Hover Image (Person Wearing Layout) */}
                                    {product.hoverImage && (
                                        <div className="absolute inset-0 transition-all duration-500 ease-out group-hover:scale-105 opacity-0 group-hover:opacity-100">
                                            <Image
                                                src={product.hoverImage}
                                                alt={product.name}
                                                fill
                                                sizes="(max-width: 768px) 280px, 350px"
                                                className="object-contain object-center select-none"
                                            />
                                        </div>
                                    )}

                                    {/* Favorite Heart Button */}
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const fullProduct = allProducts.find(
                                                p => p.id === product.id ||
                                                    p.id.replace("-1", "") === product.id ||
                                                    p.name.toLowerCase() === product.name.toLowerCase()
                                            ) || allProducts[0];
                                            toggleWishlist(fullProduct);
                                        }}
                                        className="absolute top-4 right-4 z-10 p-0 bg-transparent backdrop-blur-xs rounded-full hover:scale-110 transition-all duration-300 cursor-pointer"
                                        aria-label="Add to favorites"
                                    >
                                        <Heart
                                            className={`h-6 w-6 transition-colors ${wishlistItems.some(item => item.name.toLowerCase() === product.name.toLowerCase())
                                                ? "fill-red-500 text-red-500 stroke-red-500"
                                                : "text-black stroke-[1.5]"
                                                }`}
                                        />
                                    </button>
                                </div>

                                {/* Product Info (Below Card) */}
                                <div className="md:mt-4 mt-2 mr-4 ml-3 flex justify-between items-end">
                                    <div>
                                        <h3 className="font-sans text-base md:text-lg font-medium text-black">
                                            {product.name}
                                        </h3>
                                        <p className="font-sans text-lg md:text-[2vw] leading-[1.3] font-bold text-black">
                                            {product.price}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const fullProduct = allProducts.find(
                                                p => p.id === product.id ||
                                                    p.id.replace("-1", "") === product.id ||
                                                    p.name.toLowerCase() === product.name.toLowerCase()
                                            ) || allProducts[0];
                                            addToCart(fullProduct, 1);
                                        }}
                                        className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F0EEE9] text-black hover:bg-neutral-200 transition-colors cursor-pointer"
                                        aria-label="Add to cart"
                                    >
                                        <Plus className="h-4 w-4 stroke-[2]" />
                                    </button>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Right Edge Gradient Overlay & Next Button */}
                    <div
                        className="absolute hidden md:block right-0 top-0 w-28 z-20 pointer-events-none"
                        style={{
                            height: "24vw",
                            background: "linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.21) 100%)"
                        }}
                    >
                        <button
                            onClick={() => scroll("right")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full bg-white text-black hover:bg-neutral-200 transition-colors shadow-lg cursor-pointer"
                            aria-label="Scroll right"
                        >
                            <ChevronRight className="h-6 w-6 stroke-[2]" />
                        </button>
                    </div>
                </div>

            </div>
        </section>
    );
}
