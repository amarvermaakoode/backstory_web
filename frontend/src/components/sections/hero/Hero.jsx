"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowRight, QrCode } from "lucide-react";

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
                <div className="absolute inset-0 flex items-center justify-center">
                    <Image
                        src="/images/landing-page/hero-image2.png"
                        alt="Model wearing Bacstory QR T-Shirt"
                        fill
                        priority
                        className="object-cover object-top select-none"
                    />
                </div>



                {/* Grid Overlay Content */}
                <div className="relative z-10 mx-auto max-w-[83%] px-6 sm:px-8 h-full flex flex-col justify-between mt-12">
                    <div className="flex-grow flex flex-col md:flex-row md:items-center justify-between gap-8 md:gap-4 my-auto">
                        {/* Left Header Title */}
                        <div className="md:w-1/3 flex items-center">
                            <h1 className="font-clashDisplay text-6xl font-semibold tracking-wide text-[#C5B9AC]  leading-[1] text-left select-none">
                                WEAR<br />YOUR<br />STORY
                            </h1>
                        </div>


                        {/* Right Subtitle & Action */}
                        <div className="md:w-1/3 flex items-center md:justify-end">
                            <div className="max-w-xs space-y-6 md:text-left">
                                <p className="text-xl sm:text-2xl text-white  font-geist font-normal leading-snug tracking-wide">
                                    Crafted as apparel.<br />Worn as identity.
                                </p>
                                <a
                                    href="#shop"
                                    className="group inline-flex items-center gap-4 bg-white text-black font-bold rounded-full pl-4 pr-2 py-1 hover:bg-neutral-200 transition-all text-md cursor-pointer shadow-lg shadow-white/5"
                                >
                                    Shop Now
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white group-hover:translate-x-0.5 transition-transform">
                                        <ArrowRight className="h-4 w-4" />
                                    </span>
                                </a>
                            </div>
                        </div>
                    </div>


                </div>
            </section>

            {/* QR Scanner Overlay Modal */}
            {isScannerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
                    <div className="relative w-full max-w-lg mx-4 border border-neutral-800 bg-neutral-950 p-8 rounded-3xl flex flex-col items-center text-center space-y-6">
                        {/* Holographic scanning circle */}
                        <div className="relative w-48 h-48 rounded-2xl border-2 border-neutral-850 flex items-center justify-center overflow-hidden bg-black">
                            {scanningState === "scanning" && (
                                <>
                                    <div className="absolute inset-x-0 h-1 bg-white/70 shadow-lg shadow-white/50 animate-bounce top-0" />
                                    <QrCode className="h-20 w-20 text-neutral-600 animate-pulse" />
                                </>
                            )}
                            {scanningState === "success" && (
                                <div className="absolute inset-0 bg-white/5 flex items-center justify-center animate-fade-in">
                                    <QrCode className="h-24 w-24 text-white" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-clashDisplay text-2xl font-bold tracking-tight">
                                {scanningState === "scanning" ? "Initializing Protocol..." : "Access Granted"}
                            </h3>
                            <p className="text-xs text-neutral-455 max-w-xs mx-auto">
                                {scanningState === "scanning"
                                    ? "Scanning apparel signature for embedded digital certificate..."
                                    : "Dossier credentials recovered successfully from source ID #8402."}
                            </p>
                        </div>

                        {scanningState === "success" && (
                            <div className="w-full text-left bg-black border border-neutral-900/80 p-5 rounded-2xl space-y-3 font-mono text-xs text-neutral-300">
                                <div className="flex justify-between text-[10px] text-neutral-500 uppercase">
                                    <span>Wearer</span>
                                    <span>Active Node</span>
                                </div>
                                <div className="font-bold text-white text-sm">Developer #8402</div>

                                <div className="h-px bg-neutral-900 my-2" />

                                <div className="text-[10px] text-neutral-500 uppercase font-sans">Backstory</div>
                                <p className="text-neutral-400 font-sans leading-relaxed font-light">
                                    A software engineer translating compiler errors into high-fashion textiles. Believes that debugging is a form of self-reflection.
                                </p>

                                <div className="h-px bg-neutral-900 my-2" />

                                <div className="text-[10px] text-neutral-500 uppercase">Source Manifest</div>
                                <pre className="text-[10px] text-purple-400 bg-neutral-950 p-2.5 rounded border border-neutral-900/60 overflow-x-auto">
                                    {`const story = new Backstory({
  owner: "Developer #8402",
  apparel: "V1.0-OversizedTee",
  status: "active"
});`}
                                </pre>
                            </div>
                        )}

                        <button
                            onClick={resetScanner}
                            className="w-full rounded-xl bg-white hover:bg-neutral-250 text-black text-sm font-semibold py-3 transition-all cursor-pointer font-sans"
                        >
                            {scanningState === "scanning" ? "Cancel Scan" : "Close Connection"}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
