"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { API_BASE_URL, getImageUrl } from "@/lib/api";

export default function QrEnabledRange() {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/frontend/categories`);
                const data = await res.json();
                if (data && data.success && Array.isArray(data.data)) {
                    setCategories(data.data);
                } else {
                    setCategories([]);
                }
            } catch (err) {
                console.error("Failed to fetch landing categories:", err);
                setCategories([]);
            }
        };

        fetchCategories();
    }, []);

    // Show only the latest 3 categories
    const displayCategories = [...categories]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 3);

    if (displayCategories.length === 0) {
        return null;
    }

    return (
        <section className="w-full bg-[#050505] overflow-hidden">
            {/* Header Banner with Cream Background */}
            <div className="bg-[#EFECE7] py-5 lg:py-10 px-4 sm:px-8 flex items-center">
                <div className="mx-auto max-w-[98%] w-full">
                    <h2 className="heading-section text-[#030303]">
                        Explore our<br className="lg:hidden" /> QR-Enabled Range
                    </h2>
                </div>
            </div>

            {/* Grid of Exactly 3 Categories (Latest first) */}
            <div className="grid grid-cols-1 md:grid-cols-3 w-full h-auto md:h-[80vh] gap-px bg-neutral-900">
                {displayCategories.map((category) => (
                    <Link
                        key={category._id}
                        href={`/product-list/range/${category.slug || category._id}`}
                        className="group relative h-[300px] md:h-full w-full overflow-hidden flex items-center justify-center cursor-pointer bg-black"
                    >
                        {/* Background Image */}
                        <div className="absolute inset-0 overflow-hidden">
                            <Image
                                src={getImageUrl(category.image)}
                                alt={category.Name}
                                fill
                                priority
                                unoptimized
                                className="object-cover object-center select-none transition-transform duration-1000 ease-out group-hover:scale-105"
                            />
                            {/* Dark Gradient Overlay for Readability */}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60 transition-all duration-500 group-hover:via-black/30 group-hover:to-black/75" />
                        </div>

                        {/* Content (Text Centered) */}
                        <div className="relative z-10 text-center px-6 flex flex-col items-center justify-center h-full w-full">
                            <h3 className="heading-sub text-white transition-all duration-700 ease-out group-hover:scale-95 drop-shadow-md">
                                {category.Name}
                            </h3>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
