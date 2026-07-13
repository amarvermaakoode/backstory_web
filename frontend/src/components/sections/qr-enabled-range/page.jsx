"use client";

import React from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

export default function QrEnabledRange() {
    const categories = [
        {
            id: "t-shirts",
            name: "T-Shirts",
            image: "/images/landing-page/first.png",
            link: "#shop",
        },
        {
            id: "hoodies",
            name: "Hoodies",
            image: "/images/landing-page/second.png",
            link: "#shop",
        },
        {
            id: "accessories",
            name: "Accessories",
            image: "/images/landing-page/third.png",
            link: "#shop",
        },
        {
            id: "more",
            name: "More...",
            image: "/images/landing-page/pants.png",
            link: "#shop",
        },
    ];

    return (
        <section className="w-full bg-[#050505] overflow-hidden">
            {/* Header Banner with Cream Background */}
            <div className="bg-[#EFECE7] py-5 lg:py-10 px-4 sm:px-8 flex items-center">

                <div className="mx-auto max-w-[98%] w-full">
                    <h2 className="font-clashDisplay text-3xl md:text-[3vw] font-semibold tracking-tight text-[#030303] select-none">
                        Explore our<br className="lg:hidden" /> QR-Enabled Range
                    </h2>
                </div>
            </div>

            {/* Grid of Categories */}
            <div className="grid grid-cols-2 lg:grid-cols-4 w-full h-[80vh] gap-px bg-neutral-900 ">
                {categories.map((category) => (
                    <a
                        key={category.id}
                        href={category.link}
                        className="group relative h-full w-full overflow-hidden flex items-center justify-center cursor-pointer bg-black"
                    >
                        {/* Background Image */}
                        <div className="absolute inset-0 overflow-hidden">
                            <Image
                                src={category.image}
                                alt={category.name}
                                fill
                                priority
                                className={`object-cover object-center select-none transition-transform duration-1000 ease-out ${category.id === "t-shirts" ? "scale-200" : category.id === "hoodies"
                                    ? "scale-160 group-hover:scale-165"
                                    : "scale-100 group-hover:scale-105"
                                    }`}
                            />
                            {/* Dark Overlay gradient for premium readability */}
                            {category.id === "more" ? (
                                <div
                                    className="absolute inset-0 opacity-80 transition-all duration-500 group-hover:opacity-70"
                                    style={{
                                        background: "linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(0deg, #070A0E, #070A0E)"
                                    }}
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-black/0 transition-all duration-500 group-hover:via-black/20 group-hover:to-black/40" />
                            )}
                        </div>

                        {/* Content (Text Centered) */}
                        <div className="relative z-10 text-center px-6 flex flex-col items-center justify-center h-full w-full">

                            {/* Main Category Title */}
                            <h3 className="font-clashDisplay text-2xl font-semibold tracking-wide text-white transition-all duration-700 ease-out group-hover:scale-95">
                                {category.name}
                            </h3>
                        </div>

                    </a>
                ))}
            </div>
        </section>
    );
}
