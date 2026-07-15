"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { allProducts } from "@/data/products";
import ProductCard from "@/components/ui/ProductCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

export default function ProductsListing({ 
    categorySlug, 
    collectionSlug, 
    subCategorySlug 
}) {
    const searchParams = useSearchParams();
    const urlCategory = categorySlug || searchParams.get("category");
    const urlCollection = collectionSlug || searchParams.get("collection");
    const urlSubCategory = subCategorySlug || searchParams.get("subCategory");

    // Page, filter, and sort states
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [collectionsList, setCollectionsList] = useState([]);
    const [subCategoriesList, setSubCategoriesList] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [selectedCollection, setSelectedCollection] = useState("ALL");
    const [selectedSubCategory, setSelectedSubCategory] = useState("ALL");
    const [sortBy, setSortBy] = useState("featured");
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const sortDropdownRef = useRef(null);

    // Sync selectedCategory
    useEffect(() => {
        if (urlCategory) {
            setSelectedCategory(urlCategory);
        } else {
            setSelectedCategory("ALL");
        }
        setCurrentPage(1);
    }, [urlCategory, categorySlug]);

    // Sync selectedCollection
    useEffect(() => {
        if (urlCollection) {
            setSelectedCollection(urlCollection);
        } else {
            setSelectedCollection("ALL");
        }
        setCurrentPage(1);
    }, [urlCollection, collectionSlug]);

    // Sync selectedSubCategory
    useEffect(() => {
        if (urlSubCategory) {
            setSelectedSubCategory(urlSubCategory);
        } else {
            setSelectedSubCategory("ALL");
        }
        setCurrentPage(1);
    }, [urlSubCategory, subCategorySlug]);

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

    // Fetch dynamic catalogs and products
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch categories
                const catRes = await fetch(`${API_BASE_URL}/frontend/categories`);
                const catData = await catRes.json();
                if (catData && catData.success && Array.isArray(catData.data)) {
                    setCategories(catData.data);
                } else {
                    setCategories([
                        { _id: "t-shirts", Name: "T-Shirts", slug: "t-shirts" },
                        { _id: "hoodies", Name: "Hoodies", slug: "hoodies" },
                        { _id: "accessories", Name: "Accessories", slug: "accessories" }
                    ]);
                }

                // Fetch collections
                const colRes = await fetch(`${API_BASE_URL}/frontend/collections`);
                const colData = await colRes.json();
                if (colData && colData.success && Array.isArray(colData.data)) {
                    setCollectionsList(colData.data);
                } else {
                    setCollectionsList([
                        { _id: "ai-and-tech", Name: "AI and Tech Collection", slug: "ai-and-tech" },
                        { _id: "wonderlust", Name: "Wanderlust Collection", slug: "wonderlust" }
                    ]);
                }

                // Fetch subcategories
                const subRes = await fetch(`${API_BASE_URL}/frontend/sub-categories`);
                const subData = await subRes.json();
                if (subData && subData.success && Array.isArray(subData.data)) {
                    setSubCategoriesList(subData.data);
                } else {
                    setSubCategoriesList([
                        { _id: "coders", name: "Coders", slug: "coders" },
                        { _id: "bikers", name: "Bikers", slug: "bikers" },
                        { _id: "nomad", name: "Nomad", slug: "nomad" },
                        { _id: "techies", name: "Techies", slug: "techies" }
                    ]);
                }

                // Fetch products
                const prodRes = await fetch(`${API_BASE_URL}/frontend/products`);
                const prodData = await prodRes.json();
                if (prodData && prodData.success && Array.isArray(prodData.data) && prodData.data.length > 0) {
                    const mapped = prodData.data.map(item => {
                        const colorsList = (item.colors || []).map(c => ({
                            name: c.color?.name || "Default",
                            hex: c.color?.hexCode || "#CCCCCC"
                        }));
                        const sizesList = item.sizeGuide?.chart?.map(sz => sz.size) || ["S", "M", "L"];
                        const mainImg = item.colors?.[0]?.images?.[0] || "";
                        const hoverImg = item.colors?.[0]?.images?.[1] || item.colors?.[1]?.images?.[0] || "";
                        
                        return {
                            id: item._id,
                            name: item.title,
                            price: `Rs ${item.price}`,
                            priceNum: Number(item.price),
                            image: mainImg,
                            hoverImage: hoverImg,
                            sizes: sizesList,
                            colors: colorsList,
                            tag: item.category?.Name || "Product",
                            rating: "4.7",
                            reviewsCount: 63,
                            categoryId: item.category?._id || "",
                            categorySlug: item.category?.slug || "",
                            categoryName: item.category?.Name || "",
                            collectionId: item.collection?._id || "",
                            collectionSlug: item.collection?.slug || "",
                            collectionName: item.collection?.Name || "",
                            subCategoryId: item.subCategory?._id || "",
                            subCategorySlug: item.subCategory?.slug || "",
                            subCategoryName: item.subCategory?.name || ""
                        };
                    });
                    setProducts(mapped);
                } else {
                    // Fallback to local products
                    const mappedLocal = allProducts.map(p => ({
                        ...p,
                        categoryId: p.tag.toLowerCase().replace(" ", "-"),
                        categorySlug: p.tag.toLowerCase().replace(" ", "-"),
                        categoryName: p.tag,
                        collectionId: p.tag.toLowerCase().includes("coding") ? "ai-and-tech" : p.tag.toLowerCase().includes("travel") ? "wonderlust" : "",
                        collectionSlug: p.tag.toLowerCase().includes("coding") ? "ai-and-tech" : p.tag.toLowerCase().includes("travel") ? "wonderlust" : "",
                        collectionName: p.tag.toLowerCase().includes("coding") ? "AI and Tech Collection" : p.tag.toLowerCase().includes("travel") ? "Wanderlust Collection" : "",
                        subCategoryId: p.tag.toLowerCase().includes("coding") ? "coders" : p.tag.toLowerCase().includes("biker") ? "bikers" : p.tag.toLowerCase().includes("travel") ? "nomad" : "",
                        subCategorySlug: p.tag.toLowerCase().includes("coding") ? "coders" : p.tag.toLowerCase().includes("biker") ? "bikers" : p.tag.toLowerCase().includes("travel") ? "nomad" : "",
                        subCategoryName: p.tag.toLowerCase().includes("coding") ? "Coders" : p.tag.toLowerCase().includes("biker") ? "Bikers" : p.tag.toLowerCase().includes("travel") ? "Nomad" : ""
                    }));
                    setProducts(mappedLocal);
                }
            } catch (err) {
                console.error("Failed to fetch products or catalogs:", err);
                const mappedLocal = allProducts.map(p => ({
                    ...p,
                    categoryId: p.tag.toLowerCase().replace(" ", "-"),
                    categorySlug: p.tag.toLowerCase().replace(" ", "-"),
                    categoryName: p.tag,
                    collectionId: p.tag.toLowerCase().includes("coding") ? "ai-and-tech" : p.tag.toLowerCase().includes("travel") ? "wonderlust" : "",
                    collectionSlug: p.tag.toLowerCase().includes("coding") ? "ai-and-tech" : p.tag.toLowerCase().includes("travel") ? "wonderlust" : "",
                    collectionName: p.tag.toLowerCase().includes("coding") ? "AI and Tech Collection" : p.tag.toLowerCase().includes("travel") ? "Wanderlust Collection" : "",
                    subCategoryId: p.tag.toLowerCase().includes("coding") ? "coders" : p.tag.toLowerCase().includes("biker") ? "bikers" : p.tag.toLowerCase().includes("travel") ? "nomad" : "",
                    subCategorySlug: p.tag.toLowerCase().includes("coding") ? "coders" : p.tag.toLowerCase().includes("biker") ? "bikers" : p.tag.toLowerCase().includes("travel") ? "nomad" : "",
                    subCategoryName: p.tag.toLowerCase().includes("coding") ? "Coders" : p.tag.toLowerCase().includes("biker") ? "Bikers" : p.tag.toLowerCase().includes("travel") ? "Nomad" : ""
                }));
                setProducts(mappedLocal);
                setCategories([
                    { _id: "t-shirts", Name: "T-Shirts", slug: "t-shirts" },
                    { _id: "hoodies", Name: "Hoodies", slug: "hoodies" },
                    { _id: "accessories", Name: "Accessories", slug: "accessories" }
                ]);
                setCollectionsList([
                    { _id: "ai-and-tech", Name: "AI and Tech Collection", slug: "ai-and-tech" },
                    { _id: "wonderlust", Name: "Wanderlust Collection", slug: "wonderlust" }
                ]);
                setSubCategoriesList([
                    { _id: "coders", name: "Coders", slug: "coders" },
                    { _id: "bikers", name: "Bikers", slug: "bikers" },
                    { _id: "nomad", name: "Nomad", slug: "nomad" },
                    { _id: "techies", name: "Techies", slug: "techies" }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSubCategoryClick = (subSlugOrId) => {
        setSelectedSubCategory(subSlugOrId);
        setCurrentPage(1);

        const params = new URLSearchParams(window.location.search);
        if (subSlugOrId === "ALL") {
            params.delete("subCategory");
        } else {
            params.set("subCategory", subSlugOrId);
        }

        let newUrl = window.location.pathname;
        if (subCategorySlug) {
            // On a subcategory dynamic route: Changing the subcategory means changing the path itself
            if (subSlugOrId === "ALL") {
                newUrl = "/products";
                params.delete("subCategory");
            } else {
                newUrl = `/products/tribe/${subSlugOrId}`;
                params.delete("subCategory"); // Slug is in path, no need for param
            }
        } else {
            // On category, collection, or general listing. Clear conflicting category/collection parameters
            params.delete("category");
            params.delete("collection");
            setSelectedCategory("ALL");
            setSelectedCollection("ALL");
        }

        const queryStr = params.toString();
        const finalUrl = queryStr ? `${newUrl}?${queryStr}` : newUrl;
        window.history.pushState({}, "", finalUrl);
    };

    const getActiveTitle = () => {
        if (selectedSubCategory !== "ALL") {
            const sub = subCategoriesList.find(
                s => s._id === selectedSubCategory || s.slug === selectedSubCategory || s.name.toUpperCase() === selectedSubCategory.toUpperCase()
            );
            return sub ? sub.name : "Products";
        }
        if (selectedCollection !== "ALL") {
            const coll = collectionsList.find(
                c => c._id === selectedCollection || c.slug === selectedCollection || c.Name.toUpperCase() === selectedCollection.toUpperCase()
            );
            return coll ? coll.Name : "Collection Products";
        }
        if (selectedCategory !== "ALL") {
            const cat = categories.find(
                c => c._id === selectedCategory || c.slug === selectedCategory || c.Name.toUpperCase() === selectedCategory.toUpperCase()
            );
            return cat ? cat.Name : "Category Products";
        }
        return "Featured Products";
    };

    // Filter products
    const filteredProducts = products.filter((product) => {
        const matchesCategory = selectedCategory === "ALL" || 
            product.categoryId === selectedCategory ||
            product.categorySlug === selectedCategory ||
            product.categoryName?.toUpperCase() === selectedCategory.toUpperCase();
            
        const matchesCollection = selectedCollection === "ALL" ||
            product.collectionId === selectedCollection ||
            product.collectionSlug === selectedCollection ||
            product.collectionName?.toUpperCase() === selectedCollection.toUpperCase();

        const matchesSubCategory = selectedSubCategory === "ALL" ||
            product.subCategoryId === selectedSubCategory ||
            product.subCategorySlug === selectedSubCategory ||
            product.subCategoryName?.toUpperCase() === selectedSubCategory.toUpperCase();
            
        return matchesCategory && matchesCollection && matchesSubCategory;
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

    const ITEMS_PER_PAGE = 8;
    const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
    const activePage = currentPage > totalPages ? 1 : currentPage;
    const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
    const displayedProducts = sortedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    if (loading) {
        return (
            <div className="min-h-screen bg-white text-black flex flex-col font-sans">
                <Navbar solid={true} light={true} />
                <main className="flex-1 w-full pt-28 pb-20 px-6 sm:px-10 md:px-12 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-neutral-500 font-semibold">Loading collection...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Determine active tab context and list
    const isCategoryPage = !!categorySlug;
    const isCollectionPage = !!collectionSlug;

    const pillsList = isCategoryPage
        ? categories.map((c) => ({ id: c._id, slug: c.slug, name: c.Name }))
        : isCollectionPage
        ? collectionsList.map((c) => ({ id: c._id, slug: c.slug, name: c.Name }))
        : subCategoriesList.map((sc) => ({ id: sc._id, slug: sc.slug, name: sc.name }));

    const activeSelection = isCategoryPage
        ? selectedCategory
        : isCollectionPage
        ? selectedCollection
        : selectedSubCategory;

    const handlePillClick = (slugOrId) => {
        setCurrentPage(1);
        if (isCategoryPage) {
            setSelectedCategory(slugOrId);
            setSelectedCollection("ALL");
            setSelectedSubCategory("ALL");
            const newUrl = slugOrId === "ALL" ? "/products" : `/products/range/${slugOrId}`;
            window.history.pushState({}, "", newUrl);
        } else if (isCollectionPage) {
            setSelectedCategory("ALL");
            setSelectedCollection(slugOrId);
            setSelectedSubCategory("ALL");
            const newUrl = slugOrId === "ALL" ? "/products" : `/products/collection/${slugOrId}`;
            window.history.pushState({}, "", newUrl);
        } else {
            setSelectedCategory("ALL");
            setSelectedCollection("ALL");
            setSelectedSubCategory(slugOrId);
            const newUrl = slugOrId === "ALL" ? "/products" : `/products/tribe/${slugOrId}`;
            window.history.pushState({}, "", newUrl);
        }
    };

    return (
        <div className="min-h-screen bg-white text-black selection:bg-neutral-200 selection:text-black flex flex-col font-sans">
            <Navbar solid={true} light={true} />

            {/* Main Listing Wrapper */}
            <main className="flex-1 w-full pt-28 pb-20 px-6 sm:px-10 md:px-12 select-none">
                <div className="mx-auto max-w-[100%] flex flex-col">

                    {/* Breadcrumbs */}
                    <nav className="text-xs md:text-[1vw] text-neutral-400 font-normal mt-0">
                        <Link href="/" className="text-black transition-colors duration-200">Home</Link>
                        <span className="mx-1">/</span>
                        <span className="text-black">Products</span>
                    </nav>

                    {/* Page Header */}
                    <div className="mt-6 md:mt-8 space-y-6 md:space-y-3">
                        <h1 className="font-clashDisplay text-3xl md:text-[3vw] font-semibold tracking-tight text-black capitalize">
                            {getActiveTitle()}
                        </h1>

                        {/* Filters Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5">
                            {/* Left: Subcategory pills instead of Categories */}
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
                                <button
                                    onClick={() => handlePillClick("ALL")}
                                    className={`text-xs font-semibold tracking-wide uppercase whitespace-nowrap transition-all duration-200 cursor-pointer rounded-full px-2 py-1.5 border ${activeSelection === "ALL"
                                        ? "bg-[#F0EEE9] border-black text-black"
                                        : "bg-transparent border-transparent text-black hover:bg-[#F0EEE9]/50 hover:border-neutral-300"
                                        }`}
                                >
                                    All
                                </button>
                                {pillsList.map((item) => {
                                    const isSelected = activeSelection === item.id || 
                                        activeSelection === item.slug || 
                                        activeSelection === item.name;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handlePillClick(item.slug || item.id)}
                                            className={`text-xs font-semibold tracking-wide uppercase whitespace-nowrap transition-all duration-200 cursor-pointer rounded-full px-2 py-1.5 border ${isSelected
                                                ? "bg-[#F0EEE9] border-black text-black"
                                                : "bg-transparent border-transparent text-black hover:bg-[#F0EEE9]/50 hover:border-neutral-300"
                                                }`}
                                        >
                                            {item.name}
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

                    {/* Product Grid */}
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
