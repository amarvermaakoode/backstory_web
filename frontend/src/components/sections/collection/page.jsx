"use client";

import React from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import ExploreButton from "@/components/ui/ExploreButton";

export default function QrEnabledRange() {
    const collections = [
        {
            id: "ai-and-tech",
            name: "AI and Tech Collection",
            image: "/images/landing-page/ai-and-tech1.png",
            link: "#shop",
        },
        {
            id: "wonderlust",
            name: "Wanderlust Collection",
            image: "/images/landing-page/wonderlust1.png",
            link: "#shop",
        },
    ];

    return (
        <section className="w-full bg-[#C5B9AC] p-6 sm:p-10 md:p-12 select-none">
            <div className="mx-auto max-w-[98%] grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {collections.map((collection) => (
                    <a
                        key={collection.id}
                        href={collection.link}
                        className="group relative block w-full h-[60vh] md:h-[100vh] overflow-hidden cursor-pointer"
                    >
                        {/* Background Image */}
                        <div className="absolute inset-0 transition-transform duration-1000 ease-out group-hover:scale-105">
                            <Image
                                src={collection.image}
                                alt={collection.name}
                                fill
                                priority
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
                            <h3 className="font-geist text-2xl md:text-3xl font-normal tracking-wide text-white mb-5 transition-transform duration-500 group-hover:scale-[0.98]">
                                {collection.name}
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