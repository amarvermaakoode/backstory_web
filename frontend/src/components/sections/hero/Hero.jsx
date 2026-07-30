"use client";

import { useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";

export default function Hero() {
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scanningState, setScanningState] = useState("idle"); // idle, scanning, success

    const triggerScan = () => {
        setIsScannerOpen(true);
        setScanningState("scanning");
        setTimeout(() => {
            setScanningState("success");
        }, 2000);
    };

    const resetScanner = () => {
        setScanningState("idle");
        setIsScannerOpen(false);
    };

    return (
        <>
            <section className="relative h-screen mt-0 w-full overflow-hidden bg-[#050505]">
                {/* Background Image Container */}
                <div className="absolute w-[100%] md:w-[99%] h-[85%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 lg:inset-0 lg:w-full lg:h-full lg:translate-x-0 lg:translate-y-0 flex items-center justify-center overflow-hidden rounded-2xl lg:rounded-none">
                    <Image
                        src="/images/landing-page/hero-image2.png"
                        alt="Model wearing Bacstory QR T-Shirt"
                        fill
                        priority
                        className="object-cover object-top select-none"
                    />
                    {/* Gradient Overlay for Tablet and Mobile */}
                    <div
                        className="absolute inset-0 lg:hidden pointer-events-none"
                        style={{ background: "linear-gradient(180deg, rgba(0, 0, 0, 0) 48%, #000000 100%)" }}
                    />
                </div>



                {/* Grid Overlay Content */}
                <div className="relative z-10 mx-auto max-w-[90%] md:max-w-[88%] px-4 sm:px-8 h-full flex flex-col lg:justify-center justify-end">
                    <div className="flex flex-row items-end justify-between md:items-center gap-4 md:gap-4 w-full mb-[20%] lg:mb-0">
                        {/* Left Title */}
                        <div className="w-1/2 md:w-1/3 flex items-end">
                            <h1 className="heading-hero text-[#C5B9AC] text-left">
                                WEAR<br />YOUR<br />STORY
                            </h1>
                        </div>

                        {/* Right Subtitle & Action */}
                        <div className="w-1/2 md:w-1/3 flex items-end justify-end">
                            <div className="max-w-[100%] xs:max-w-xs space-y-4 md:space-y-6 text-left">
                                <p className="body-large text-white text-left tracking-wide">
                                    Crafted as apparel.<br />Worn as identity.
                                </p>
                                <Button href="/product-list" hasArrow={true} variant="primary">
                                    Shop Now
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </>
    );
}
