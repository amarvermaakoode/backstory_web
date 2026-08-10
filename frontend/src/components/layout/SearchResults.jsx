"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import ProductCard from "@/components/ui/ProductCard";
import FilterDrawer from "@/components/ui/FilterDrawer";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { searchProducts, SEARCH_PAGE_SIZE } from "@/services/searchService";

const parseList = (value) => (value ? value.split(",").filter(Boolean) : []);

export default function SearchResults() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const paramsKey = searchParams.toString();

    const query = (searchParams.get("q") || "").trim();
    const currentPage = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
    const sortBy = searchParams.get("sort") || "featured";

    // Filter state lives in the URL so refresh / back / forward / sharing all work
    const drawerFilters = useMemo(() => {
        const params = new URLSearchParams(paramsKey);
        const rawMax = params.get("maxPrice");
        return {
            minPrice: Number(params.get("minPrice")) || 0,
            maxPrice: rawMax ? Number(rawMax) : Infinity,
            gender: params.get("gender") || "ALL",
            sizes: parseList(params.get("sizes")),
            series: parseList(params.get("series")),
            colors: parseList(params.get("colors"))
        };
    }, [paramsKey]);

    const [products, setProducts] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [maxCatalogPrice, setMaxCatalogPrice] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    // Params the current results belong to, so results from the previous
    // query are never presented as the answer to the new one
    const [loadedKey, setLoadedKey] = useState(null);

    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const sortDropdownRef = useRef(null);

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

    // Scroll to top whenever pagination page changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentPage]);

    // Server-side search. Any in-flight request is aborted when the query,
    // filters, sorting or page changes, so a stale response can never win.
    useEffect(() => {
        if (!query) {
            setProducts([]);
            setTotal(0);
            setTotalPages(0);
            setLoading(false);
            setError(null);
            return;
        }

        const controller = new AbortController();
        setLoading(true);
        setError(null);

        searchProducts({
            q: query,
            page: currentPage,
            limit: SEARCH_PAGE_SIZE,
            sort: sortBy,
            filters: drawerFilters,
            signal: controller.signal
        })
            .then((data) => {
                if (controller.signal.aborted) return;
                setProducts(data.products);
                setTotal(data.total);
                setTotalPages(data.totalPages);
                if (data.maxPrice) setMaxCatalogPrice(data.maxPrice);
                setLoadedKey(paramsKey);
                setLoading(false);
            })
            .catch((err) => {
                if (controller.signal.aborted || err?.name === "AbortError") return;
                setProducts([]);
                setTotal(0);
                setTotalPages(0);
                setError(err?.message || "Unable to load search results.");
                setLoadedKey(paramsKey);
                setLoading(false);
            });

        return () => controller.abort();
    }, [query, currentPage, sortBy, drawerFilters, paramsKey, reloadKey]);

    // True from the moment the params change until that request settles
    const isPending = Boolean(query) && (loading || loadedKey !== paramsKey);

    // A page beyond the result set (typed directly, or left over from a
    // narrower filter) falls back to the first page
    useEffect(() => {
        if (isPending || error || totalPages <= 0 || currentPage <= totalPages) return;
        const params = new URLSearchParams(paramsKey);
        params.delete("page");
        router.replace(`/search?${params.toString()}`);
    }, [isPending, error, totalPages, currentPage, paramsKey, router]);

    // Push updated search state into the URL
    const updateParams = (updates, { resetPage = true } = {}) => {
        const params = new URLSearchParams(paramsKey);
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === undefined || value === "") {
                params.delete(key);
            } else {
                params.set(key, String(value));
            }
        });
        if (resetPage) params.delete("page");
        router.push(`/search?${params.toString()}`);
    };

    const handleApplyFilters = (filters) => {
        const effectiveMax = maxCatalogPrice || 10000;
        updateParams({
            gender: filters.gender && filters.gender !== "ALL" ? filters.gender : null,
            minPrice: filters.minPrice > 0 ? filters.minPrice : null,
            maxPrice:
                Number.isFinite(filters.maxPrice) && filters.maxPrice > 0 && filters.maxPrice < effectiveMax
                    ? filters.maxPrice
                    : null,
            sizes: filters.sizes?.length ? filters.sizes.join(",") : null,
            series: filters.series?.length ? filters.series.join(",") : null,
            colors: filters.colors?.length ? filters.colors.join(",") : null
        });
    };

    const activePage = currentPage;

    // Product Grid rendering
    const renderProductGrid = () => {
        if (isPending) {
            return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-4 gap-y-12 md:gap-y-16 mt-10">
                    {Array.from({ length: SEARCH_PAGE_SIZE }).map((_, i) => (
                        <div key={i} className="w-full space-y-3 animate-pulse">
                            <div className="w-full aspect-[4/5] bg-neutral-100 rounded-xl"></div>
                            <div className="h-4 bg-neutral-100 rounded w-3/4"></div>
                            <div className="h-4 bg-neutral-100 rounded w-1/4"></div>
                        </div>
                    ))}
                </div>
            );
        }

        if (error) {
            return (
                <div className="py-20 text-center space-y-4">
                    <p className="text-neutral-900 text-base font-semibold">Search is unavailable right now.</p>
                    <p className="text-neutral-500 text-sm">{error}</p>
                    <button
                        onClick={() => setReloadKey((k) => k + 1)}
                        className="px-6 py-2 border border-black hover:bg-black hover:text-white transition-colors rounded-full text-xs font-semibold cursor-pointer text-black bg-transparent"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        if (!query) {
            return (
                <div className="py-20 text-center">
                    <p className="text-neutral-500 text-base">
                        Enter a keyword to search our collection.
                    </p>
                </div>
            );
        }

        if (products.length > 0) {
            return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-4 gap-y-12 md:gap-y-16 mt-10">
                    {products.map((product) => (
                        <div key={product.id} className="w-full">
                            <ProductCard product={product} isHome={false} isSmall={true} />
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <div className="py-20 text-center space-y-2">
                <p className="text-neutral-900 text-base font-semibold">
                    No products found for &ldquo;{query}&rdquo;
                </p>
                <p className="text-neutral-500 text-sm">
                    Try a different keyword, or clear your filters.
                </p>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-white text-black selection:bg-neutral-200 selection:text-black flex flex-col font-sans">
            <Navbar solid={true} light={true} />

            {/* Main Listing Wrapper */}
            <main className="flex-1 w-full pt-28 pb-20 px-6 sm:px-10 md:px-12">
                <div className="mx-auto max-w-[100%] flex flex-col">

                    {/* Breadcrumbs */}
                    <nav className="text-xs md:text-[1vw] text-neutral-400 font-normal mt-0">
                        <Link href="/" className="text-black transition-colors duration-200">Home</Link>
                        <span className="mx-1">/</span>
                        <span className="text-black">Search</span>
                    </nav>

                    {/* Page Header */}
                    <div className="mt-6 md:mt-8 space-y-6 md:space-y-3">
                        <h1 className="heading-page text-black">
                            {query ? `Search results for “${query}”` : "Search"}
                        </h1>

                        {/* Filters Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5">
                            {/* Left: Result count */}
                            <div className="flex items-center gap-1 py-1">
                                <span className="text-xs font-semibold tracking-wide uppercase text-neutral-500">
                                    {isPending || error || !query
                                        ? " "
                                        : `${total} ${total === 1 ? "product" : "products"} found`}
                                </span>
                            </div>

                            {/* Right: Sort and Filter */}
                            <div className="flex items-center gap-[8px] self-start sm:self-auto" ref={sortDropdownRef}>
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
                                                        updateParams({ sort: option.value === "featured" ? null : option.value });
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
                                <button
                                    onClick={() => setIsFilterDrawerOpen(true)}
                                    className="flex items-center bg-[#F4F0EA] gap-2 px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold text-black hover:bg-neutral-200 transition-colors cursor-pointer"
                                >
                                    Filter
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Product Grid */}
                    {renderProductGrid()}

                    {/* Pagination Controls */}
                    {!isPending && !error && totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-16">
                            {/* Prev Button */}
                            <button
                                disabled={activePage === 1}
                                onClick={() => updateParams({ page: activePage - 1 }, { resetPage: false })}
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
                                    onClick={() => updateParams({ page }, { resetPage: false })}
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
                                onClick={() => updateParams({ page: activePage + 1 }, { resetPage: false })}
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

            <FilterDrawer
                isOpen={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                initialFilters={drawerFilters}
                maxCatalogPrice={maxCatalogPrice || 10000}
                onApplyFilters={handleApplyFilters}
            />
            <Footer />
        </div>
    );
}
