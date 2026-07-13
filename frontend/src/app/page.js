"use client";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/hero/Hero";
import QrEnabledRange from "@/components/sections/qr-enabled-range/page";
import Collections from "@/components/sections/collection/page";
import LatestCollection from "@/components/sections/latest-collection/page";
import FeaturedProducts from "@/components/sections/featured/page";
import DiscoverMore from "@/components/sections/discover-more/page";
import ShopByTribe from "@/components/sections/shop-by-tribe/page";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-[#dfd7cc]/30 selection:text-[#dfd7cc]">
      <Navbar />
      <Hero />
      <QrEnabledRange />
      <LatestCollection />
      <Collections />
      <FeaturedProducts />
      <DiscoverMore />
      <ShopByTribe />
      <Footer />
    </div>
  );
}
