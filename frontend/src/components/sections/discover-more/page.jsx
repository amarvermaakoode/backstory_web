"use client";

import React from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";

export default function DiscoverMore() {
    return (
        <section className="relative w-full overflow-hidden select-none">
            {/* Background Image */}
            <div className="w-full">
                <Image
                    src="/images/landing-page/discover-more.png"
                    alt="Every piece carries a story. Scan to uncover it."
                    width={1954}
                    height={1062}
                    priority
                    className="w-full h-auto select-none block"
                />
            </div>

            {/* Content Overlaid on Left */}
            <div className="absolute inset-y-0 left-0 z-10 pl-[5%] sm:pl-10 md:pl-16 lg:pl-[7%] max-w-[60%] sm:max-w-xl md:max-w-2xl flex flex-col justify-center gap-2 md:gap-6 text-left">
                <h2 className="font-geist text-sm sm:text-lg md:text-2xl lg:text-[2.3vw] font-semibold tracking-wide text-[#DFD7CC] leading-[1.15]">
                    Every piece carries a story.<br />
                    Scan to uncover it.
                </h2>
                <div>
                    <Button href="#discover" variant="outline-white" hasArrow={false}>
                        Discover more
                    </Button>
                </div>
            </div>
        </section>
    );
}
