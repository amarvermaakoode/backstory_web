"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Plus, Minus, Star, ChevronDown, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getProductById, allProducts } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import ProductCard from "@/components/ui/ProductCard";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

const renderStars = (rating, sizeClass = "w-4 h-4") => {
    const ratingNum = Number(rating) || 0;
    return (
        <div className="flex items-center text-[#FFB800] relative">
            {/* SVG Gradient definition */}
            <svg width="0" height="0" className="absolute">
                <defs>
                    <linearGradient id="halfStarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="50%" stopColor="#FFB800" />
                        <stop offset="50%" stopColor="#E5E7EB" />
                    </linearGradient>
                </defs>
            </svg>

            {Array.from({ length: 5 }).map((_, i) => {
                const starValue = i + 1;
                if (ratingNum >= starValue) {
                    return <Star key={i} className={`${sizeClass} fill-current stroke-none`} />;
                } else if (ratingNum > starValue - 1 && ratingNum < starValue) {
                    return <Star key={i} className={`${sizeClass} stroke-none`} style={{ fill: "url(#halfStarGrad)" }} />;
                } else {
                    return <Star key={i} className={`${sizeClass} text-neutral-200 fill-[#E5E7EB] stroke-none`} />;
                }
            })}
        </div>
    );
};

const fallbackReviews = [
    {
        author: "Arjun M.",
        rating: 5,
        date: "June 2026",
        images: [
            "/images/landing-page/review1.png",
            "/images/landing-page/review2.png"
        ],
        text: "This tee is everything. The graphic is insane quality and the weight of the fabric feels premium. Already ordered two more. Can't wait."
    },
    {
        author: "Priya S.",
        rating: 4,
        date: "June 2026",
        text: "Great oversized fit and the wash gives it that lived-in texture. Runs slightly large, which I actually love. Wash care instructions are spot on."
    },
    {
        author: "Kabir R.",
        rating: 4,
        date: "June 2026",
        text: "The Biker Series concept is brilliant. This isn't just a t-shirt — it's a piece of art that starts conversations. Will definitely be back for more."
    }
];

