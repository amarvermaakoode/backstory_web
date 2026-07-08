"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Heart, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

export default function FeaturedListingPage() {
    // 12 mock products mapping to available local image assets
    const allProducts = [
        {
            id: "lost-on-purpose-1",
            name: "Lost on Purpose",
            price: "Rs 1100",
            priceNum: 1100,
            image: "/images/landing-page/featured3.png",
            tag: "Travel Series",
            rating: "4.7",
            reviews: 63,
            colors: ["#5F6F52", "#A94438", "#1E3E62", "#000000"]
        },
        {
            id: "miles-over-words-1",
            name: "Miles Over Words",
            price: "Rs 1090",
            priceNum: 1090,
            image: "/images/landing-page/biker-tshirt.png",
            tag: "Biker Series",
            rating: "4.8",
            reviews: 42,
            colors: ["#2C3E50", "#E74C3C", "#34495E", "#111111"]
        },
        {
            id: "coding-tshirt-1",
            name: "Coding T-Shirt",
            price: "Rs 990",
            priceNum: 990,
            image: "/images/landing-page/coding-tshirt.png",
            tag: "Coding Series",
            rating: "4.9",
            reviews: 128,
            colors: ["#121212", "#00FF00", "#FFFFFF"]
        },
        {
            id: "built-in-public-1",
            name: "Built in Public",
            price: "Rs 1200",
            priceNum: 1200,
            image: "/images/landing-page/featured11.png",
            tag: "Coding Series",
            rating: "4.6",
            reviews: 54,
            colors: ["#3E3232", "#503C3C", "#A87C7C"]
        },
        {
            id: "life-through-lenses-1",
            name: "Life Through My Lenses",
            price: "Rs 1100",
            priceNum: 1100,
            image: "/images/landing-page/featured2.png",
            tag: "Travel Series",
            rating: "4.7",
            reviews: 31,
            colors: ["#1A1A1D", "#6F2232", "#950740"]
        },
        {
            id: "adventure-bound-1",
            name: "Adventure Bound",
            price: "Rs 1150",
            priceNum: 1150,
            image: "/images/landing-page/featured3.png",
            tag: "Travel Series",
            rating: "4.5",
            reviews: 19,
            colors: ["#4E6C50", "#F1DEC9", "#3E497A"]
        },
        {
            id: "road-less-traveled-1",
            name: "Road Less Traveled",
            price: "Rs 1050",
            priceNum: 1050,
            image: "/images/landing-page/biker-tshirt.png",
            tag: "Biker Series",
            rating: "4.8",
            reviews: 88,
            colors: ["#222831", "#393E46", "#00ADB5"]
        },
        {
            id: "hello-world-tee-1",
            name: "Hello World Tee",
            price: "Rs 950",
            priceNum: 950,
            image: "/images/landing-page/coding-tshirt.png",
            tag: "Coding Series",
            rating: "4.7",
            reviews: 72,
            colors: ["#0F0F0F", "#1F2937", "#4B5563"]
        },
        {
            id: "byte-me-tshirt-1",
            name: "Byte Me T-Shirt",
            price: "Rs 990",
            priceNum: 990,
            image: "/images/landing-page/featured11.png",
            tag: "Coding Series",
            rating: "4.9",
            reviews: 110,
            colors: ["#1E1B4B", "#312E81", "#4338CA"]
        },
        {
            id: "wanderlust-oversized-1",
            name: "Wanderlust Oversized",
            price: "Rs 1250",
            priceNum: 1250,
            image: "/images/landing-page/featured2.png",
            tag: "Travel Series",
            rating: "4.6",
            reviews: 45,
            colors: ["#D4B499", "#8D6262", "#2B2B2B"]
        },
        {
            id: "born-to-ride-1",
            name: "Born to Ride",
            price: "Rs 1190",
            priceNum: 1190,
            image: "/images/landing-page/biker-tshirt.png",
            tag: "Biker Series",
            rating: "4.7",
            reviews: 56,
            colors: ["#000000", "#7F8C8D", "#D35400"]
        },
        {
            id: "git-commit-tee-1",
            name: "Git Commit Tee",
            price: "Rs 990",
            priceNum: 990,
            image: "/images/landing-page/coding-tshirt.png",
            tag: "Coding Series",
            rating: "4.8",
            reviews: 93,
            colors: ["#1A1D20", "#2B303A", "#F05A7E"]
        }
    ];

    // Page, filter, and sort states
    const [favorites, setFavorites] = useState({});
    const [activeCategory, setActiveCategory] = useState("ALL");
    const [sortBy, setSortBy] = useState("featured");
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const sortDropdownRef = useRef(null);

    const ITEMS_PER_PAGE = 8;

    const toggleFavorite = (id) => {
        setFavorites((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

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
        if (activeCategory === "ALL") return true;
        return product.tag.toUpperCase() === activeCategory.toUpperCase();
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
            <main className="flex-1 w-full pt-28 pb-20 px-6 sm:px-10 md:px-16 lg:px-[4%] select-none">
                <div className="mx-auto max-w-[1600px] flex flex-col">

                    {/* Breadcrumbs */}
                    <nav className="text-xs md:text-sm text-neutral-400 font-normal mt-2">
                        <Link href="/" className="hover:text-black transition-colors duration-200">Home</Link>
                        <span className="mx-2">/</span>
                        <span className="text-neutral-600">Featured Products</span>
                    </nav>

                    {/* Page Header */}
                    <div className="mt-6 md:mt-8 space-y-6 md:space-y-8">
                        <h1 className="font-clashDisplay text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-black">
                            Featured Products
                        </h1>

                        {/* Filters Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
                            {/* Left: Category pills */}
                            <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar py-1">
                                <style>{`
                                    .no-scrollbar::-webkit-scrollbar {
                                        display: none;
                                    }
                                    .no-scrollbar {
                                        -ms-overflow-style: none;
                                        scrollbar-width: none;
                                    }
                                `}</style>
                                {["ALL", "TRAVEL SERIES", "CODING SERIES", "BIKER SERIES"].map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => {
                                            setActiveCategory(category);
                                            setCurrentPage(1);
                                        }}
                                        className={`text-sm md:text-base font-semibold tracking-wide uppercase whitespace-nowrap transition-colors duration-200 cursor-pointer relative py-1 ${activeCategory === category
                                            ? "text-black"
                                            : "text-neutral-400 hover:text-black"
                                            }`}
                                    >
                                        {category}
                                        {activeCategory === category && (
                                            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Right: Sort and Filter */}
                            <div className="flex items-center gap-3 self-end sm:self-auto" ref={sortDropdownRef}>
                                {/* Sort By */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsSortOpen(!isSortOpen)}
                                        className="flex items-center gap-2 px-5 py-2 border border-neutral-300 rounded-full text-xs md:text-sm font-semibold text-black hover:border-black transition-colors cursor-pointer"
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
                                <button className="flex items-center gap-2 px-5 py-2 border border-neutral-300 rounded-full text-xs md:text-sm font-semibold text-black hover:border-black transition-colors cursor-pointer">
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
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-12 mt-10">
                            {displayedProducts.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/products/${product.id}`}
                                    className="group flex flex-col cursor-pointer"
                                >
                                    {/* Image Container Card */}
                                    <div className="relative w-full aspect-square bg-[#F4F0EA] flex items-center justify-center overflow-hidden">

                                        {/* Tag label on top-left */}
                                        {/* <div className="absolute top-3 left-3 z-10 bg-[#101820] text-white text-[8px] sm:text-[10px] font-normal tracking-wider px-2.5 py-1 rounded-full uppercase">
                                            {product.tag}
                                        </div> */}

                                        {/* Favorite Heart Button */}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                toggleFavorite(product.id);
                                            }}
                                            className="absolute top-3 right-3 z-10 p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                                            aria-label="Add to favorites"
                                        >
                                            <Heart
                                                className={`h-4.5 w-4.5 transition-all ${favorites[product.id]
                                                    ? "fill-red-500 text-red-500 stroke-red-500"
                                                    : "text-black stroke-[1.5]"
                                                    }`}
                                            />
                                        </button>

                                        {/* Rating badge on bottom-left */}
                                        <div className="absolute bottom-3 left-3 z-10 bg-transparent backdrop-blur-sm text-[8px] sm:text-[10px] font-medium text-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm border border-black">
                                            <span className="text-black">★</span>
                                            <span>{product.rating}</span>
                                            <span className="text-black">({product.reviews})</span>
                                        </div>

                                        {/* Product Image */}
                                        <div className="relative w-[80%] h-[80%] transition-transform duration-500 ease-out group-hover:scale-105">
                                            <Image
                                                src={product.image}
                                                alt={product.name}
                                                fill
                                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                className="object-contain select-none"
                                                priority
                                            />
                                        </div>
                                    </div>

                                    {/* Product Info (Below Card) */}
                                    <div className="mt-3 flex justify-between items-start">
                                        <div className="space-y-1">
                                            <h3 className="font-sans text-sm md:text-base font-semibold text-black leading-tight">
                                                {product.name}
                                            </h3>
                                            <p className="font-clashDisplay text-base md:text-2xl font-semibold text-black">
                                                {product.price}
                                            </p>
                                            {/* Color Swatch Circles */}
                                            <div className="flex items-center gap-1.5 pt-1">
                                                {product.colors.slice(0, 3).map((color, index) => (
                                                    <span
                                                        key={index}
                                                        className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                                {product.colors.length > 3 && (
                                                    <span className="text-[10px] md:text-xs font-semibold text-neutral-500 ml-1">
                                                        +{product.colors.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 text-black hover:bg-neutral-200 transition-colors cursor-pointer"
                                            aria-label="Add to cart"
                                        >
                                            <Plus className="h-4 w-4 stroke-[2]" />
                                        </button>
                                    </div>
                                </Link>
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
