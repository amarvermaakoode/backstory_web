"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

const defaultTribes = [
    {
        _id: "coders",
        name: "Coders",
        image: "/images/landing-page/tribe1.png",
    },
    {
        _id: "bikers",
        name: "Bikers",
        image: "/images/landing-page/tribe2.png",
    },
    {
        _id: "nomad",
        name: "Nomad",
        image: "/images/landing-page/tribe3.png",
    },
    {
        _id: "techies",
        name: "Techies",
        image: "/images/landing-page/tribe4.png",
    },
];

export default function ShopByTribe() {
    const [subCategories, setSubCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubCategories = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/frontend/sub-categories`);
                const data = await res.json();
                if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
                    setSubCategories(data.data);
                } else {
                    setSubCategories(defaultTribes);
                }
            } catch (err) {
                console.error("Failed to fetch landing subcategories/tribes:", err);
                setSubCategories(defaultTribes);
            } finally {
                setLoading(false);
            }
        };

        fetchSubCategories();
    }, []);

    const getImageUrl = (path) => {
        if (!path) return "/images/placeholder.png";
        if (path.startsWith("http") || path.startsWith("data:")) return path;
        
        // Local public assets start with /images/
        if (path.startsWith("/images/")) return path;
        
        // Backend upload asset
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        return `${apiBase}${path.startsWith("/") ? "" : "/"}${path}`;
    };

    const activeTribes = subCategories.length > 0 ? subCategories : defaultTribes;

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
                    {activeTribes.map((tribe) => (
                        <a
                            key={tribe._id}
                            href={`#shop?tribe=${tribe._id}`}
                            className="group relative block w-full h-[250px] md:h-[550px] flex-1 md:hover:flex-[2.2] transition-all duration-700 ease-in-out overflow-hidden cursor-pointer"
                        >
                            {/* Background Image */}
                            <div className="absolute inset-0 transition-transform duration-1000 ease-out group-hover:scale-105">
                                <Image
                                    src={getImageUrl(tribe.image)}
                                    alt={tribe.name}
                                    fill
                                    priority
                                    unoptimized
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