export default function ProductDetailPage({ params }) {
    // Unwrap route parameter promise
    const { id } = use(params);
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);

    // States for interactive elements
    const [selectedSize, setSelectedSize] = useState("");
    const [selectedColor, setSelectedColor] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [expandedFaq, setExpandedFaq] = useState(null);

    // States for reviews
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewAuthor, setReviewAuthor] = useState("");
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewText, setReviewText] = useState("");
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    const isFavorite = isInWishlist(product?.id || "");

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!reviewAuthor.trim() || !reviewText.trim()) return;

        try {
            setReviewSubmitting(true);
            const res = await fetch(`${API_BASE_URL}/frontend/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    product: product.id,
                    author: reviewAuthor,
                    rating: reviewRating,
                    text: reviewText,
                }),
            });

            const json = await res.json();
            if (json.success) {
                alert("Thank you! Your review has been submitted successfully.");
                setIsReviewModalOpen(false);
                setReviewAuthor("");
                setReviewRating(5);
                setReviewText("");
                
                // Reload product data dynamically by fetching again
                const fetchUpdatedProductData = async () => {
                    try {
                        const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
                        if (isMongoId) {
                            const res = await fetch(`${API_BASE_URL}/frontend/products/${id}`);
                            const json = await res.json();
                            if (json.success && json.data) {
                                const dbProd = json.data;
                                const mapped = {
                                    id: dbProd._id,
                                    name: dbProd.title,
                                    price: `Rs ${dbProd.price}`,
                                    priceNum: Number(dbProd.price),
                                    image: dbProd.colors?.[0]?.images?.[0] || "",
                                    tag: dbProd.subCategory?.name || dbProd.category?.Name || "Product",
                                    rating: dbProd.rating || "4.7",
                                    reviewsCount: dbProd.reviewsCount || 63,
                                    description: dbProd.description || "",
                                    details: {
                                        material: dbProd.material || "100% Cotton",
                                        fit: dbProd.fit || "Standard Fit",
                                        weight: dbProd.weight || "240 GSM",
                                        care: dbProd.care || "Machine wash cold"
                                    },
                                    colors: (dbProd.colors || []).map(c => ({
                                        name: c.color?.name || "Default",
                                        hex: c.color?.hexCode || "#CCCCCC",
                                        images: c.images || []
                                    })),
                                    sizes: dbProd.sizeGuide?.chart?.map(sz => sz.size) || ["S", "M", "L"],
                                    reviews: dbProd.reviews && dbProd.reviews.length > 0 ? dbProd.reviews : fallbackReviews,
                                    faqs: dbProd.faqs || []
                                };
                                setProduct(mapped);
                            }
                        }
                    } catch (err) {
                        console.error(err);
                    }
                };
                fetchUpdatedProductData();
            } else {
                alert(json.message || "Failed to submit review.");
            }
        } catch (err) {
            console.error("Error submitting review:", err);
            alert("Error submitting review. Please try again.");
        } finally {
            setReviewSubmitting(false);
        }
    };

    const getImageUrl = (path) => {
        if (!path) return "/images/placeholder.png";
        if (path.startsWith("http") || path.startsWith("data:")) return path;
        if (path.startsWith("/images/")) return path;
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        return `${apiBase}${path.startsWith("/") ? "" : "/"}${path}`;
    };

    useEffect(() => {
        const fetchProductData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Attempt database fetch first (supports both ID and slug)
                try {
                    const res = await fetch(`${API_BASE_URL}/frontend/products/${id}`);
                    const json = await res.json();
                    if (json.success && json.data) {
                        const dbProd = json.data;
                        const mapped = {
                            id: dbProd._id,
                            name: dbProd.title,
                            price: `Rs ${dbProd.price}`,
                            priceNum: Number(dbProd.price),
                            image: dbProd.colors?.[0]?.images?.[0] || "",
                            tag: dbProd.subCategory?.name || dbProd.category?.Name || "Product",
                            rating: dbProd.rating || "4.7",
                            reviewsCount: dbProd.reviewsCount || 63,
                            description: dbProd.description || "",
                            details: {
                                material: dbProd.material || "100% Cotton",
                                fit: dbProd.fit || "Standard Fit",
                                weight: dbProd.weight || "240 GSM",
                                care: dbProd.care || "Machine wash cold"
                            },
                            colors: (dbProd.colors || []).map(c => ({
                                name: c.color?.name || "Default",
                                hex: c.color?.hexCode || "#CCCCCC",
                                images: c.images || []
                            })),
                            sizes: dbProd.sizeGuide?.chart?.map(sz => sz.size) || ["S", "M", "L"],
                            reviews: dbProd.reviews && dbProd.reviews.length > 0 ? dbProd.reviews : fallbackReviews,
                            faqs: dbProd.faqs || []
                        };
                        setProduct(mapped);
                        
                        if (mapped.colors && mapped.colors.length > 0) {
                            setSelectedColor(mapped.colors[0]);
                        }
                        
                        // Fetch related
                        fetchRelated(dbProd._id, dbProd.subCategory?._id, dbProd.category?._id);
                        setLoading(false);
                        return;
                    }
                } catch (apiErr) {
                    console.warn("Backend fetch failed, trying mock fallback:", apiErr);
                }
                
                // Fallback to mock product
                const mockProduct = getProductById(id);
                if (mockProduct) {
                    setProduct(mockProduct);
                    if (mockProduct.colors && mockProduct.colors.length > 0) {
                        setSelectedColor(mockProduct.colors[0]);
                    }
                    const related = allProducts
                        .filter((p) => p.id !== mockProduct.id)
                        .slice(0, 4);
                    setRelatedProducts(related);
                } else {
                    setError("Product not found");
                }
            } catch (err) {
                console.error("Error fetching product:", err);
                const mockProduct = getProductById(id);
                if (mockProduct) {
                    setProduct(mockProduct);
                    if (mockProduct.colors && mockProduct.colors.length > 0) {
                        setSelectedColor(mockProduct.colors[0]);
                    }
                    const related = allProducts
                        .filter((p) => p.id !== mockProduct.id)
                        .slice(0, 4);
                    setRelatedProducts(related);
                } else {
                    setError("Failed to load product");
                }
            } finally {
                setLoading(false);
            }
        };

        const fetchRelated = async (currentId, subCategoryId, categoryId) => {
            try {
                let url = `${API_BASE_URL}/frontend/products`;
                if (subCategoryId) {
                    url += `?subCategory=${subCategoryId}`;
                } else if (categoryId) {
                    url += `?category=${categoryId}`;
                }
                const res = await fetch(url);
                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    const mapped = json.data
                        .filter(item => item._id !== currentId)
                        .map(item => {
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
                                tag: item.subCategory?.name || item.category?.Name || "Product",
                                link: `/products/${item.slug || item._id}`
                            };
                        })
                        .slice(0, 4);
                    
                    if (mapped.length > 0) {
                        setRelatedProducts(mapped);
                    } else {
                        fetchFallbackRelated(currentId);
                    }
                } else {
                    fetchFallbackRelated(currentId);
                }
            } catch (err) {
                console.error("Error fetching related products:", err);
                fetchFallbackRelated(currentId);
            }
        };

        const fetchFallbackRelated = async (currentId) => {
            try {
                const res = await fetch(`${API_BASE_URL}/frontend/products`);
                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    const mapped = json.data
                        .filter(item => item._id !== currentId)
                        .map(item => {
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
                                tag: item.subCategory?.name || item.category?.Name || "Product",
                                link: `/products/${item.slug || item._id}`
                            };
                        })
                        .slice(0, 4);
                    setRelatedProducts(mapped);
                } else {
                    const related = allProducts
                        .filter((p) => p.id !== currentId)
                        .slice(0, 4);
                    setRelatedProducts(related);
                }
            } catch (e) {
                const related = allProducts
                    .filter((p) => p.id !== currentId)
                    .slice(0, 4);
                setRelatedProducts(related);
            }
        };

        fetchProductData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white text-black flex flex-col font-sans">
                <Navbar solid={true} light={true} />
                <main className="flex-1 w-full pt-28 pb-16 px-6 sm:px-10 md:px-16 lg:px-[4%] animate-pulse">
                    <div className="mx-auto max-w-[1600px] flex flex-col">
                        <div className="h-4 bg-neutral-200 rounded w-1/4 mb-8"></div>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
                            <div className="lg:col-span-7 flex flex-col gap-4">
                                <div className="w-full aspect-[4/3] bg-neutral-200 rounded-lg"></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="aspect-square bg-neutral-200 rounded-lg"></div>
                                    <div className="aspect-square bg-neutral-200 rounded-lg"></div>
                                </div>
                            </div>
                            <div className="lg:col-span-5 space-y-6">
                                <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
                                <div className="h-10 bg-neutral-200 rounded w-3/4"></div>
                                <div className="h-6 bg-neutral-200 rounded w-1/4"></div>
                                <div className="h-12 bg-neutral-200 rounded-full w-full"></div>
                                <div className="h-12 bg-neutral-200 rounded-full w-full"></div>
                                <div className="h-40 bg-neutral-200 rounded-lg w-full"></div>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center">
                <Navbar solid={true} light={true} />
                <div className="text-center py-20">
                    <h2 className="text-2xl font-bold">{error || "Product not found"}</h2>
                    <Link href="/" className="mt-4 text-blue-500 hover:underline inline-block">Back Home</Link>
                </div>
                <Footer />
            </div>
        );
    }

    // Image gallery resolution
    let productImages = [];
    if (selectedColor && selectedColor.images && selectedColor.images.length > 0) {
        productImages = selectedColor.images;
    } else {
        productImages = (product.colors || []).flatMap(c => c.images || []);
    }
    
    if (productImages.length === 0) {
        productImages = [
            "/images/placeholder.png",
            "/images/landing-page/first.png",
            "/images/landing-page/second.png",
            "/images/landing-page/third.png"
        ];
    }

    // FAQ items
    const faqItems = product && product.faqs && product.faqs.length > 0 ? product.faqs : [
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
                        <Link href="/product-list" className="hover:text-black transition-colors duration-200">{product.tag}</Link>
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
                                        src={getImageUrl(productImages[0])}
                                        alt={product.name}
                                        fill
                                        sizes="(max-width: 1024px) 100vw, 60vw"
                                        className="object-contain select-none"
                                        priority
                                        unoptimized
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
                                                            src={getImageUrl(productImages[1])}
                                                            alt={`${product.name} detail 1`}
                                                            fill
                                                            sizes="(max-width: 1024px) 50vw, 30vw"
                                                            className="object-cover select-none"
                                                            unoptimized
                                                        />
                                                    </div>
                                                </div>
                                                <div className="aspect-square flex items-center justify-center overflow-hidden">
                                                    <div className="relative w-full h-full">
                                                        <Image
                                                            src={getImageUrl(productImages[2])}
                                                            alt={`${product.name} detail 2`}
                                                            fill
                                                            sizes="(max-width: 1024px) 50vw, 30vw"
                                                            className="object-cover select-none"
                                                            unoptimized
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Row 3: Remainder full width images */}
                                            {productImages.slice(3).map((img, index) => (
                                                <div key={index} className="w-full aspect-[2/1] flex items-center justify-center overflow-hidden">
                                                    <div className="relative w-full h-full">
                                                        <Image
                                                            src={getImageUrl(img)}
                                                            alt={`${product.name} detail ${index + 3}`}
                                                            fill
                                                            sizes="(max-width: 1024px) 100vw, 60vw"
                                                            className="object-cover select-none"
                                                            unoptimized
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
                                                    src={getImageUrl(productImages[1])}
                                                    alt={`${product.name} detail 1`}
                                                    fill
                                                    sizes="(max-width: 1024px) 100vw, 60vw"
                                                    className="object-cover select-none"
                                                    unoptimized
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
                                    {renderStars(product.rating)}
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
                                        {renderStars(product.rating)}
                                    </div>
                                    <p className="text-xs md:text-sm text-neutral-400 mt-1">
                                        Based on {product.reviewsCount} reviews
                                    </p>
                                </div>

                                {/* Progress Bars */}
                                <div className="space-y-2 pt-2 max-w-[280px]">
                                    {(() => {
                                        const revs = product.reviews || [];
                                        const totalRevs = revs.length;
                                        const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
                                        revs.forEach(r => {
                                            const val = Math.round(Number(r.rating));
                                            if (counts[val] !== undefined) counts[val]++;
                                        });
                                        return [5, 4, 3, 2, 1].map(stars => {
                                            const count = counts[stars];
                                            const percentage = totalRevs > 0 ? (count / totalRevs) * 100 : 0;
                                            return (
                                                <div key={stars} className="flex items-center gap-3 text-xs">
                                                    <span className="w-3 text-neutral-500 font-semibold">{stars}</span>
                                                    <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#DFD7CC] rounded-full" style={{ width: `${percentage}%` }} />
                                                     </div>
                                                     <span className="w-6 text-right text-neutral-400">{count}</span>
                                                 </div>
                                            );
                                        });
                                    })()}
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
                            <button 
                                onClick={() => setIsReviewModalOpen(true)}
                                className="px-6 py-2.5 border border-black hover:bg-black hover:text-white rounded-full text-sm font-semibold transition-colors duration-300 cursor-pointer bg-white"
                            >
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

                    {/* Review Submission Modal */}
                    {isReviewModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                            <div className="bg-white text-black w-full max-w-lg mx-4 rounded-3xl p-8 border border-neutral-100 shadow-2xl relative animate-scaleUp">
                                {/* Close button */}
                                <button 
                                    onClick={() => setIsReviewModalOpen(false)}
                                    className="absolute top-6 right-6 text-neutral-400 hover:text-black transition-colors cursor-pointer"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                <h3 className="font-clashDisplay text-2xl font-bold mb-2">Share Your Story</h3>
                                <p className="text-sm text-neutral-500 mb-6">Let other buyers know your thoughts on this piece.</p>

                                <form onSubmit={handleReviewSubmit} className="space-y-5">
                                    {/* Author Name */}
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-neutral-600">Your Name</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={reviewAuthor}
                                            onChange={(e) => setReviewAuthor(e.target.value)}
                                            placeholder="e.g. John Doe"
                                            className="w-full h-12 px-4 rounded-xl border border-neutral-200 focus:border-black focus:outline-none transition-colors text-sm font-sans"
                                        />
                                    </div>

                                    {/* Rating Stars Selection */}
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-neutral-600">Rating</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setReviewRating(star)}
                                                    className="text-neutral-300 hover:scale-110 transition-transform cursor-pointer"
                                                >
                                                    <Star 
                                                        className={`w-8 h-8 ${star <= reviewRating ? "text-[#FFB800] fill-[#FFB800]" : "text-neutral-200"}`} 
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Review Text */}
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-neutral-600">Review</label>
                                        <textarea 
                                            required
                                            rows={4}
                                            value={reviewText}
                                            onChange={(e) => setReviewText(e.target.value)}
                                            placeholder="Tell us about the fit, material, and how it feels..."
                                            className="w-full p-4 rounded-xl border border-neutral-200 focus:border-black focus:outline-none transition-colors text-sm font-sans resize-none"
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={reviewSubmitting}
                                        className="w-full h-14 bg-black text-white hover:bg-neutral-800 transition-colors rounded-full font-medium text-sm tracking-wide cursor-pointer disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {reviewSubmitting ? "Submitting..." : "Submit Review"}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

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
