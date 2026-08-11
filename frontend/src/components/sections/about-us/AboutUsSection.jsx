"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Scan,
  ShieldCheck,
  Sparkles,
  Share2,
  QrCode,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  User,
  Camera,
  Music,
  Globe,
  AtSign,
  Layers,
  Smartphone
} from "lucide-react";
import QRCodeCard from "@/components/qr/QRCodeCard";

export default function AboutUsSection() {
  const [activeStepTab, setActiveStepTab] = useState("claimed");

  const philosophyItems = [
    {
      icon: "/images/about/identity.svg",
      title: "Identity",
      description:
        "We believe what you wear should say something real about who you are - not who the internet tells you to be.",
    },
    {
      icon: "/images/about/tribe.svg",
      title: "Tribe",
      description:
        "Communities create culture. Every collection celebrates people connected by shared passions, interests and experiences.",
    },
    {
      icon: "/images/about/story.svg",
      title: "Story",
      description:
        "Products come and go. Stories stay. That's what gives every piece lasting value.",
    },
    {
      icon: "/images/about/quality.svg",
      title: "Quality",
      description:
        "Meaning deserves craftsmanship. We obsess over materials, construction and details because stories should last.",
    },
  ];

  const qrSteps = [
    {
      step: "01",
      icon: Scan,
      title: "Physical Garment Tag",
      subtitle: "Every shirt comes with a unique QR code",
      description:
        "Each BACSTORY apparel piece features a scannable QR tag embedded on the physical garment, carrying a unique identifier code.",
    },
    {
      step: "02",
      icon: ShieldCheck,
      title: "Verify & Claim",
      subtitle: "Link the garment to your account",
      description:
        "Scan the tag, enter your Order ID, and verify with a quick OTP. The garment's digital identity is now securely linked to you.",
    },
    {
      step: "03",
      icon: Sparkles,
      title: "Craft Your Narrative",
      subtitle: "Add custom bio, links & stories",
      description:
        "Personalize your claimed garment. Share your story, favorite quote, and link your social handles like Instagram, Spotify, and LinkedIn.",
    },
    {
      step: "04",
      icon: Share2,
      title: "Real-World Connection",
      subtitle: "Anyone who scans views your identity",
      description:
        "When friends or people in the real world scan your garment's QR tag, they instantly view your digital identity pass and active story.",
    },
  ];

  return (
    <div className="relative w-full bg-[#030303] text-white">
      {/* ==========================================
          PART 1: Denim Hero Banner (Sticky Top)
      ========================================== */}
      <section className="sticky top-0 z-10 h-screen w-full overflow-hidden flex items-center justify-between px-6 sm:px-12 md:px-16 lg:px-24">
        {/* Background Denim Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/login/login-phone.png"
            alt="Bacstory Denim Background"
            fill
            priority
            unoptimized
            className="object-cover object-center"
          />
        </div>

        {/* Content Wrapper */}
        <div className="relative z-10 w-full max-w-[100%] mx-auto flex flex-col md:flex-row items-center justify-between gap-10 md:gap-16">
          <div className="max-w-[40%] text-left space-y-4 md:space-y-6 self-end md:self-center ml-auto">
            <h1 className="font-clashDisplay text-4xl sm:text-5xl md:text-6xl lg:text-[4.5vw] font-semibold text-white tracking-tight leading-[1.08] drop-shadow-lg">
              We don&apos;t make clothes.
            </h1>
            <p className="font-sans text-lg sm:text-xl md:text-2xl lg:text-[1.8vw] font-normal text-neutral-200/90 tracking-wide">
              We make something worth belonging to.
            </p>
          </div>
        </div>
      </section>

      {/* ==========================================
          PART 2: Tilted Cards & Brand Core
      ========================================== */}
      <section className="relative z-20 bg-[#050505] text-white h-auto flex items-center justify-center py-24 px-6 md:px-20 border-t border-white/10">
        <div className="w-full max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center justify-between">
          {/* Left Tilted Card */}
          <div className="w-full max-w-[280px] sm:max-w-[320px] shrink-0 flex justify-center lg:justify-start">
            <div className="relative transform -rotate-6">
              <div className="relative h-[40vh] w-[15vw]">
                <Image
                  src="/images/landing-page/first.png"
                  alt="BacStory Tribe Streetwear Model"
                  fill
                  priority
                  unoptimized
                  className="object-cover object-center transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>
          </div>

          {/* Center Brand Text */}
          <div className="flex-1 max-w-[42%] text-center space-y-6 px-2 sm:px-4">
            <p className="font-sans text-2xl sm:text-3xl lg:text-[2.2vw] font-medium text-white leading-tight tracking-tight">
              BacStory exists for people who see clothing as more than fabric.
              Every piece is an invitation into a tribe, a conversation, and a story
              that continues long after it&apos;s worn.
            </p>
          </div>

          {/* Right Tilted Card */}
          <div className="w-full max-w-[280px] sm:max-w-[320px] shrink-0 flex justify-center lg:justify-end">
            <div className="relative transform rotate-6">
              <div className="relative h-[40vh] w-[15vw]">
                <Image
                  src="/images/women.png"
                  alt="BacStory Identity Model"
                  fill
                  priority
                  unoptimized
                  className="object-cover object-center"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          PART 3: Our Philosophy
      ========================================== */}
      <section
        id="philosophy"
        className="relative z-30 bg-[#F3F4F5] text-black py-20 px-6 sm:px-12"
      >
        <div className="w-full max-w-[100%] mx-auto space-y-12">
          <div>
            <h2 className="font-clashDisplay text-4xl sm:text-[3vw] font-semibold tracking-tight text-black">
              Our Philosophy
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-16">
            {philosophyItems.map((item, idx) => (
              <div key={idx} className="flex flex-col space-y-4">
                <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-start">
                  <Image
                    src={item.icon}
                    alt={item.title}
                    width={40}
                    height={40}
                    unoptimized
                    className="w-7 h-7 md:w-9 md:h-9 object-contain"
                  />
                </div>
                <h3 className="font-clashDisplay text-xl md:text-[2vw] font-semibold tracking-wide text-black">
                  {item.title}
                </h3>
                <p className="font-sans text-sm md:text-[1.5vw] text-black leading-tight font-semibold">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          PART 4: HOW QR IDENTITY WORKS (Matching Existing Philosophy UI)
      ========================================== */}
      <section
        id="qr-concept"
        className="relative z-30 bg-[#050505] text-white py-20 px-6 sm:px-12 border-t border-white/10"
      >
        <div className="w-full max-w-[100%] mx-auto space-y-12">
          {/* Header */}
          <div>
            <h2 className="font-clashDisplay text-4xl sm:text-[3vw] font-semibold tracking-tight text-white">
              How Your Garment&apos;s QR Identity Works
            </h2>
          </div>

          {/* 4 Feature Columns matching Philosophy layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-16">
            {qrSteps.map((item, idx) => (
              <div key={idx} className="flex flex-col space-y-4">
                <span className="font-clashDisplay text-xl md:text-[2vw] font-semibold text-neutral-500">
                  {item.step}
                </span>
                <h3 className="font-clashDisplay text-xl md:text-[2vw] font-semibold tracking-wide text-white">
                  {item.title}
                </h3>
                <p className="font-sans text-sm md:text-[1.5vw] text-neutral-300 leading-tight font-semibold">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          PART 5: The People behind BacStory
      ========================================== */}
      <section
        id="team"
        className="relative z-40 bg-white text-black pt-14 border-t border-neutral-200 border-b border-white"
      >
        <div className="w-full space-y-12">
          {/* Header Row */}
          <div className="px-auto max-w-[100%] flex flex-col md:flex-row items-center justify-center gap-20">
            <div>
              <h3 className="font-clashDisplay text-4xl sm:text-5xl lg:text-[3vw] font-semibold text-black leading-[1.1] tracking-tight">
                The People behind<br />BacStory
              </h3>
            </div>
            <div className="max-w-[35%]">
              <p className="font-sans text-xl sm:text-2xl lg:text-[1.8vw] font-semibold text-black leading-tight">
                We didn&apos;t set out to build another clothing brand. We wanted to build something people could belong to.
              </p>
            </div>
          </div>

          {/* Image + Story Details Split Box */}
          <div className="w-full flex flex-col lg:flex-row overflow-hidden">
            <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[500px] lg:w-[53%] shrink-0 bg-neutral-900">
              <Image
                src="/images/women.png"
                alt="The People behind BacStory"
                fill
                unoptimized
                className="object-cover object-[center_20%]"
              />
            </div>

            <div className="lg:w-[47%] bg-[#EFECE6] p-8 sm:p-12 md:p-14 lg:p-30 flex flex-col justify-center gap-6 md:gap-8 text-neutral-900">
              <p className="font-sans text-base sm:text-lg md:text-xl font-medium leading-tight text-black tracking-tight">
                What started as shared ideas slowly became a shared vision: to create clothing that carries meaning, celebrates individuality, and brings people together through stories worth wearing.
              </p>
              <p className="font-sans text-base sm:text-lg md:text-xl font-medium leading-tight text-black tracking-tight">
                Today, that vision continues to shape every decision we make—from the communities we collaborate with to the details woven into every collection.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
