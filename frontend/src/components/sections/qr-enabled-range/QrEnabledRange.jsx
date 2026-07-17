"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

const defaultCategories = [
    {
        _id: "t-shirts",
        Name: "T-Shirts",
        image: "/images/landing-page/first.png",
    },
    {
        _id: "hoodies",
        Name: "Hoodies",
        image: "/images/landing-page/second.png",
    },
    {
        _id: "accessories",
        Name: "Accessories",
        image: "/images/landing-page/third.png",
    },
    {
        _id: "more",
        Name: "More...",
        image: "/images/landing-page/pants.png",
    },
];

export default function QrEnabledRange() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/frontend/categories`);
                const data = await res.json();
                if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
                    // If there are less than 4 categories but we need a 4th on mobile,
                    // we can pad with "More..." fallback
                    let fetchedList = [...data.data];
                    if (fetchedList.length === 3) {
                        fetchedList.push({
                            _id: "more",
                            Name: "More...",
                            image: "/images/landing-page/pants.png"
                        });
                    }
                    setCategories(fetchedList);
                } else {
                    setCategories(defaultCategories);
                }
            } catch (err) {
                console.error("Failed to fetch landing categories:", err);
                setCategories(defaultCategories);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const getImageUrl = (path) => {
        if (!path) return "/images/placeholder.png";
        if (path.startsWith("http") || path.startsWith("data:")) return path;
        
        // If it's a local public asset path, keep it relative
        if (path.startsWith("/images/")) return path;
        
        // Otherwise, resolve against backend server
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        return `${apiBase}${path.startsWith("/") ? "" : "/"}${path}`;
    };

    return (
        <section className="w-full bg-[#050505] overflow-hidden">
            {/* Header Banner with Cream Background */}
            <div className="bg-[#EFECE7] py-5 lg:py-10 px-4 sm:px-8 flex items-center">
                <div className="mx-auto max-w-[98%] w-full">
                    <h2 className="heading-section text-[#030303] select-none">
                        Explore our<br className="lg:hidden" /> QR-Enabled Range
                    </h2>
                </div>
            </div>

            {/* Grid of Categories */}
            <div className="grid grid-cols-2 md:grid-cols-3 w-full h-[80vh] gap-px bg-neutral-900">
                {categories.slice(0, 4).map((category, index) => {
                    const isFirst = index === 0;
                    const isSecond = index === 1;
                    const isFourth = index === 3;

                    const scaleClass = isFirst 
                        ? "scale-200 group-hover:scale-205" 
                        : isSecond 
                        ? "scale-160 group-hover:scale-165" 
                        : "scale-100 group-hover:scale-105";

                    const itemClass = isFourth ? "md:!hidden" : "";

                    return (
                        <Link
                            key={category._id}
                            href={`/product-list/range/${category.slug || category._id}`}
                            className={`group relative h-full w-full overflow-hidden flex items-center justify-center cursor-pointer bg-black ${itemClass}`}
                        >
                            {/* Background Image */}
                            <div className="absolute inset-0 overflow-hidden">
                                <Image
                                    src={getImageUrl(category.image)}
                                    alt={category.Name}
                                    fill
                                    priority
                                    unoptimized
                                    className={`object-cover object-center select-none transition-transform duration-1000 ease-out ${scaleClass}`}
                                />
                                {isFourth ? (
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
                                <h3 className="heading-sub text-white transition-all duration-700 ease-out group-hover:scale-95">
                                    {category.Name}
                                </h3>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
