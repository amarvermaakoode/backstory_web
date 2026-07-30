"use client";

import Image from "next/image";

export default function AboutUsSection() {
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

    return (
        <div className="relative w-full bg-[#030303]">
            {/* ==========================================
                PART 1: Denim Hero Banner (Sticky Top)
            ========================================== */}
            <section className="sticky top-0 z-10 h-screen w-full overflow-hidden flex items-center justify-between px-6 sm:px-12 md:px-16 lg:px-24">
                {/* Background Denim Image with Subtle Gradient Overlay */}
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
                    {/* Right Side Bold Hero Heading */}
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
                PART 2: Tilted Cards & Story (Slides Over Part 1)
            ========================================== */}
            <section className="relative z-20 bg-[#050505] text-white h-auto flex items-center justify-center py-24 px-6 md:px-20 border-t border-white/10">
                <div className="w-full max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center justify-between">
                    {/* Left Tilted Card - Guy Model */}
                    <div className="w-full max-w-[280px] sm:max-w-[320px] shrink-0 flex justify-center lg:justify-start">
                        <div className="relative transform -rotate-6 ">
                            <div className="relative h-[40vh] w-[15vw]">
                                <Image
                                    src="/images/landing-page/first.png"
                                    alt="BacStory Tribe Streetwear Model"
                                    fill
                                    priority
                                    unoptimized
                                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
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

                    {/* Right Tilted Card - Girl Model */}
                    <div className="w-full max-w-[280px] sm:max-w-[320px] shrink-0 flex justify-center lg:justify-end">
                        <div className="relative transform rotate-6 ">
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
                PART 3: Our Philosophy & Team (Slides Over Part 2)
            ========================================== */}
            <section
                id="philosophy"
                className="relative z-30 bg-[#F3F4F5] text-black py-18 px-6 sm:px-12"
            >
                <div className="w-full max-w-[100%] mx-auto space-y-12">
                    {/* Header */}
                    <div>
                        <h2 className="font-clashDisplay text-4xl sm:text-[3vw] font-semibold tracking-tight text-black">
                            Our Philosophy
                        </h2>
                    </div>

                    {/* 4 Feature Columns */}
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
                PART 4: The People behind BacStory (Separate Section)
            ========================================== */}
            <section
                id="team"
                className="relative z-40 bg-white text-black pt-14 border-t border-neutral-200 border-b border-white"
            >
                <div className="w-full space-y-12">
                    {/* Header Row (Padded) */}
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

                    {/* Image + Story Details Split Box (Full Width Edge-to-Edge with Balanced Ratio) */}
                    <div className="w-full flex flex-col lg:flex-row overflow-hidden">
                        {/* Left: Model Photo (53% width portion) */}
                        <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[500px] lg:w-[53%] shrink-0 bg-neutral-900 ">
                            <Image
                                src="/images/women.png"
                                alt="The People behind BacStory"
                                fill
                                unoptimized
                                className="object-cover object-[center_20%]"
                            />
                        </div>

                        {/* Right: Off-white Text Card (47% width portion) */}
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
