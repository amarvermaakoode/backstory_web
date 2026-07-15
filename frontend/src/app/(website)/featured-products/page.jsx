"use client";

import React, { useState, useEffect, useRef } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { allProducts } from "@/data/products";
import ProductCard from "@/components/ui/ProductCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function FeaturedListingPage() {

    // Page, filter, and sort states
    const [selectedCategories, setSelectedCategories] = useState(["ALL"]);
    const [sortBy, setSortBy] = useState("featured");
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const sortDropdownRef = useRef(null);

    const handleCategoryClick = (category) => {
        setSelectedCategories((prev) => {
            if (category === "ALL") {
                return ["ALL"];
            }
            let newCategories = prev.filter(c => c !== "ALL");
            if (newCategories.includes(category)) {
                newCategories = newCategories.filter(c => c !== category);
            } else {
                newCategories = [...newCategories, category];
            }
            if (newCategories.length === 0) {
                return ["ALL"];
            }
            return newCategories;
        });
        setCurrentPage(1);
    };

    const ITEMS_PER_PAGE = 8;

    // Close sort dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
                setIsSortOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter products
    const filteredProducts = allProducts.filter((product) => {
        if (selectedCategories.includes("ALL")) return true;
        return selectedCategories.some(cat => product.tag.toUpperCase() === cat.toUpperCase());
    });

    // Sort products
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortBy === "price-asc") {
            return a.priceNum - b.priceNum;
        }
        if (sortBy === "price-desc") {
            return b.priceNum - a.priceNum;
        }
        if (sortBy === "rating") {
            return parseFloat(b.rating) - parseFloat(a.rating);
        }
        return 0; // Default/Featured (original order)
    });

    // Pagination calculations
    const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);

    // Ensure currentPage is valid if filter reduces item count
    const activePage = currentPage > totalPages ? 1 : currentPage;

    const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
    const displayedProducts = sortedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
        <div className="min-h-screen bg-white text-black selection:bg-neutral-200 selection:text-black flex flex-col font-sans">
            <Navbar solid={true} light={true} />

            {/* Main Listing Wrapper */}
            <main className="flex-1 w-full pt-28 pb-20 px-6 sm:px-10 md:px-12 select-none">
                <div className="mx-auto max-w-[100%] flex flex-col">

                    {/* Breadcrumbs */}
                    <nav className="text-xs md:text-[1vw] text-neutral-400 font-normal mt-0">
                        <Link href="/" className="text-black  transition-colors duration-200">Home</Link>
                        <span className="mx-1">/</span>
                        <span className="text-black">Featured Products</span>
                    </nav>

                    {/* Page Header */}
                    <div className="mt-6 md:mt-8 space-y-6 md:space-y-3 ">
                        <h1 className="font-clashDisplay text-3xl md:text-[3vw] font-semibold tracking-tight text-black">
                            Featured Products
                        </h1>

                        {/* Filters Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5">
                            {/* Left: Category pills */}
                            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                                <style>{`
                                    .no-scrollbar::-webkit-scrollbar {
                                        display: none;
                                    }
                                    .no-scrollbar {
                                        -ms-overflow-style: none;
                                        scrollbar-width: none;
                                    }
                                `}</style>
                                {["ALL", "TRAVEL SERIES", "CODING SERIES", "BIKER SERIES"].map((category) => {
                                    const isSelected = selectedCategories.includes(category);
                                    return (
                                        <button
                                            key={category}
                                            onClick={() => handleCategoryClick(category)}
                                            className={`text-xs font-semibold tracking-wide uppercase whitespace-nowrap transition-all duration-200 cursor-pointer rounded-full px-2 py-1.5 border ${isSelected
                                                ? "bg-[#F0EEE9] border-black text-black"
                                                : "bg-transparent border-transparent text-black hover:bg-[#F0EEE9]/50 hover:border-neutral-300"
                                                }`}
                                        >
                                            {category}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Right: Sort and Filter */}
                            <div className="flex items-center gap-[8px] self-end sm:self-auto" ref={sortDropdownRef}>
                                {/* Sort By */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsSortOpen(!isSortOpen)}
                                        className="flex items-center bg-[#F4F0EA] gap-2 px-2 py-1 rounded-full text-xs md:text-sm font-semibold text-black hover:border-black transition-colors cursor-pointer"
                                    >
                                        Sort By
                                        <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isSortOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {isSortOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 rounded-xl shadow-xl z-30 py-1 overflow-hidden">
                                            {[
                                                { label: "Featured", value: "featured" },
                                                { label: "Price: Low to High", value: "price-asc" },
                                                { label: "Price: High to Low", value: "price-desc" },
                                                { label: "Customer Rating", value: "rating" },
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        setSortBy(option.value);
                                                        setIsSortOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 text-xs md:text-sm transition-colors cursor-pointer ${sortBy === option.value
                                                        ? "bg-neutral-100 font-semibold text-black"
                                                        : "text-neutral-600 hover:bg-neutral-50 hover:text-black"
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Filter button */}
                                <button className="flex items-center bg-[#F4F0EA] gap-2 px-2 py-1 rounded-full text-xs md:text-sm font-semibold text-black hover:border-black transition-colors cursor-pointer">
                                    Filter
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Product Listing Grid */}
                    {displayedProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-4 gap-y-12 md:gap-y-16 mt-10">
                            {displayedProducts.map((product) => (
                                <div key={product.id} className="w-full">
                                    <ProductCard product={product} isHome={false} isSmall={true} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center">
                            <p className="text-neutral-500 text-base">No products found matching your selection.</p>
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-16">
                            {/* Prev Button */}
                            <button
                                disabled={activePage === 1}
                                onClick={() => setCurrentPage(activePage - 1)}
                                className={`p-2 rounded-full border border-neutral-200 hover:border-black transition-colors cursor-pointer flex items-center justify-center ${activePage === 1 ? "opacity-30 cursor-not-allowed border-neutral-100" : ""
                                    }`}
                                aria-label="Previous Page"
                            >
                                <ChevronLeft className="h-4 w-4 stroke-[1.75]" />
                            </button>

                            {/* Pages */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-9 h-9 flex items-center justify-center rounded-full text-xs md:text-sm font-semibold transition-colors cursor-pointer ${activePage === page
                                        ? "bg-black text-white"
                                        : "text-neutral-500 hover:text-black hover:bg-neutral-50"
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}

                            {/* Next Button */}
                            <button
                                disabled={activePage === totalPages}
                                onClick={() => setCurrentPage(activePage + 1)}
                                className={`p-2 rounded-full border border-neutral-200 hover:border-black transition-colors cursor-pointer flex items-center justify-center ${activePage === totalPages ? "opacity-30 cursor-not-allowed border-neutral-100" : ""
                                    }`}
                                aria-label="Next Page"
                            >
                                <ChevronRight className="h-4 w-4 stroke-[1.75]" />
                            </button>
                        </div>
                    )}

                </div>
            </main>

            <Footer />
        </div>
    );
}
