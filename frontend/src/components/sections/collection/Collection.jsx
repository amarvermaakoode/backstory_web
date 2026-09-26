"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import ExploreButton from "@/components/ui/ExploreButton";
import { API_BASE_URL, getImageUrl } from "@/lib/api";

export default function QrEnabledRange() {
    const [collections, setCollections] = useState([]);

    useEffect(() => {
        const fetchCollections = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/frontend/collections`);
                const data = await res.json();
                if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
                    setCollections(data.data);
                } else {
                    setCollections([]);
                }
            } catch (err) {
                console.error("Failed to fetch landing collections:", err);
                setCollections([]);
            }
        };

        fetchCollections();
    }, []);

    // Show only the 2 latest collections
    const activeCollections = [...collections]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 2);

    return (
        <section className="w-full bg-[#C5B9AC] p-6 sm:p-10 md:p-12 overflow-hidden">
            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            <div className="-mx-6 sm:-mx-10 md:mx-0 px-6 sm:px-10 md:px-0 flex md:grid md:grid-cols-2 gap-4 md:gap-6 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0">
                {activeCollections.map((collection) => (
                    <Link
                        key={collection._id}
                        href={`/product-list/collection/${collection.slug || collection._id}`}
                        className="group relative block w-[85vw] sm:w-[70vw] md:w-full shrink-0 h-[60vh] md:h-[110vh] overflow-hidden cursor-pointer"
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
                            <h3 className="heading-sub text-white mb-5">
                                {collection.Name}
                            </h3>

                            {/* Explore Pill Button */}
                            <ExploreButton text="Explore" />
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}