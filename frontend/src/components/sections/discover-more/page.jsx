"use client";

import React from "react";
import Image from "next/image";

export default function DiscoverMore() {
    return (
        <section className="relative w-full md:h-screen h-[25vh] overflow-hidden bg-black flex items-center select-none">
            {/* Background Image */}
            <div className="absolute inset-0 w-full h-full">
                <Image
                    src="/images/landing-page/discover-more.png"
                    alt="Every piece carries a story. Scan to uncover it."
                    fill
                    priority
                    className="object-contain object-right select-none"
                />
            </div>

            {/* Content Overlaid on Left */}
            <div className="relative z-10 pl-3 sm:pl-10 md:pl-16 lg:pl-[7%] max-w-xl md:max-w-2xl md:space-y-6 space-y-2 text-left">
                <h2 className="font-geist text-xs md:text-3xl font-semibold tracking-wide text-[#DFD7CC] leading-[1.15]">
                    Every piece carries a story.<br />
                    Scan to uncover it.
                </h2>
                <a
                    href="#discover"
                    className="inline-block border border-white text-white font-semibold rounded-full px-2 md:px-6 py-0.5 md:py-2 hover:bg-white hover:text-black transition-colors duration-300 text-xs md:text-lg cursor-pointer"
                >
                    Discover more
                </a>
            </div>
        </section>
    );
}
