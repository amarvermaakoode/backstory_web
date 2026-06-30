"use client";

import React from "react";
import Image from "next/image";

export default function DiscoverMore() {
    return (
        <section className="relative w-full h-screen min-h-[600px] overflow-hidden bg-black flex items-center select-none">
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
            <div className="relative z-10 pl-6 sm:pl-10 md:pl-16 lg:pl-[7%] max-w-xl md:max-w-2xl space-y-6 text-left">
                <h2 className="font-geist text-3xl font-semibold tracking-wide text-[#DFD7CC] leading-[1.15]">
                    Every piece carries a story.<br />
                    Scan to uncover it.
                </h2>
                <a
                    href="#discover"
                    className="inline-block border border-white text-white font-semibold rounded-full px-6 py-2 hover:bg-white hover:text-black transition-colors duration-300 text-sm md:text-lg cursor-pointer"
                >
                    Discover more
                </a>
            </div>
        </section>
    );
}
