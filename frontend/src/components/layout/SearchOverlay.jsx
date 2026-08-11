"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { getImageUrl } from "@/lib/api";
import useSearchSuggestions from "@/hooks/useSearchSuggestions";

export default function SearchOverlay({ isOpen, onClose }) {
    const router = useRouter();
    const inputRef = useRef(null);
    const [query, setQuery] = useState("");

    const { results, total, loading, error } = useSearchSuggestions(isOpen ? query : "");

    const trimmedQuery = query.trim();
    const hasQuery = trimmedQuery.length >= 1;

    // Close on Escape key press
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Prevent body scroll while the overlay is open, and focus the input
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            const focusTimer = setTimeout(() => inputRef.current?.focus(), 60);
            return () => {
                clearTimeout(focusTimer);
                document.body.style.overflow = "";
            };
        }
        document.body.style.overflow = "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // Reset the field once the overlay has closed
    useEffect(() => {
        if (!isOpen) setQuery("");
    }, [isOpen]);

    const goToResults = () => {
        if (!trimmedQuery) return;
        router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
        onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        goToResults();
    };

    return (
        <>
            {/* Backdrop Overlay */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                onClick={onClose}
            />

            {/* Slide-down Search Panel */}
            <div
                className={`fixed top-0 left-0 w-full bg-[#FAF9F6] text-black shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-y-0" : "-translate-y-full"
                    }`}
                role="dialog"
                aria-modal="true"
                aria-label="Search products"
                inert={!isOpen}
            >
                <div className="mx-auto w-full max-w-3xl px-6 py-6 sm:py-8">
                    {/* Header row */}
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="font-clashDisplay text-2xl font-semibold text-black">Search</h2>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer text-neutral-500 hover:text-black"
                            aria-label="Close search"
                        >
                            <X className="w-6 h-6 stroke-[1.5]" />
                        </button>
                    </div>

                    {/* Search Input */}
                    <form onSubmit={handleSubmit} className="mt-5">
                        <div className="flex items-center gap-3 bg-white border border-neutral-200 focus-within:border-black rounded-full px-5 py-3 transition-colors">
                            <Image
                                src="/images/landing-page/search.svg"
                                alt=""
                                width={18}
                                height={18}
                                className="h-4.5 w-4.5 object-contain shrink-0 invert opacity-70"
                            />
                            <input
                                ref={inputRef}
                                type="text"
                                autoComplete="off"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search for products, colours, categories..."
                                className="flex-1 bg-transparent outline-none text-sm sm:text-base text-black placeholder:text-neutral-400"
                                aria-label="Search products"
                            />
                        </div>
                    </form>

                    {/* Results Area */}
                    <div className="mt-5 max-h-[55vh] overflow-y-auto">


                        {hasQuery && loading && (
                            <div className="space-y-3 py-2">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 animate-pulse">
                                        <div className="w-14 h-16 bg-neutral-100 rounded-lg shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3.5 bg-neutral-100 rounded w-2/5" />
                                            <div className="h-3 bg-neutral-100 rounded w-1/5" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {hasQuery && !loading && error && (
                            <div className="py-8 text-center space-y-1">
                                <p className="text-sm font-semibold text-black">Search is unavailable right now.</p>
                                <p className="text-xs text-neutral-400">{error}</p>
                            </div>
                        )}

                        {hasQuery && !loading && !error && results.length === 0 && (
                            <div className="py-8 text-center space-y-1">
                                <p className="text-sm font-semibold text-black">
                                    No products found for &ldquo;{trimmedQuery}&rdquo;
                                </p>
                                <p className="text-xs text-neutral-400">
                                    Try a different keyword, colour or category.
                                </p>
                            </div>
                        )}

                        {hasQuery && !loading && !error && results.length > 0 && (
                            <div className="space-y-1">
                                {results.map((product) => (
                                    <Link
                                        key={product.id}
                                        href={product.link}
                                        onClick={onClose}
                                        className="flex items-center gap-4 p-2 rounded-xl hover:bg-[#F4F0EA] transition-colors"
                                    >
                                        <div className="relative w-14 h-16 bg-[#F4F0EA] rounded-lg overflow-hidden shrink-0">
                                            <Image
                                                src={getImageUrl(product.image)}
                                                alt={product.name}
                                                fill
                                                sizes="56px"
                                                className="object-contain select-none"
                                                unoptimized
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-black truncate">{product.name}</p>
                                            {product.tag && (
                                                <p className="text-[11px] text-neutral-400 uppercase tracking-wider truncate">
                                                    {product.tag}
                                                </p>
                                            )}
                                        </div>
                                        <p className="font-clashDisplay text-sm font-semibold text-black shrink-0">
                                            {product.price}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* View all results */}
                    {hasQuery && !loading && !error && total > 0 && (
                        <div className="pt-4 mt-2 border-t border-neutral-200/80">
                            <button
                                onClick={goToResults}
                                className="w-full py-3 rounded-full bg-[#101820] text-white font-semibold text-xs sm:text-sm hover:bg-black transition-colors cursor-pointer"
                            >
                                View all {total} {total === 1 ? "result" : "results"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
