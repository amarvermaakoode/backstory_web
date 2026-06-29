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
            // tag: "Interact & Wear",
        },
        {
            id: "hoodies",
            name: "Hoodies",
            image: "/images/landing-page/second.png",
            link: "#shop",
            // tag: "Narrative Knits",
        },
        {
            id: "accessories",
            name: "Accessories",
            image: "/images/landing-page/third.png",
            link: "#shop",
            // tag: "Digital Details",
        },
    ];

    return (
        <section className="w-full bg-[#050505] overflow-hidden">
            {/* Header Banner with Cream Background */}
            <div className="bg-[#EFECE7] py-10 px-6 sm:px-8 flex items-center">
                <div className="mx-auto max-w-[98%] w-full">
                    <h2 className="font-clashDisplay text-4xl font-semibold tracking-tight text-[#030303] select-none">
                        Explore our QR-Enabled Range
                    </h2>
                </div>
            </div>

            {/* Grid of Categories */}
            <div className="grid grid-cols-1 md:grid-cols-3 w-full h-[80vh] md:h-[80vh]">
                {categories.map((category) => (
                    <a
                        key={category.id}
                        href={category.link}
                        className="group relative h-full w-full overflow-hidden flex items-center justify-center cursor-pointer border-b md:border-b-0 md:border-r border-neutral-900 last:border-0"
                    >
                        {/* Background Image */}
                        <div className="absolute inset-0 transition-transform duration-1000 ease-out group-hover:scale-105">
                            <Image
                                src={category.image}
                                alt={category.name}
                                fill
                                priority
                                className="object-cover object-center select-none"
                            />
                            {/* Dark Overlay gradient for premium readability */}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-black/0 transition-all duration-500 group-hover:via-black/20 group-hover:to-black/40" />
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
