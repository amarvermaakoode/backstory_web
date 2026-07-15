"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import ExploreButton from "@/components/ui/ExploreButton";

const API_BASE_URL = "http://localhost:5000/api";

const defaultCollections = [
    {
        _id: "ai-and-tech",
        Name: "AI and Tech Collection",
        image: "/images/landing-page/ai-and-tech1.png",
    },
    {
        _id: "wonderlust",
        Name: "Wanderlust Collection",
        image: "/images/landing-page/wonderlust1.png",
    },
];

export default function QrEnabledRange() {
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCollections = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/frontend/collections`);
                const data = await res.json();
                if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
                    setCollections(data.data);
                } else {
                    setCollections(defaultCollections);
                }
            } catch (err) {
                console.error("Failed to fetch landing collections:", err);
                setCollections(defaultCollections);
            } finally {
                setLoading(false);
            }
        };

        fetchCollections();
    }, []);

    const getImageUrl = (path) => {
        if (!path) return "/images/placeholder.png";
        if (path.startsWith("http") || path.startsWith("data:")) return path;
        
        // Local public assets start with /images/
        if (path.startsWith("/images/")) return path;
        
        // Backend upload asset
        return `http://localhost:5000${path.startsWith("/") ? "" : "/"}${path}`;
    };

    const activeCollections = collections.length > 0 ? collections : defaultCollections;

    return (
        <section className="w-full bg-[#C5B9AC] p-6 sm:p-10 md:p-12 select-none">
            <div className="mx-auto max-w-[100%] grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeCollections.map((collection) => (
                    <a
                        key={collection._id}
                        href="#shop"
                        className="group relative block w-full h-[60vh] md:h-[110vh] overflow-hidden cursor-pointer"
                    >
                        {/* Background Image */}
                        <div className="absolute inset-0 transition-transform duration-1000 ease-out group-hover:scale-105">
                            <Image
                                src={getImageUrl(collection.image)}
                                alt={collection.Name}
                                fill
                                priority
                                unoptimized
                                className="object-cover object-center select-none"
                            />
                        </div>

                        {/* Dark Gradient Overlay for premium readability */}
                        <div
                            className="absolute inset-0 transition-all duration-500 group-hover:opacity-90"
                            style={{
                                background: "linear-gradient(0deg, #101820 0%, rgba(16, 24, 32, 0) 81.83%)"
                            }}
                        />

                        {/* Content (Title & Button) */}
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-12 px-6 text-center">
                            {/* Main Collection Title */}
                            <h3 className="font-geist text-2xl md:text-3xl font-normal tracking-tight text-white mb-5">
                                {collection.Name}
                            </h3>

                            {/* Explore Pill Button */}
                            <ExploreButton text="Explore" />
                        </div>
                    </a>
                ))}
            </div>
        </section>
    );
}