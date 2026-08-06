"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { API_BASE_URL, getImageUrl } from "@/lib/api";

export default function ShopByTribe() {
    const [subCategories, setSubCategories] = useState([]);

    useEffect(() => {
        const fetchSubCategories = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/frontend/sub-categories`);
                const data = await res.json();
                if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
                    setSubCategories(data.data);
                } else {
                    setSubCategories([]);
                }
            } catch (err) {
                console.error("Failed to fetch landing subcategories/tribes:", err);
                setSubCategories([]);
            }
        };

        fetchSubCategories();
    }, []);

    const activeTribes = subCategories;

    return (
        <section className="w-full bg-[#F4F0EA] py-8 px-6 sm:px-10 md:px-16 lg:px-[4%] text-black overflow-hidden">
            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            <div className="mx-auto max-w-[1600px] space-y-8">
                {/* Header */}
                <div>
                    <h2 className="heading-section">
                        Shop by Tribe
                    </h2>
                </div>

                {/* Flex Accordion of Tribes (Horizontal scroll on mobile, contiguous on desktop) */}
                <div className="-mx-6 sm:-mx-10 md:mx-0 px-6 sm:px-10 md:px-0 flex overflow-x-auto md:overflow-visible no-scrollbar gap-0 md:gap-0 pb-2 md:pb-0">
                    {activeTribes.map((tribe) => (
                        <Link
                            key={tribe._id}
                            href={`/product-list/tribe/${tribe.slug || tribe._id}`}
                            className="group relative block w-[75vw] sm:w-[50vw] md:w-full shrink-0 h-[380px] md:h-[550px] md:flex-1 md:hover:flex-[2.2] transition-all duration-700 ease-in-out overflow-hidden cursor-pointer"
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
                                <h3 className="heading-sub text-white">
                                    {tribe.name}
                                </h3>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
