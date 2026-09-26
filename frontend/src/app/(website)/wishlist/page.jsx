"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useUserAuth } from "@/context/UserAuthContext";
import WishlistCard from "@/components/ui/WishlistCard";
import SelectOptionsModal from "@/components/ui/SelectOptionsModal";
import { API_BASE_URL, getImageUrl } from "@/lib/api";

export default function WishlistPage() {
    const { wishlistItems, removeFromWishlist, toggleWishlist, isInWishlist } = useWishlist();
    const { addToCart } = useCart();
    const { user } = useUserAuth();
    const [activeCategory, setActiveCategory] = useState("T-SHIRTS");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedProductForOptions, setSelectedProductForOptions] = useState(null);

    // Scroll to top on page change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentPage]);

    // Categorize wishlist items
    const categorizeItem = (item) => {
        const name = (item.name || item.title || "").toLowerCase();
        if (name.includes("hoodie") || name.includes("sweater") || name.includes("zip")) {
            return "HOODIES";
        }
        if (name.includes("accessory") || name.includes("bag") || name.includes("cap") || name.includes("mug")) {
            return "ACCESSORIES";
        }
        return "T-SHIRTS"; // Default category
    };

    const filteredWishlist = wishlistItems.filter(
        (item) => categorizeItem(item) === activeCategory
    );

    // Pagination constants
    const ITEMS_PER_PAGE = 8;
    const totalPages = Math.max(1, Math.ceil(filteredWishlist.length / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedWishlist = filteredWishlist.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const [exploreProducts, setExploreProducts] = useState([]);

    useEffect(() => {
        const fetchExplore = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/frontend/products`);
                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    const mapped = json.data.map(item => {
                        const colorsList = (item.colors || []).map(c => ({
                            name: c.color?.name || "Default",
                            hex: c.color?.hexCode || "#CCCCCC"
                        }));
                        const sizesList = item.sizeGuide?.chart?.map(sz => sz.size) || ["S", "M", "L"];
                        const mainImg = item.colors?.[0]?.images?.[0] || "";
                        
                        return {
                            id: item._id,
                            slug: item.slug,
                            name: item.title,
                            price: `Rs ${item.price}`,
                            priceNum: Number(item.price),
                            image: mainImg,
                            sizes: sizesList,
                            colors: colorsList,
                            tag: item.category?.Name || "Product",
                            rating: "4.7",
                            reviewsCount: 63
                        };
                    });
                    
                    const filtered = mapped.filter(
                        (p) => !wishlistItems.some((item) => item.id === p.id)
                    ).slice(0, 4);
                    
                    setExploreProducts(filtered);
                }
            } catch (err) {
                console.error("Failed to fetch explore products:", err);
            }
        };
        fetchExplore();
    }, [wishlistItems]);

    const handleAddToCart = (item) => {
        setSelectedProductForOptions(item);
    };

    const handleConfirmAddToCart = (product, quantity, size, color) => {
        addToCart(product, quantity, size, color);
        if (selectedProductForOptions) {
            removeFromWishlist(selectedProductForOptions);
        }
    };

    return (
        <div className="min-h-screen pt-17 bg-[#FAF9F6] text-black selection:bg-neutral-200">
            <Navbar light={true} />

            <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-10">
                {/* Breadcrumbs */}
                <nav className="text-xs text-neutral-400 font-normal">
                    <Link href="/" className="text-black hover:underline">Home</Link>
                    <span className="mx-1">/</span>
                    <span className="text-neutral-500">Wishlist</span>
                </nav>

                {/* Page Title */}
                <h1 className="heading-page text-black mt-4">
                    Wishlist
                </h1>

                {/* Filters & Actions Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 pb-5 border-b border-neutral-200/50">
                    {/* Category tabs */}
                    <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
                        {["T-SHIRTS", "HOODIES", "ACCESSORIES"].map((category) => {
                            const isActive = activeCategory === category;
                            return (
                                <button
                                    key={category}
                                    onClick={() => {
                                        setActiveCategory(category);
                                        setCurrentPage(1);
                                    }}
                                    className={`text-xs font-semibold tracking-wider uppercase whitespace-nowrap transition-colors duration-200 cursor-pointer relative py-1 ${isActive ? "text-black" : "text-neutral-400 hover:text-black"
                                        }`}
                                >
                                    {category}
                                    {isActive && (
                                        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Filter button */}
                    <button className="flex items-center bg-[#F4F0EA] gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-black hover:border-black transition-colors cursor-pointer self-end sm:self-auto">
                        Filter
                        <SlidersHorizontal className="stroke-2 w-3 h-3" />
                    </button>
                </div>

                {/* Wishlist Grid */}
                {!user ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 bg-[#F4F0EA] rounded-full flex items-center justify-center text-neutral-400 mb-4">
                            <Heart className="w-6 h-6 stroke-[1.25]" />
                        </div>
                        <h3 className="font-sans text-lg font-bold text-black">Log in to view your Wishlist</h3>
                        <p className="text-xs sm:text-sm text-neutral-400 max-w-[280px] mt-2 leading-relaxed">
                            Please log in to your account to view and manage items in your wishlist.
                        </p>
                        <Link
                            href="/login"
                            className="mt-6 px-6 py-2.5 bg-black text-white hover:bg-neutral-800 transition-colors rounded-full text-xs font-semibold"
                        >
                            Log In
                        </Link>
                    </div>
                ) : paginatedWishlist.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12 mt-10">
                        {paginatedWishlist.map((item) => (
                            <div key={item.id || item._id} className="w-full">
                                <WishlistCard 
                                    item={item} 
                                    onRemove={removeFromWishlist} 
                                    onAddToCart={handleAddToCart} 
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 bg-[#F4F0EA] rounded-full flex items-center justify-center text-neutral-400 mb-4">
                            <Heart className="w-6 h-6 stroke-[1.25]" />
                        </div>
                        <h3 className="font-sans text-lg font-bold text-black">Your wishlist is empty</h3>
                        <p className="text-xs sm:text-sm text-neutral-400 max-w-[280px] mt-2 leading-relaxed">
                            No items found in {activeCategory.toLowerCase()}. Explore our collection to add items.
                        </p>
                        <Link
                            href="/product-list"
                            className="mt-6 px-6 py-2.5 bg-black text-white hover:bg-neutral-800 transition-colors rounded-full text-xs font-semibold"
                        >
                            Explore Collection
                        </Link>
                    </div>
                )}

                {/* Pagination Controls */}
                {user && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-16">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-neutral-200 rounded-full hover:border-black transition-colors disabled:opacity-30 disabled:hover:border-neutral-200 cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${currentPage === page
                                            ? "bg-black text-white"
                                            : "hover:bg-neutral-100 text-black"
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-neutral-200 rounded-full hover:border-black transition-colors disabled:opacity-30 disabled:hover:border-neutral-200 cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Explore More Section */}
                {exploreProducts.length > 0 && (
                    <div className="mt-24 pt-16 border-t border-neutral-200/50">
                        <h2 className="heading-section text-center text-black mb-10">
                            YOU MAY ALSO LIKE
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {exploreProducts.map((product) => {
                                const isWish = isInWishlist(product.id);
                                return (
                                    <div
                                        key={product.id}
                                        className="group bg-white rounded-[24px] sm:rounded-[28px] border border-neutral-200/60 flex flex-col relative transition-all duration-300 hover:shadow-xs overflow-hidden w-full"
                                    >
                                        {/* Image Box */}
                                        <div className="relative w-full aspect-square bg-[#F4F0EA] flex items-center justify-center overflow-hidden rounded-[18px] sm:rounded-[22px]">
                                            {product.tag && (
                                                <div className="absolute top-3 left-3 z-10 bg-[#101820] text-white text-[8px] sm:text-[9px] font-bold tracking-wider px-3 rounded-full uppercase w-fit h-5 flex items-center justify-center">
                                                    {product.tag}
                                                </div>
                                            )}
                                            <button
                                                onClick={() => toggleWishlist(product)}
                                                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/40 backdrop-blur-xs hover:bg-white/60 transition-transform cursor-pointer shadow-xs flex items-center justify-center text-black"
                                                aria-label="Toggle Wishlist"
                                            >
                                                <Heart
                                                    className={`h-4.5 w-4.5 stroke-[1.5] ${isWish ? "fill-red-500 text-red-500 stroke-red-500" : ""}`}
                                                />
                                            </button>

                                            <Link
                                                href={`/products/${product.slug || product.id}`}
                                                className="relative w-[75%] h-[75%] transition-transform duration-300 group-hover:scale-105"
                                            >
                                                <Image
                                                    src={getImageUrl(product.image)}
                                                    alt={product.name}
                                                    fill
                                                    className="object-contain select-none"
                                                    sizes="(max-width: 640px) 40vw, 250px"
                                                    unoptimized
                                                />
                                            </Link>

                                            <div className="absolute bottom-3 left-3 z-10 bg-white border border-neutral-300/80 text-[10px] font-semibold text-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs select-none">
                                                <span className="text-black">★</span>
                                                <span>{product.rating || "4.7"} ({product.reviewsCount || 63})</span>
                                            </div>
                                        </div>

                                        {/* Bottom Content Section */}
                                        <div className="p-4 flex flex-col flex-grow">
                                            <div className="flex flex-col gap-1 flex-1">
                                                <h3 className="font-sans text-sm sm:text-base font-semibold text-black leading-snug line-clamp-1">
                                                    {product.name}
                                                </h3>
                                                <p className="font-clashDisplay text-lg sm:text-xl font-bold text-black mt-0.5">
                                                    {product.price}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => handleAddToCart(product)}
                                                className="w-full mt-4 py-2.5 bg-white border border-black rounded-full font-semibold text-xs sm:text-sm text-black hover:bg-black hover:text-white transition-all cursor-pointer text-center"
                                            >
                                                Add to Cart
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            {/* Select Options Modal */}
            <SelectOptionsModal
                isOpen={!!selectedProductForOptions}
                onClose={() => setSelectedProductForOptions(null)}
                product={selectedProductForOptions}
                onConfirmAddToCart={handleConfirmAddToCart}
            />

            <Footer />
        </div>
    );
}
