"use client";

import React, { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Plus, Minus, Star, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getProductById, allProducts } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import ProductCard from "@/components/ui/ProductCard";

export default function ProductDetailPage({ params }) {
    // Unwrap route parameter promise
    const { id } = use(params);
    const product = getProductById(id);
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    // States for interactive elements
    const [selectedSize, setSelectedSize] = useState("");
    const [selectedColor, setSelectedColor] = useState(
        product?.colors && product.colors.length > 0
            ? product.colors[0]
            : null
    );
    const [quantity, setQuantity] = useState(1);
    const isFavorite = isInWishlist(product?.id || "");
    const [expandedFaq, setExpandedFaq] = useState(null);

    if (!product) {
        return (
            <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center">
                <Navbar solid={true} light={true} />
                <div className="text-center py-20">
                    <h2 className="text-2xl font-bold">Product not found</h2>
                    <Link href="/" className="mt-4 text-blue-500 hover:underline inline-block">Back Home</Link>
                </div>
                <Footer />
            </div>
        );
    }

    const productImages = product.images && product.images.length > 0
        ? product.images
        : [
            product.image,
            "/images/landing-page/first.png",
            "/images/landing-page/second.png",
            "/images/landing-page/third.png"
        ];

    // Related products (exclude current)
    const relatedProducts = allProducts
        .filter((p) => p.id !== product.id)
        .slice(0, 4);

    // FAQ items
    const faqItems = [
        {
            question: "What sizes do you offer?",
            answer: "We offer sizes XS through XXL. Our garments are cut oversized, so we recommend checking the size guide or sizing down if you prefer a regular fit."
        },
        {
            question: "How do I care for my BacStory tee?",
            answer: "To preserve the graphic print and premium cotton fabric, machine wash inside out on a cold gentle cycle. Hang dry or tumble dry low. Do not iron directly on the graphics."
        },
        {
            question: "Do you ship internationally?",
            answer: "Yes, we ship to most countries worldwide. Shipping fees and delivery times vary by destination and will be calculated at checkout."
        },
        {
            question: "What is your return and exchange policy?",
            answer: "We accept returns and exchanges within 14 days of delivery. The item must be unworn, unwashed, and in its original packaging with all tags attached."
        },
        {
            question: "How long does delivery take?",
            answer: "Domestic orders typically arrive in 3-5 business days. International shipping can take between 7-14 business days depending on customs and local courier schedules."
        }
    ];

    const toggleFaq = (index) => {
        setExpandedFaq(expandedFaq === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-white text-black selection:bg-neutral-200 selection:text-black flex flex-col font-sans">
            <Navbar solid={true} light={true} />

            <main className="flex-1 w-full pt-28 pb-16 px-6 sm:px-10 md:px-16 lg:px-[4%] select-none">
                <div className="mx-auto max-w-[1600px] flex flex-col">

                    {/* Breadcrumbs */}
                    <nav className="text-xs md:text-sm text-neutral-400 font-normal mt-2">
                        <Link href="/" className="hover:text-black transition-colors duration-200">Home</Link>
                        <span className="mx-2">/</span>
                        <Link href="/products" className="hover:text-black transition-colors duration-200">{product.tag}</Link>
                        <span className="mx-2">/</span>
                        <span className="text-neutral-600 font-medium">{product.name}</span>
                    </nav>

                    {/* Top Detail Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 mt-8">

                        {/* Left: Stacked Image Gallery */}
                        <div className="lg:col-span-7 flex flex-col gap-4 w-full">
                            {/* Main Image */}
                            <div className="w-full aspect-[4/3] bg-[#F4F0EA] flex items-center justify-center overflow-hidden">
                                <div className="relative w-[80%] h-[80%]">
                                    <Image
                                        src={productImages[0]}
                                        alt={product.name}
                                        fill
                                        sizes="(max-width: 1024px) 100vw, 60vw"
                                        className="object-contain select-none"
                                        priority
                                    />
                                </div>
                            </div>

                            {/* Additional images */}
                            {productImages.length > 1 && (
                                <>
                                    {productImages.length >= 3 ? (
                                        <>
                                            {/* Row 2: Side-by-side split */}
                                            <div className="grid grid-cols-2 gap-4 w-full">
                                                <div className="aspect-square flex items-center justify-center overflow-hidden">
                                                    <div className="relative w-full h-full">
                                                        <Image
                                                            src={productImages[1]}
                                                            alt={`${product.name} detail 1`}
                                                            fill
                                                            sizes="(max-width: 1024px) 50vw, 30vw"
                                                            className="object-cover select-none"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="aspect-square flex items-center justify-center overflow-hidden">
                                                    <div className="relative w-full h-full">
                                                        <Image
                                                            src={productImages[2]}
                                                            alt={`${product.name} detail 2`}
                                                            fill
                                                            sizes="(max-width: 1024px) 50vw, 30vw"
                                                            className="object-cover select-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Row 3: Remainder full width images */}
                                            {productImages.slice(3).map((img, index) => (
                                                <div key={index} className="w-full aspect-[2/1] flex items-center justify-center overflow-hidden">
                                                    <div className="relative w-full h-full">
                                                        <Image
                                                            src={img}
                                                            alt={`${product.name} detail ${index + 3}`}
                                                            fill
                                                            sizes="(max-width: 1024px) 100vw, 60vw"
                                                            className="object-cover select-none"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        // Fallback for exactly 2 images: render second full width
                                        <div className="w-full aspect-[4/5] flex items-center justify-center overflow-hidden">
                                            <div className="relative w-full h-full">
                                                <Image
                                                    src={productImages[1]}
                                                    alt={`${product.name} detail 1`}
                                                    fill
                                                    sizes="(max-width: 1024px) 100vw, 60vw"
                                                    className="object-cover select-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Right: Info panel (Sticky on Desktop) */}
                        <div className="lg:col-span-5 lg:sticky lg:top-28 h-fit flex flex-col space-y-6">

                            {/* Title, Tag, and Stars Header */}
                            <div className="space-y-3">
                                <p className="text-xs md:text-base font-regular uppercase tracking-wider text-black">
                                    {product.tag}
                                </p>
                                <div className="flex justify-between items-start">
                                    <h1 className="font-geist text-3xl md:text-4xl lg:text-[2.5vw] font-semibold text-black tracking-tight leading-tight">
                                        {product.name}
                                    </h1>
                                    <button
                                        onClick={() => toggleWishlist(product)}
                                        className=" cursor-pointer ml-4 mt-1"
                                        aria-label="Add to favorites"
                                    >
                                        <Heart className={`h-9.5 w-9.5 transition-colors ${isFavorite ? "fill-red-500 text-red-500 stroke-red-500" : "text-black stroke-[1.5]"}`} />
                                    </button>
                                </div>

                                {/* Star Rating Review summary */}
                                <div className="flex items-center gap-1.5 pt-1">
                                    <div className="flex text-[#FFB800]">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-current stroke-none" />
                                        ))}
                                    </div>
                                    <span className="text-xs md:text-[1vw] font-semibold text-black">{product.rating}</span>
                                    <span className="text-xs md:text-[1vw] font-normal text-black">({product.reviewsCount})</span>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="pb-6 border-b border-neutral-200">
                                <div className="flex items-baseline gap-3">
                                    <p className="font-clashDisplay text-3xl md:text-[3vw] font-semibold text-black">
                                        {product.price}
                                    </p>
                                    {product.originalPrice && (
                                        <p className="font-clashDisplay text-xl md:text-[1.8vw] font-normal text-neutral-300 line-through">
                                            {product.originalPrice}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Size selector */}
                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between items-center text-xs md:text-sm">
                                    <span className="font-regular text-black">SIZE</span>
                                    <button className="text-neutral-400 hover:text-black transition-colors underline cursor-pointer">Size Guide</button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {product.sizes.map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`h-10 px-5 rounded-full border text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer ${selectedSize === size
                                                ? "bg-black border-black text-white"
                                                : "border-neutral-200 text-black hover:border-black"
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color Selector */}
                            {selectedColor && (
                                <div className="space-y-3 pt-2">
                                    <p className="text-xs md:text-sm font-semibold text-neutral-500">
                                        COLOUR: <span className="text-black font-semibold ml-1">{selectedColor.name}</span>
                                    </p>
                                    <div className="flex gap-3">
                                        {product.colors.map((color) => (
                                            <button
                                                key={color.name}
                                                onClick={() => setSelectedColor(color)}
                                                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${selectedColor.name === color.name
                                                    ? "border-black"
                                                    : "border-transparent"
                                                    }`}
                                            >
                                                <span
                                                    className="w-6 h-6 rounded-full border border-black/10"
                                                    style={{ backgroundColor: color.hex }}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quantity and Actions */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
                                {/* Quantity */}
                                <div className="flex items-center justify-between rounded-full bg-[#F3F3F3] p-1 h-14 w-full sm:w-34 select-none">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-11 h-11 rounded-full bg-[#FAF6F0] border border-[#D5C9B9]/60 flex items-center justify-center text-black cursor-pointer hover:bg-[#EADCC9] transition-all"
                                        aria-label="Decrease quantity"
                                    >
                                        <Minus className="w-5 h-5" strokeWidth={2} />
                                    </button>
                                    <span className="font-semibold text-[1.8vw] text-black text-center w-8">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-11 h-11 rounded-full bg-[#FAF6F0] border border-[#D5C9B9]/60 flex items-center justify-center text-black cursor-pointer hover:bg-[#EADCC9] transition-all"
                                        aria-label="Increase quantity"
                                    >
                                        <Plus className="w-5 h-5" strokeWidth={2} />
                                    </button>
                                </div>

                                {/* Add to Cart */}
                                <button
                                    onClick={() => {
                                        if (!selectedSize) {
                                            alert("Please select a size.");
                                            return;
                                        }
                                        addToCart(product, quantity, selectedSize, selectedColor);
                                    }}
                                    className="flex-1 h-14 bg-[#C5B9AC] text-black hover:bg-[#D4C9BD] transition-colors rounded-full font-medium text-[1vw] tracking-wide cursor-pointer"
                                >
                                    Add to Cart
                                </button>
                            </div>

                            {/* Buy Now */}
                            <button
                                onClick={() => {
                                    if (!selectedSize) {
                                        alert("Please select a size.");
                                        return;
                                    }
                                    addToCart(product, quantity, selectedSize, selectedColor);
                                }}
                                className="w-full h-14 bg-black text-white hover:bg-neutral-800 transition-colors rounded-full font-medium text-[1vw] tracking-wide cursor-pointer"
                            >
                                Buy Now
                            </button>

                            {/* Product Details Specs */}
                            <div className="space-y-4 pt-6 border-t border-neutral-200">
                                <p className="text-xs md:text-[0.8vw] font-semibold uppercase tracking-widest text-black">
                                    Product Details
                                </p>
                                <p className="text-sm md:text-[1vw] font-normal text-neutral-600 leading-relaxed font-sans">
                                    {product.description}
                                </p>

                                {/* Bullet details */}
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2 text-xs md:text-sm">
                                    <div>
                                        <span className="text-xs md:text-[0.8vw] font-semibold uppercase tracking-widest text-black">Material</span>
                                        <p className="text-sm md:text-[1vw] font-normal text-neutral-600 leading-relaxed font-sans">{product.details.material}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs md:text-[0.8vw] font-semibold uppercase tracking-widest text-black">Fit</span>
                                        <p className="text-sm md:text-[1vw] font-normal text-neutral-600 leading-relaxed font-sans">{product.details.fit}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs md:text-[0.8vw] font-semibold uppercase tracking-widest text-black">Weight</span>
                                        <p className="text-sm md:text-[1vw] font-normal text-neutral-600 leading-relaxed font-sans">{product.details.weight}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs md:text-[0.8vw] font-semibold uppercase tracking-widest text-black">Care</span>
                                        <p className="text-sm md:text-[1vw] font-normal text-neutral-600 leading-relaxed font-sans">{product.details.care}</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Reviews Section */}
                    <section className="mt-20 md:mt-28 pt-10 border-t border-neutral-200">
                        <h2 className="font-clashDisplay text-2xl md:text-3xl font-semibold text-black tracking-tight">
                            Reviews
                        </h2>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 mt-8">
                            {/* Left: Overall summary */}
                            <div className="lg:col-span-4 flex flex-col space-y-4">
                                <div className="space-y-1">
                                    <p className="font-clashDisplay text-5xl md:text-6xl font-bold text-black leading-none">
                                        {product.rating}
                                    </p>
                                    <div className="flex text-[#FFB800] pt-1">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-current stroke-none" />
                                        ))}
                                    </div>
                                    <p className="text-xs md:text-sm text-neutral-400 mt-1">
                                        Based on {product.reviewsCount} reviews
                                    </p>
                                </div>

                                {/* Progress Bars */}
                                <div className="space-y-2 pt-2 max-w-[280px]">
                                    {[
                                        { stars: 5, count: 48, percentage: 76 },
                                        { stars: 4, count: 10, percentage: 16 },
                                        { stars: 3, count: 3, percentage: 5 },
                                        { stars: 2, count: 1, percentage: 1.5 },
                                        { stars: 1, count: 1, percentage: 1.5 }
                                    ].map((row) => (
                                        <div key={row.stars} className="flex items-center gap-3 text-xs">
                                            <span className="w-3 text-neutral-500 font-semibold">{row.stars}</span>
                                            <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#DFD7CC] rounded-full" style={{ width: `${row.percentage}%` }} />
                                            </div>
                                            <span className="w-6 text-right text-neutral-400">{row.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right: Individual review posts */}
                            <div className="lg:col-span-8 flex flex-col divide-y divide-neutral-100">
                                {product.reviews.map((rev, index) => (
                                    <div key={index} className="py-6 first:pt-0 last:pb-0 space-y-2.5">
                                        <div className="flex items-center justify-between text-xs md:text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-black">{rev.author}</span>

                                            </div>
                                            <span className="text-neutral-400">{rev.date}</span>
                                        </div>
                                        <div className="flex flex-row gap-2">
                                            <div className="flex text-[#FFB800] space-x-0.5 ">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-3.5 h-3.5 fill-current ${i < rev.rating ? "text-[#FFB800] stroke-none" : "text-neutral-200 stroke-none"
                                                            }`}
                                                    />
                                                ))}

                                            </div>
                                            <span className="text-[10px] md:text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-medium">
                                                Verified Purchase
                                            </span>
                                        </div>
                                        {rev.images && rev.images.length > 0 && (
                                            <div className="flex gap-2.5 pt-1.5 pb-1">
                                                {rev.images.map((imgUrl, imgIdx) => (
                                                    <div key={imgIdx} className="relative w-20 h-20 rounded-lg overflow-hidden bg-neutral-50 border border-neutral-200 cursor-pointer transition-transform duration-200 hover:scale-105">
                                                        <Image
                                                            src={imgUrl}
                                                            alt={`Review attachment ${imgIdx + 1}`}
                                                            fill
                                                            sizes="80px"
                                                            className="object-cover select-none"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-sm md:text-base font-normal text-neutral-600 leading-snug font-sans pt-1">
                                            {rev.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 bg-neutral-50 rounded-2xl p-6 border border-neutral-100">
                            <div>
                                <h4 className="font-clashDisplay text-lg font-semibold text-black">Bought this piece?</h4>
                                <p className="text-sm text-neutral-500 mt-0.5">Share your story with the community.</p>
                            </div>
                            <button className="px-6 py-2.5 border border-black hover:bg-black hover:text-white rounded-full text-sm font-semibold transition-colors duration-300 cursor-pointer bg-white">
                                Write a Review
                            </button>
                        </div>
                    </section>

                    {/* Recommendation Grid ("You might also like") */}
                    <section className="mt-20 md:mt-28">
                        <h2 className="font-clashDisplay text-2xl md:text-3xl font-semibold text-black tracking-tight mb-8">
                            You might also like
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                            {relatedProducts.map((p) => (
                                <div key={p.id} className="w-full">
                                    <ProductCard product={p} isHome={false} isSmall={true} />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Frequently Asked Questions */}
                    <section className="mt-20 md:mt-28 pb-10">
                        <h2 className="font-clashDisplay text-2xl md:text-3xl font-semibold text-black tracking-tight mb-8">
                            Frequently Asked Questions
                        </h2>

                        <div className="divide-y divide-neutral-200 border-t border-b border-neutral-200">
                            {faqItems.map((item, index) => (
                                <div key={index} className="py-5">
                                    <button
                                        onClick={() => toggleFaq(index)}
                                        className="w-full flex items-center justify-between text-left font-sans text-sm md:text-base font-bold text-black cursor-pointer group"
                                    >
                                        <span>{item.question}</span>
                                        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-300 group-hover:text-black ${expandedFaq === index ? "rotate-180" : ""}`} />
                                    </button>

                                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedFaq === index ? "max-h-40 opacity-100 mt-3" : "max-h-0 opacity-0"}`}>
                                        <p className="text-xs md:text-sm font-normal text-neutral-500 leading-relaxed font-sans pb-1 max-w-3xl">
                                            {item.answer}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
}
