"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/hero/Hero";

export default function Home() {
  const [cartCount, setCartCount] = useState(0);

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-[#dfd7cc]/30 selection:text-[#dfd7cc]">
      <Navbar cartCount={cartCount} />
      <Hero />
      <Hero />
      <Hero />
    </div>
  );
}
