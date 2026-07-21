"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const faqData = [
    {
        id: 1,
        category: "PRODUCT",
        question: "What sizes do you offer?",
        answer: "We offer sizes XS through XXL. Our garments are cut oversized, so we recommend checking the size guide or sizing down if you prefer a regular fit."
    },
    {
        id: 2,
        category: "PRODUCT",
        question: "How do I care for my BacStory tee?",
        answer: "To preserve the graphic print and premium cotton fabric, machine wash inside out on a cold gentle cycle. Hang dry or tumble dry low. Do not iron directly on the graphics."
    },
    {
        id: 3,
        category: "BRAND",
        question: "Do you ship internationally?",
        answer: "Yes, we ship to most countries worldwide. Shipping fees and delivery times vary by destination and will be calculated at checkout."
    },
    {
        id: 4,
        category: "RETURN & EXCHANGE",
        question: "What is your return and exchange policy?",
        answer: "We offer a 14-day return and exchange window for unworn items in original condition with tags attached. Reach out to support to start a return."
    },
    {
        id: 5,
        category: "BRAND",
        question: "How long does delivery take?",
        answer: "Standard domestic delivery takes 3-5 business days. International shipping typically takes 7-12 business days depending on destination."
    },
    {
        id: 6,
        category: "BRAND",
        question: "Can I track my order once it has been shipped?",
        answer: "Yes! As soon as your package ships, you will receive a tracking link via email and SMS to follow your delivery status in real time."
    }
];

export default function FAQPage() {
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedId, setExpandedId] = useState(1); // Default first item expanded as shown in UI mockup

    const categories = ["ALL", "BRAND", "PRODUCT", "RETURN & EXCHANGE"];

    const toggleAccordion = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const filteredFaqs = faqData.filter((item) => {
        const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
        const matchesSearch =
            item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-[#F7F7F7] text-black flex flex-col font-sans select-none">
            <Navbar solid={true} light={true} />

            <main className="flex-1 w-full pt-20">
                {/* Hero Header Section */}
                <div className="relative w-full h-[280px] sm:h-[340px] md:h-[48vh] bg-black text-white flex flex-col justify-between p-6 sm:p-10 md:p-14 overflow-hidden">
                    {/* Background Hero Image */}
                    <div className="absolute inset-0 z-0 -mt-90">
                        <Image
                            src="/images/landing-page/discover-more.png"
                            alt="BacStory FAQ Header"
                            fill
                            priority
                            className="object-cover object-center opacity-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-10" />
                    </div>

                    {/* Content Layer */}
                    <div className="relative z-20 mx-auto max-w-[1600px] w-full h-full flex flex-col justify-between">
                        {/* Breadcrumbs */}
                        <nav className="text-xs sm:text-sm text-white font-normal mt-12 md:mt-14">
                            <Link href="/" className="hover:text-white transition-colors">Home</Link>
                            <span className="mx-2">/</span>
                            <span className="text-white font-medium">FAQ</span>
                        </nav>

                        {/* Banner Heading */}
                        <div className="mb-6 space-y-3">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold font-clashDisplay tracking-tight">
                                Frequently Asked Question
                            </h1>

                        </div>
                    </div>
                </div>

                {/* Filter Tabs & Search Bar Row */}
                <div className="mx-auto max-w-[1400px] px-6 sm:px-10 md:px-12 py-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6">
                        {/* Category Filter Pills */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                            <style jsx global>{`
                                .no-scrollbar::-webkit-scrollbar {
                                    display: none;
                                }
                                .no-scrollbar {
                                    -ms-overflow-style: none;
                                    scrollbar-width: none;
                                }
                            `}</style>
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-sm   font-light tracking-wider uppercase transition-all duration-200 cursor-pointer ${selectedCategory === cat
                                        ? "bg-[#101820] text-white shadow-md"
                                        : "bg-transparent text-neutral-600 hover:text-black hover:bg-neutral-200/60"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Search Input Bar */}
                        <div className="relative w-full md:w-80">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#EAE8E4]/70 border border-neutral-300/80 rounded-full pl-5 pr-10 py-2.5 text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-black transition-colors"
                            />
                            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                        </div>
                    </div>

                    {/* Accordion Questions List */}
                    <div className="divide-y divide-neutral-200/80 mt-4">
                        {filteredFaqs.length > 0 ? (
                            filteredFaqs.map((faq) => {
                                const isExpanded = expandedId === faq.id;
                                return (
                                    <div key={faq.id} className="py-5 transition-colors">
                                        <button
                                            onClick={() => toggleAccordion(faq.id)}
                                            className="w-full flex items-center justify-between text-left group cursor-pointer focus:outline-none"
                                        >
                                            <span className="font-semibold text-base sm:text-lg text-black group-hover:text-neutral-700 transition-colors">
                                                {faq.question}
                                            </span>
                                            <ChevronDown
                                                className={`w-4 h-4 text-neutral-600 transition-transform duration-300 shrink-0 ml-4 ${isExpanded ? "rotate-180 text-black" : ""
                                                    }`}
                                            />
                                        </button>
                                        {isExpanded && (
                                            <div className="mt-3 pr-8 text-neutral-600 text-xs sm:text-sm font-normal leading-relaxed max-w-4xl">
                                                {faq.answer}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-16 text-center text-neutral-500 text-sm">
                                No questions found matching your search.
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
