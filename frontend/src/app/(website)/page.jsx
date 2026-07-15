"use client";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/hero/Hero";
import QrEnabledRange from "@/components/sections/qr-enabled-range/QrEnabledRange";
import Collections from "@/components/sections/collection/Collection";
import LatestCollection from "@/components/sections/latest-collection/LatestCollection";
import FeaturedProducts from "@/components/sections/featured/Featured";
import DiscoverMore from "@/components/sections/discover-more/DiscoverMore";
import ShopByTribe from "@/components/sections/shop-by-tribe/ShopByTribe";
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
