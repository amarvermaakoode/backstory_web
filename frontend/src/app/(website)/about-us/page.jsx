"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AboutUsSection from "@/components/sections/about-us/AboutUsSection";

export default function AboutUsPage() {
    return (
        <div className="min-h-screen bg-[#030303] text-white selection:bg-[#dfd7cc]/30 selection:text-[#dfd7cc]">
            <Navbar solid />
            <main>
                <AboutUsSection />
            </main>
            <Footer />
        </div>
    );
}
