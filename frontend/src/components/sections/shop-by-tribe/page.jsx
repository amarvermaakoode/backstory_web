"use client";

import React from "react";
import Image from "next/image";

export default function ShopByTribe() {
    const tribes = [
        {
            id: "coders",
            name: "Coders",
            image: "/images/landing-page/tribe1.png",
            link: "#shop?tribe=coders",
        },
        {
            id: "bikers",
            name: "Bikers",
            image: "/images/landing-page/tribe2.png",
            link: "#shop?tribe=bikers",
        },
        {
            id: "nomad",
            name: "Nomad",
            image: "/images/landing-page/tribe3.png",
            link: "#shop?tribe=nomad",
        },
        {
            id: "techies",
            name: "Techies",
            image: "/images/landing-page/tribe4.png",
            link: "#shop?tribe=techies",
        },
    ];

    return (
        <section className="w-full bg-[#F4F0EA] py-8 px-6 sm:px-10 md:px-16 lg:px-[4%] select-none text-black">
            <div className="mx-auto max-w-[1600px] space-y-8">
                {/* Header */}
                <div>
                    <h2 className="font-clashDisplay text-3xl md:text-[3.5vw] font-semibold tracking-tight">
                        Shop by Tribe
                    </h2>
                </div>

                {/* Flex Accordion of Tribes (Contiguous, no gap) */}
                <div className="flex flex-col md:flex-row w-full overflow-hidden">
                    {tribes.map((tribe) => (
                        <a
                            key={tribe.id}
                            href={tribe.link}
                            className="group relative block w-full h-[250px] md:h-[550px] flex-1 md:hover:flex-[2.2] transition-all duration-700 ease-in-out overflow-hidden cursor-pointer"
                        >
                            {/* Background Image */}
                            <div className="absolute inset-0 transition-transform duration-1000 ease-out group-hover:scale-105">
                                <Image
                                    src={tribe.image}
                                    alt={tribe.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 25vw"
                                    className="object-cover object-center select-none"
                                />
                            </div>

                            {/* Top-to-Bottom Gradient Overlay for Text Readability */}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30 opacity-90 group-hover:opacity-105 transition-opacity duration-500" />

                            {/* Tribe Name Overlay (Top Left) */}
                            <div className="absolute top-8 left-8 z-10">
                                <h3 className="font-clashDisplay text-2xl md:text-3xl font-semibold text-white tracking-wide">
                                    {tribe.name}
                                </h3>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
