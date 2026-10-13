"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Plus, Minus, Star, ChevronDown, X, AlertCircle, CheckCircle2, XCircle, Camera, Video, Trash2, Play, ChevronLeft, ChevronRight, ZoomIn, Loader } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useUserAuth } from "@/context/UserAuthContext";
import ProductCard from "@/components/ui/ProductCard";
import { API_BASE_URL, getImageUrl } from "@/lib/api";
import { getStockForSizeAndColor } from "@/lib/stock";

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

// Map a backend product document to the detail-page view model.
const mapProductDetail = (dbProd) => ({
    id: dbProd._id,
    name: dbProd.title,
    price: `Rs ${dbProd.price}`,
    priceNum: Number(dbProd.price),
    image: dbProd.colors?.[0]?.images?.[0] || "",
    tag: dbProd.subCategory?.name || dbProd.category?.Name || "",
    rating: dbProd.rating || "",
    reviewsCount: dbProd.reviewsCount || (dbProd.reviews ? dbProd.reviews.length : 0),
    description: dbProd.description || "",
    details: {
        material: dbProd.material || "",
        fit: dbProd.fit || "",
        weight: dbProd.weight || "",
        care: dbProd.care || ""
    },
    colors: (dbProd.colors || []).map(c => ({
        name: c.color?.name || "",
        hex: c.color?.hexCode || "#CCCCCC",
        images: c.images || []
    })),
    sizes: dbProd.sizeGuide?.chart?.map(sz => sz.size) || [],
    reviews: (dbProd.reviews || []).map(r => ({
        id: r.id || r._id,
        userId: (r.userId || r.user?._id || r.user || "")?.toString(),
        author: r.author,
        rating: r.rating,
        text: r.text,
        photos: r.photos || r.images || [],
        videos: r.videos || [],
        date: r.date || "Recently"
    })),
    faqs: dbProd.faqs || [],
    variantStock: dbProd.variantStock || {}
});

// Map a backend product document to the "related product" card view model.
const mapRelatedProduct = (item) => {
    const colorsList = (item.colors || []).map(c => ({
        name: c.color?.name || "",
        hex: c.color?.hexCode || "#CCCCCC"
    }));
    const sizesList = item.sizeGuide?.chart?.map(sz => sz.size) || [];
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
        tag: item.subCategory?.name || item.category?.Name || "",
        link: `/products/${item.slug || item._id}`,
        variantStock: item.variantStock || {}
    };
};

// Group gallery images into alternating square layout rows:
// Row 1: 1 Big image (100% width, square)
// Row 2: 2 Small images (50% width each in 2-col grid, square)
// Row 3: 1 Big image (100% width, square)
// Row 4: 2 Small images (50% width each in 2-col grid, square)...
// If only 1 image remains when expecting a small pair, it renders as 1 Big image.
const getImageGalleryRows = (images) => {
    const rows = [];
    let currentIndex = 0;
    let isBigRow = true;

    while (currentIndex < images.length) {
        const remaining = images.length - currentIndex;
        if (isBigRow || remaining === 1) {
            rows.push({
                type: "big",
                images: [images[currentIndex]],
                startIndex: currentIndex
            });
            currentIndex += 1;
        } else {
            rows.push({
                type: "small",
                images: [images[currentIndex], images[currentIndex + 1]],
                startIndex: currentIndex
            });
            currentIndex += 2;
        }
        isBigRow = !isBigRow;
    }

    return rows;
};

export default function ProductDetailPage({ params }) {
    // Unwrap route parameter safely whether params is a Promise or an Object
    const resolvedParams = params && typeof params.then === "function" ? use(params) : (params || {});
    const id = resolvedParams?.id || "";
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
    const [activeMobileSlide, setActiveMobileSlide] = useState(0);
    const [lightboxIndex, setLightboxIndex] = useState(null);

    // Image gallery resolution based on selected color and product
    const productImages = (selectedColor && selectedColor.images && selectedColor.images.length > 0)
        ? selectedColor.images
        : ((product?.colors || []).flatMap(c => c.images || []).length > 0
            ? (product.colors || []).flatMap(c => c.images || [])
            : [
                "/images/placeholder.png",
                "/images/landing-page/first.png",
                "/images/landing-page/second.png",
                "/images/landing-page/third.png"
            ]);

    const handleMobileScroll = (e) => {
        const scrollPosition = e.target.scrollLeft;
        const width = e.target.clientWidth;
        if (width > 0) {
            const index = Math.round(scrollPosition / width);
            setActiveMobileSlide(index);
        }
    };

    const handlePrevLightbox = (e) => {
        e?.stopPropagation?.();
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : productImages.length - 1));
    };

    const handleNextLightbox = (e) => {
        e?.stopPropagation?.();
        setLightboxIndex((prev) => (prev < productImages.length - 1 ? prev + 1 : 0));
    };

    useEffect(() => {
        if (lightboxIndex === null) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") setLightboxIndex(null);
            if (e.key === "ArrowLeft") setLightboxIndex((prev) => (prev > 0 ? prev - 1 : productImages.length - 1));
            if (e.key === "ArrowRight") setLightboxIndex((prev) => (prev < productImages.length - 1 ? prev + 1 : 0));
        };
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [lightboxIndex, productImages.length]);

    // States for size guide
    const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

    const { user } = useUserAuth();

    // States for custom popup
    const [popup, setPopup] = useState({ isOpen: false, type: "success", title: "", message: "" });

    const showPopup = (message, type = "success", title = "") => {
        setPopup({
            isOpen: true,
            type,
            title: title || (type === "success" ? "Success" : type === "error" ? "Notice" : "Information"),
            message
        });
    };

    // States for reviews
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewAuthor, setReviewAuthor] = useState("");
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewText, setReviewText] = useState("");
    const [reviewPhotos, setReviewPhotos] = useState([]); // [{ file, previewUrl }]
    const [reviewVideos, setReviewVideos] = useState([]); // [{ file, previewUrl }]
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const [hasPurchased, setHasPurchased] = useState(false);

    // Review photo lightbox state
    const [reviewLightbox, setReviewLightbox] = useState({
        isOpen: false,
        photos: [],
        activeIndex: 0,
        author: ""
    });

    // Delete review state
    const [deleteReviewModal, setDeleteReviewModal] = useState({
        isOpen: false,
        reviewId: null,
        isDeleting: false
    });

    // Keyboard navigation for review lightbox
    useEffect(() => {
        if (!reviewLightbox.isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setReviewLightbox(prev => ({ ...prev, isOpen: false }));
            } else if (e.key === "ArrowLeft") {
                setReviewLightbox(prev => ({
                    ...prev,
                    activeIndex: prev.activeIndex > 0 ? prev.activeIndex - 1 : prev.photos.length - 1
                }));
            } else if (e.key === "ArrowRight") {
                setReviewLightbox(prev => ({
                    ...prev,
                    activeIndex: prev.activeIndex < prev.photos.length - 1 ? prev.activeIndex + 1 : 0
                }));
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [reviewLightbox.isOpen, reviewLightbox.photos.length]);

    // Handler to confirm review deletion
    const handleConfirmDeleteReview = async () => {
        if (!deleteReviewModal.reviewId) return;

        try {
            setDeleteReviewModal(prev => ({ ...prev, isDeleting: true }));
            const token = localStorage.getItem("userToken");
            if (!token) {
                showPopup("Please log in to delete your review.", "error");
                setDeleteReviewModal({ isOpen: false, reviewId: null, isDeleting: false });
                return;
            }

            const res = await fetch(`${API_BASE_URL}/frontend/reviews/${deleteReviewModal.reviewId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const json = await res.json();
            if (res.ok && json.success) {
                showPopup("Your review has been successfully deleted.", "success", "Review Deleted");
                setDeleteReviewModal({ isOpen: false, reviewId: null, isDeleting: false });

                // Refresh product data
                try {
                    const prodRes = await fetch(`${API_BASE_URL}/frontend/products/${id}`);
                    const prodJson = await prodRes.json();
                    if (prodJson.success && prodJson.data) {
                        setProduct(mapProductDetail(prodJson.data));
                    }
                } catch (prodErr) {
                    console.error("Error refreshing product:", prodErr);
                }

                // Refresh purchase / review eligibility
                try {
                    const checkRes = await fetch(`${API_BASE_URL}/frontend/products/${product?.id || id}/check-purchase`, {
                        headers: {
                            ...(token && { "Authorization": `Bearer ${token}` }),
                        }
                    });
                    const checkJson = await checkRes.json();
                    if (checkJson.success && (checkJson.hasPurchased || checkJson.canReview)) {
                        setHasPurchased(true);
                    }
                } catch (checkErr) {
                    console.error("Error checking review eligibility:", checkErr);
                }
            } else {
                showPopup(json.message || "Failed to delete review.", "error");
                setDeleteReviewModal(prev => ({ ...prev, isDeleting: false }));
            }
        } catch (err) {
            console.error("Error deleting review:", err);
            showPopup("Failed to delete review. Please try again.", "error");
            setDeleteReviewModal(prev => ({ ...prev, isDeleting: false }));
        }
    };

    useEffect(() => {
        if (user && !reviewAuthor) {
            setReviewAuthor(user.name || "");
        }
    }, [user]);

    useEffect(() => {
        const checkPurchaseStatus = async () => {
            if (!user || !product?.id) {
                setHasPurchased(false);
                return;
            }
            try {
                const token = localStorage.getItem("userToken");
                const res = await fetch(`${API_BASE_URL}/frontend/products/${product.id}/check-purchase`, {
                    headers: {
                        ...(token && { "Authorization": `Bearer ${token}` }),
                    }
                });
                const json = await res.json();
                if (json.success && (json.hasPurchased || json.canReview)) {
                    setHasPurchased(true);
                } else {
                    setHasPurchased(false);
                }
            } catch (err) {
                console.error("Error checking purchase eligibility:", err);
                setHasPurchased(false);
            }
        };
        checkPurchaseStatus();
    }, [user, product?.id]);

    const handlePhotoSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newPhotos = files.map(file => ({
            file,
            previewUrl: URL.createObjectURL(file)
        }));

        setReviewPhotos(prev => [...prev, ...newPhotos]);
    };

    const handleVideoSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newVideos = files.map(file => ({
            file,
            previewUrl: URL.createObjectURL(file)
        }));

        setReviewVideos(prev => [...prev, ...newVideos]);
    };

    const handlePhotoRemove = (index) => {
        setReviewPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleVideoRemove = (index) => {
        setReviewVideos(prev => prev.filter((_, i) => i !== index));
    };

    const isFavorite = isInWishlist(product?.id || "");

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!reviewText.trim()) {
            showPopup("Please enter review text.", "error");
            return;
        }

        try {
            setReviewSubmitting(true);
            const token = localStorage.getItem("userToken");
            if (!token) {
                showPopup("Please log in to submit a review.", "error");
                setReviewSubmitting(false);
                return;
            }

            let photoUrls = [];
            let videoUrls = [];

            // Upload media files if present
            if (reviewPhotos.length > 0 || reviewVideos.length > 0) {
                setUploadingMedia(true);
                const formData = new FormData();
                reviewPhotos.forEach(item => formData.append("files", item.file));
                reviewVideos.forEach(item => formData.append("files", item.file));

                const uploadRes = await fetch(`${API_BASE_URL}/frontend/reviews/upload-media`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    body: formData
                });

                const uploadJson = await uploadRes.json();
                if (!uploadJson.success || !Array.isArray(uploadJson.data)) {
                    showPopup(uploadJson.message || "Failed to upload review photos/videos.", "error");
                    setReviewSubmitting(false);
                    setUploadingMedia(false);
                    return;
                }

                uploadJson.data.forEach(item => {
                    if (item.type === "video") {
                        videoUrls.push(item.url);
                    } else {
                        photoUrls.push(item.url);
                    }
                });
                setUploadingMedia(false);
            }

            // Submit review payload to backend
            const res = await fetch(`${API_BASE_URL}/frontend/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    product: product.id,
                    author: reviewAuthor.trim() || user?.name || "Verified Purchaser",
                    rating: reviewRating,
                    text: reviewText.trim(),
                    photos: photoUrls,
                    videos: videoUrls,
                }),
            });

            const json = await res.json();
            if (json.success) {
                showPopup("Thank you! Your review has been submitted successfully.", "success", "Review Submitted");
                setIsReviewModalOpen(false);
                setReviewRating(5);
                setReviewText("");
                setReviewPhotos([]);
                setReviewVideos([]);

                // Reload product data dynamically
                const fetchUpdatedProductData = async () => {
                    try {
                        const res = await fetch(`${API_BASE_URL}/frontend/products/${id}`);
                        const json = await res.json();
                        if (json.success && json.data) {
                            setProduct(mapProductDetail(json.data));
                        }
                    } catch (err) {
                        console.error(err);
                    }
                };
                fetchUpdatedProductData();
            } else {
                showPopup(json.message || "Failed to submit review.", "error");
            }
        } catch (err) {
            console.error("Error submitting review:", err);
            showPopup("Error submitting review. Please try again.", "error");
        } finally {
            setReviewSubmitting(false);
            setUploadingMedia(false);
        }
    };

    useEffect(() => {
        const fetchProductData = async () => {
            try {
                setLoading(true);
                setError(null);

                const res = await fetch(`${API_BASE_URL}/frontend/products/${id}`);
                const json = await res.json();
                if (json.success && json.data) {
                    const dbProd = json.data;
                    const mapped = mapProductDetail(dbProd);
                    setProduct(mapped);

                    if (mapped.colors && mapped.colors.length > 0) {
                        setSelectedColor(mapped.colors[0]);
                    }
                    if (mapped.sizes && mapped.sizes.length > 0) {
                        setSelectedSize(mapped.sizes[0]);
                    }

                    // Fetch related
                    fetchRelated(dbProd._id, dbProd.subCategory?._id, dbProd.category?._id);
                } else {
                    setError("Product not found");
                }
            } catch (err) {
                console.error("Error fetching product:", err);
                setError("Product not found");
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
                        .map(mapRelatedProduct)
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
                        .map(mapRelatedProduct)
                        .slice(0, 4);
                    setRelatedProducts(mapped);
                } else {
                    setRelatedProducts([]);
                }
            } catch (e) {
                console.error("Error fetching fallback related products:", e);
                setRelatedProducts([]);
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
                                <div className="w-full aspect-square bg-neutral-200 rounded-lg"></div>
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

            <main className="flex-1 w-full pt-22 md:pt-28 pb-16 px-6 sm:px-10 md:px-16 lg:px-[4%]">
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

                        {/* Left: Image Gallery (Mobile Horizontal Scroll, Desktop Stacked Grid) */}
                        <div className="lg:col-span-7 w-full flex flex-col gap-4">
                            {/* Mobile View: Horizontal Scrollable Slider */}
                            <div className="lg:hidden w-full relative">
                                <div
                                    onScroll={handleMobileScroll}
                                    className="flex overflow-x-auto snap-x snap-mandatory gap-3 w-full scrollbar-none pb-2"
                                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                >
                                    {productImages.map((img, index) => (
                                        <div
                                            key={index}
                                            onClick={() => setLightboxIndex(index)}
                                            className="w-full shrink-0 snap-center aspect-square bg-[#F4F0EA] flex items-center justify-center overflow-hidden relative cursor-zoom-in group"
                                        >
                                            <Image
                                                src={getImageUrl(img)}
                                                alt={`${product.name} detail ${index + 1}`}
                                                fill
                                                sizes="100vw"
                                                className="object-contain select-none transition-transform duration-300 group-hover:scale-105"
                                                priority={index === 0}
                                                unoptimized
                                            />
                                            <div className="absolute top-3 right-3 bg-black/40 text-white p-2 rounded-full opacity-80 backdrop-blur-xs pointer-events-none">
                                                <ZoomIn className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Mobile Indicator Badge */}
                                {productImages.length > 1 && (
                                    <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-full font-medium pointer-events-none tracking-wider select-none">
                                        {activeMobileSlide + 1} / {productImages.length}
                                    </div>
                                )}
                            </div>

                            {/* Desktop View: Stacked 1-Big 2-Small Grid Layout */}
                            <div className="hidden lg:flex lg:flex-col lg:gap-4 lg:w-full">
                                {getImageGalleryRows(productImages).map((row, rowIdx) => {
                                    if (row.type === "big") {
                                        return (
                                            <div
                                                key={rowIdx}
                                                onClick={() => setLightboxIndex(row.startIndex)}
                                                className="w-full aspect-square bg-[#F4F0EA] flex items-center justify-center overflow-hidden cursor-zoom-in relative group"
                                            >
                                                <div className="relative w-full h-full">
                                                    <Image
                                                        src={getImageUrl(row.images[0])}
                                                        alt={`${product.name} detail ${row.startIndex + 1}`}
                                                        fill
                                                        sizes="(max-width: 1024px) 100vw, 60vw"
                                                        className="object-contain select-none transition-transform duration-300 group-hover:scale-[1.02]"
                                                        priority={row.startIndex === 0}
                                                        unoptimized
                                                    />
                                                </div>
                                                <div className="absolute top-4 right-4 bg-white/80 hover:bg-white text-black p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                                    <ZoomIn className="w-4 h-4" />
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div key={rowIdx} className="grid grid-cols-2 gap-4 w-full">
                                                {row.images.map((img, imgIdx) => {
                                                    const actualIdx = row.startIndex + imgIdx;
                                                    return (
                                                        <div
                                                            key={imgIdx}
                                                            onClick={() => setLightboxIndex(actualIdx)}
                                                            className="aspect-square bg-[#F4F0EA] flex items-center justify-center overflow-hidden cursor-zoom-in relative group"
                                                        >
                                                            <div className="relative w-full h-full">
                                                                <Image
                                                                    src={getImageUrl(img)}
                                                                    alt={`${product.name} detail ${actualIdx + 1}`}
                                                                    fill
                                                                    sizes="(max-width: 1024px) 50vw, 30vw"
                                                                    className="object-contain select-none transition-transform duration-300 group-hover:scale-[1.02]"
                                                                    unoptimized
                                                                />
                                                            </div>
                                                            <div className="absolute top-3 right-3 bg-white/80 text-black p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                                                <ZoomIn className="w-3.5 h-3.5" />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        </div>

                        {/* Right: Info panel (Sticky on Desktop) */}
                        <div className="lg:col-span-5 lg:sticky lg:top-28 h-fit flex flex-col space-y-6">

                            {/* Title, Tag, and Stars Header */}
                            <div className="space-y-0">
                                <p className="text-xs font-regular uppercase tracking-wider text-black">
                                    {product.tag}
                                </p>
                                <div className="flex justify-between items-start">
                                    <h1 className="heading-page text-black">
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
                                {product.reviewsCount > 0 ? (
                                    <div className="flex items-center gap-1.5 pt-1">
                                        {renderStars(product.rating)}
                                        <span className="text-xs md:text-[1vw] font-semibold text-black">{product.rating}</span>
                                        <span className="text-xs md:text-[1vw] font-normal text-black">({product.reviewsCount})</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 pt-1 text-xs text-neutral-400 font-medium">
                                        <span>No reviews yet</span>
                                    </div>
                                )}
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
                            {(() => {
                                const currentDetailStock = getStockForSizeAndColor(selectedSize, selectedColor, product);
                                const isDetailOutOfStock = currentDetailStock === 0;

                                return (
                                    <>
                                        <div className="space-y-3 pt-2">
                                            <div className="flex justify-between items-center text-xs md:text-sm">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-semibold text-black">SIZE</span>
                                                    {selectedSize && (
                                                        <div className="flex items-center gap-1.5 text-xs">
                                                            {currentDetailStock === 0 ? (
                                                                <span className="text-red-600 flex items-center gap-1 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200 font-semibold">
                                                                    <XCircle className="w-3.5 h-3.5" />
                                                                    Out of Stock
                                                                </span>
                                                            ) : currentDetailStock <= 5 ? (
                                                                <span className="text-amber-700 flex items-center gap-1 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-semibold">
                                                                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                                                    Only {currentDetailStock} {currentDetailStock === 1 ? "piece" : "pieces"} left!
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => setIsSizeGuideOpen(true)}
                                                    className="text-neutral-400 hover:text-black transition-colors underline cursor-pointer"
                                                >
                                                    Size Guide
                                                </button>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {product.sizes.map((size) => {
                                                    const sizeStock = getStockForSizeAndColor(size, selectedColor, product);
                                                    const isSizeOutOfStock = sizeStock === 0;
                                                    const isLowStock = sizeStock > 0 && sizeStock <= 5;
                                                    const isSelected = selectedSize === size;

                                                    return (
                                                        <button
                                                            key={size}
                                                            onClick={() => {
                                                                setSelectedSize(size);
                                                                setQuantity(1);
                                                            }}
                                                            className={`min-w-[48px] h-10 px-5 rounded-full border text-xs font-semibold tracking-wider transition-all duration-200 relative ${isSizeOutOfStock
                                                                ? "bg-neutral-100 text-neutral-400 border-neutral-200 line-through opacity-60 cursor-not-allowed"
                                                                : isSelected
                                                                    ? "bg-black border-black text-white shadow-xs cursor-pointer"
                                                                    : "border-neutral-200 text-black hover:border-black bg-white cursor-pointer"
                                                                }`}
                                                        >
                                                            <span>{size}</span>
                                                            {isLowStock && !isSelected && (
                                                                <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" title={`Only ${sizeStock} left!`} />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Color Selector */}
                                        {selectedColor && (
                                            <div className="space-y-3 pt-2">
                                                <p className="text-xs md:text-sm font-semibold text-black">
                                                    COLOUR: <span className="text-gray-500 font-normal ml-1">{selectedColor.name}</span>
                                                </p>
                                                <div className="flex gap-3">
                                                    {product.colors.map((color) => (
                                                        <button
                                                            key={color.name}
                                                            onClick={() => {
                                                                setSelectedColor(color);
                                                                setQuantity(1);
                                                            }}
                                                            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${selectedColor.name === color.name
                                                                ? "border-black ring-2 ring-offset-1 ring-black"
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
                                        <div className="flex items-center gap-3 pt-4">
                                            {/* Quantity */}
                                            <div className="flex items-center justify-between rounded-full bg-[#F3F3F3] p-1 h-14 w-36 select-none flex-shrink-0">
                                                <button
                                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                    disabled={quantity <= 1 || isDetailOutOfStock}
                                                    className="w-11 h-11 rounded-full bg-[#FAF6F0] border border-[#D5C9B9]/60 flex items-center justify-center text-black cursor-pointer hover:bg-[#EADCC9] transition-all disabled:opacity-30 disabled:hover:bg-[#FAF6F0]"
                                                    aria-label="Decrease quantity"
                                                >
                                                    <Minus className="w-5 h-5" strokeWidth={2} />
                                                </button>
                                                <span className="font-semibold text-sm sm:text-base md:text-[1.2vw] text-black text-center w-8">
                                                    {isDetailOutOfStock ? 0 : quantity}
                                                </span>
                                                <button
                                                    onClick={() => setQuantity(Math.min(currentDetailStock, quantity + 1))}
                                                    disabled={quantity >= currentDetailStock || isDetailOutOfStock}
                                                    className="w-11 h-11 rounded-full bg-[#FAF6F0] border border-[#D5C9B9]/60 flex items-center justify-center text-black cursor-pointer hover:bg-[#EADCC9] transition-all disabled:opacity-30 disabled:hover:bg-[#FAF6F0]"
                                                    aria-label="Increase quantity"
                                                >
                                                    <Plus className="w-5 h-5" strokeWidth={2} />
                                                </button>
                                            </div>

                                            {/* Add to Cart */}
                                            <button
                                                disabled={isDetailOutOfStock}
                                                onClick={() => {
                                                    if (!selectedSize) {
                                                        showPopup("Please select a size.", "info", "Select Size");
                                                        return;
                                                    }
                                                    if (isDetailOutOfStock) return;
                                                    addToCart(product, quantity, selectedSize, selectedColor);
                                                }}
                                                className={`flex-1 h-14 rounded-full font-medium text-sm md:text-[1vw] tracking-wide transition-colors ${isDetailOutOfStock
                                                    ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                                                    : "bg-[#C5B9AC] text-black hover:bg-[#D4C9BD] cursor-pointer"
                                                    }`}
                                            >
                                                {isDetailOutOfStock ? "Out of Stock" : "Add to Cart"}
                                            </button>
                                        </div>

                                        {/* Buy Now */}
                                        <button
                                            disabled={isDetailOutOfStock}
                                            onClick={() => {
                                                if (!selectedSize) {
                                                    showPopup("Please select a size.", "info", "Select Size");
                                                    return;
                                                }
                                                if (isDetailOutOfStock) return;
                                                addToCart(product, quantity, selectedSize, selectedColor);
                                            }}
                                            className={`w-full h-14 rounded-full font-medium text-sm md:text-[1vw] tracking-wide transition-colors ${isDetailOutOfStock
                                                ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                                                : "bg-black text-white hover:bg-neutral-800 cursor-pointer"
                                                }`}
                                        >
                                            {isDetailOutOfStock ? "Out of Stock" : "Buy Now"}
                                        </button>
                                    </>
                                );
                            })()}

                            {/* Product Details Specs */}
                            {(() => {
                                const hasDescription = Boolean(product.description && product.description.trim());
                                const material = product.details?.material?.trim?.() || "";
                                const fit = product.details?.fit?.trim?.() || "";
                                const weight = product.details?.weight?.trim?.() || "";
                                const care = product.details?.care?.trim?.() || "";
                                const hasSpecs = Boolean(material || fit || weight || care);

                                if (!hasDescription && !hasSpecs) return null;

                                return (
                                    <div className="space-y-4 pt-6 border-t border-neutral-200">
                                        <p className="text-xs md:text-[0.8vw] font-semibold uppercase tracking-widest text-black">
                                            Product Details
                                        </p>
                                        {hasDescription && (
                                            <p className="text-sm md:text-[1vw] font-normal text-neutral-600 leading-relaxed font-sans">
                                                {product.description}
                                            </p>
                                        )}

                                        {/* Bullet details */}
                                        {hasSpecs && (
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2 text-xs md:text-sm">
                                                {material && (
                                                    <div>
                                                        <span className="text-xs md:text-[0.8vw] font-semibold uppercase tracking-widest text-black">Material</span>
                                                        <p className="text-sm md:text-[1vw] font-normal text-neutral-600 leading-relaxed font-sans">{material}</p>
                                                    </div>
                                                )}
                                                {fit && (
                                                    <div>
                                                        <span className="text-xs md:text-[0.8vw] font-semibold uppercase tracking-widest text-black">Fit</span>
                                                        <p className="text-sm md:text-[1vw] font-normal text-neutral-600 leading-relaxed font-sans">{fit}</p>
                                                    </div>
                                                )}
                                                {weight && (
                                                    <div>
                                                        <span className="text-xs md:text-[0.8vw] font-semibold uppercase tracking-widest text-black">Weight</span>
                                                        <p className="text-sm md:text-[1vw] font-normal text-neutral-600 leading-relaxed font-sans">{weight}</p>
                                                    </div>
                                                )}
                                                {care && (
                                                    <div>
                                                        <span className="text-xs md:text-[0.8vw] font-semibold uppercase tracking-widest text-black">Care</span>
                                                        <p className="text-sm md:text-[1vw] font-normal text-neutral-600 leading-relaxed font-sans">{care}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                        </div>
                    </div>

                    {/* Reviews Section */}
                    <section className="mt-20 md:mt-28 pt-10 border-t border-neutral-200">
                        <div className="flex items-center justify-between">
                            <h2 className="heading-sub text-black">
                                Reviews
                            </h2>
                            {hasPurchased && product.reviews && product.reviews.length > 0 && (
                                <button
                                    onClick={() => setIsReviewModalOpen(true)}
                                    className="px-5 py-2.5 bg-black text-white hover:bg-neutral-800 transition-colors rounded-full text-xs sm:text-sm font-semibold cursor-pointer"
                                >
                                    Write a Review
                                </button>
                            )}
                        </div>

                        {product.reviews && product.reviews.length > 0 ? (
                            <>
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
                                                Based on {product.reviewsCount} {product.reviewsCount === 1 ? "review" : "reviews"}
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
                                        {product.reviews.map((rev, index) => {
                                            const currentUserId = (user?._id || user?.id || "").toString();
                                            const canDelete = Boolean(currentUserId && rev.userId && String(rev.userId) === currentUserId);

                                            return (
                                                <div key={rev.id || index} className="py-6 first:pt-0 last:pb-0 space-y-2.5">
                                                    <div className="flex items-center justify-between text-xs md:text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-black">{rev.author}</span>
                                                            {canDelete && (
                                                                <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-medium">You</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-neutral-400">{rev.date}</span>
                                                            {canDelete && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setDeleteReviewModal({ isOpen: true, reviewId: rev.id, isDeleting: false })}
                                                                    className="inline-flex items-center gap-1 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer p-1 rounded-md hover:bg-red-50"
                                                                    title="Delete your review"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                    <span className="hidden sm:inline text-xs font-medium">Delete</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex text-[#FFB800] space-x-0.5">
                                                            {Array.from({ length: 5 }).map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    className={`w-3.5 h-3.5 fill-current ${i < rev.rating ? "text-[#FFB800] stroke-none" : "text-neutral-200 stroke-none"
                                                                        }`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <p className="text-sm md:text-base font-normal text-neutral-700 leading-snug font-sans pt-1">
                                                        {rev.text}
                                                    </p>

                                                    {/* Photos & Videos attachments */}
                                                    {((rev.photos && rev.photos.length > 0) || (rev.videos && rev.videos.length > 0)) && (
                                                        <div className="flex flex-wrap gap-3 pt-2">
                                                            {/* Photos */}
                                                            {rev.photos && rev.photos.map((imgUrl, imgIdx) => (
                                                                <button
                                                                    key={`photo-${imgIdx}`}
                                                                    type="button"
                                                                    onClick={() => setReviewLightbox({
                                                                        isOpen: true,
                                                                        photos: rev.photos,
                                                                        activeIndex: imgIdx,
                                                                        author: rev.author
                                                                    })}
                                                                    className="relative w-24 h-24 rounded-xl overflow-hidden bg-neutral-50 border border-neutral-200 group cursor-zoom-in text-left focus:outline-none focus:ring-2 focus:ring-black"
                                                                    title="Click to view photo"
                                                                >
                                                                    <Image
                                                                        src={getImageUrl(imgUrl)}
                                                                        alt={`Review photo ${imgIdx + 1}`}
                                                                        fill
                                                                        sizes="96px"
                                                                        className="object-cover select-none transition-transform duration-300 group-hover:scale-105"
                                                                        unoptimized
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                                        <div className="bg-black/60 text-white p-1.5 rounded-full backdrop-blur-xs">
                                                                            <ZoomIn className="w-3.5 h-3.5" />
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            ))}

                                                            {/* Videos */}
                                                            {rev.videos && rev.videos.map((vidUrl, vidIdx) => (
                                                                <div key={`video-${vidIdx}`} className="relative h-24 rounded-xl overflow-hidden bg-black border border-neutral-200">
                                                                    <video
                                                                        src={getImageUrl(vidUrl)}
                                                                        controls
                                                                        preload="metadata"
                                                                        className="h-24 w-auto max-w-[200px] object-cover rounded-xl"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Empty State UI */
                            <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center bg-[#FAF9F6] rounded-3xl border border-neutral-200/60 mt-8 px-6">
                                <div className="w-16 h-16 bg-[#F4F0EA] rounded-full flex items-center justify-center text-neutral-400 mb-4">
                                    <Star className="w-7 h-7 stroke-[1.25]" />
                                </div>
                                <h3 className="font-sans text-lg sm:text-xl font-bold text-black">No reviews yet</h3>
                                <p className="text-xs sm:text-sm text-neutral-400 max-w-[360px] mt-2 leading-relaxed">
                                    {hasPurchased
                                        ? "Be the first verified buyer to share your thoughts and review this piece."
                                        : !user
                                            ? "Log in to write a review if you've purchased this product."
                                            : "You can review this product after purchasing it."}
                                </p>
                                {hasPurchased ? (
                                    <button
                                        onClick={() => setIsReviewModalOpen(true)}
                                        className="mt-6 px-6 py-2.5 bg-black text-white hover:bg-neutral-800 transition-colors rounded-full text-xs sm:text-sm font-semibold cursor-pointer"
                                    >
                                        Write a Review
                                    </button>
                                ) : !user ? (
                                    <Link
                                        href="/login"
                                        className="mt-6 px-6 py-2.5 bg-black text-white hover:bg-neutral-800 transition-colors rounded-full text-xs sm:text-sm font-semibold cursor-pointer"
                                    >
                                        Log In to Review
                                    </Link>
                                ) : null}
                            </div>
                        )}
                    </section>

                    {/* Recommendation Grid ("You might also like") */}
                    <section className="mt-20 md:mt-28">
                        <h2 className="heading-sub text-black mb-8">
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

                    {/* Size Guide Modal */}
                    {isSizeGuideOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fadeIn">
                            {/* Backdrop click to close */}
                            <div className="absolute inset-0" onClick={() => setIsSizeGuideOpen(false)} />

                            {/* Modal content: container that animates from bottom to center */}
                            <div className="relative z-10 w-full max-w-xl mx-4 animate-slideUp">
                                {/* Close button absolute inside the container, overlapping the top-right of the image */}
                                <button
                                    onClick={() => setIsSizeGuideOpen(false)}
                                    className="absolute top-5 right-5 text-neutral-400 hover:text-black hover:bg-neutral-100/60 p-1.5 rounded-full transition-colors cursor-pointer z-20"
                                    aria-label="Close Size Guide"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Image card */}
                                <div className="relative w-full aspect-[1.44/1] rounded-3xl overflow-hidden shadow-2xl">
                                    <Image
                                        src="/images/sizechart.png"
                                        alt="Size Guide Chart"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Review Submission Modal */}
                    {isReviewModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                            <div className="bg-white text-black w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-neutral-100 shadow-2xl relative animate-scaleUp my-8 max-h-[90vh] overflow-y-auto">
                                {/* Close button */}
                                <button
                                    onClick={() => setIsReviewModalOpen(false)}
                                    className="absolute top-6 right-6 text-neutral-400 hover:text-black transition-colors cursor-pointer"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                <h3 className="heading-sub mb-1">Share Your Story</h3>
                                <p className="text-sm text-neutral-500 mb-5">Verified Purchaser Review for {product.name}</p>

                                <form onSubmit={handleReviewSubmit} className="space-y-5">
                                    {/* Author Name */}
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-neutral-600">Your Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={reviewAuthor}
                                            onChange={(e) => setReviewAuthor(e.target.value)}
                                            placeholder="e.g. John Doe"
                                            className="w-full h-11 px-4 rounded-xl border border-neutral-200 focus:border-black focus:outline-none transition-colors text-sm font-sans"
                                        />
                                    </div>

                                    {/* Rating Stars Selection */}
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-neutral-600">Rating</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setReviewRating(star)}
                                                    className="text-neutral-300 hover:scale-110 transition-transform cursor-pointer"
                                                >
                                                    <Star
                                                        className={`w-7 h-7 ${star <= reviewRating ? "text-[#FFB800] fill-[#FFB800]" : "text-neutral-200"}`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Review Text */}
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-neutral-600">Review Text</label>
                                        <textarea
                                            required
                                            rows={4}
                                            value={reviewText}
                                            onChange={(e) => setReviewText(e.target.value)}
                                            placeholder="Tell us about the fit, quality, material, and your experience..."
                                            className="w-full p-4 rounded-xl border border-neutral-200 focus:border-black focus:outline-none transition-colors text-sm font-sans resize-none"
                                        />
                                    </div>

                                    {/* Photos Attachment */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                                                <Camera className="w-4 h-4 text-neutral-500" />
                                                Add Photos
                                            </label>
                                            <span className="text-[11px] text-neutral-400">JPG, PNG, WEBP</span>
                                        </div>
                                        <label className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-dashed border-neutral-300 hover:border-black transition-colors cursor-pointer bg-neutral-50 hover:bg-neutral-100/60 text-xs font-medium text-neutral-700">
                                            <Camera className="w-4 h-4 text-neutral-500" />
                                            <span>Upload Photos</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handlePhotoSelect}
                                                className="hidden"
                                            />
                                        </label>

                                        {/* Photo Previews */}
                                        {reviewPhotos.length > 0 && (
                                            <div className="flex flex-wrap gap-2.5 mt-3">
                                                {reviewPhotos.map((item, idx) => (
                                                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-neutral-200 group">
                                                        <Image
                                                            src={item.previewUrl}
                                                            alt={`Preview ${idx + 1}`}
                                                            fill
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePhotoRemove(idx)}
                                                            className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                                            title="Remove photo"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Videos Attachment */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                                                <Video className="w-4 h-4 text-neutral-500" />
                                                Add Videos
                                            </label>
                                            <span className="text-[11px] text-neutral-400">MP4, WEBM, MOV (Max 50MB)</span>
                                        </div>
                                        <label className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-dashed border-neutral-300 hover:border-black transition-colors cursor-pointer bg-neutral-50 hover:bg-neutral-100/60 text-xs font-medium text-neutral-700">
                                            <Video className="w-4 h-4 text-neutral-500" />
                                            <span>Upload Videos</span>
                                            <input
                                                type="file"
                                                accept="video/*"
                                                multiple
                                                onChange={handleVideoSelect}
                                                className="hidden"
                                            />
                                        </label>

                                        {/* Video Previews */}
                                        {reviewVideos.length > 0 && (
                                            <div className="flex flex-wrap gap-2.5 mt-3">
                                                {reviewVideos.map((item, idx) => (
                                                    <div key={idx} className="relative h-16 w-24 rounded-lg overflow-hidden border border-neutral-200 bg-black group flex items-center justify-center">
                                                        <video
                                                            src={item.previewUrl}
                                                            className="h-16 w-auto object-cover opacity-80"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleVideoRemove(idx)}
                                                            className="absolute top-1 right-1 z-10 bg-black/70 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                                            title="Remove video"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={reviewSubmitting || uploadingMedia}
                                        className="w-full h-13 bg-black text-white hover:bg-neutral-800 transition-colors rounded-full font-medium text-sm tracking-wide cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                                    >
                                        {uploadingMedia ? "Uploading Media..." : reviewSubmitting ? "Submitting Review..." : "Submit Review"}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Frequently Asked Questions */}
                    <section className="mt-20 md:mt-28 pb-10">
                        <h2 className="heading-sub text-black mb-8">
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

            {/* Custom Notification Popup Modal */}
            {popup.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white text-black w-full max-w-sm rounded-3xl p-6 border border-neutral-100 shadow-2xl relative animate-scaleUp text-center space-y-4">
                        <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${popup.type === "success"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : popup.type === "error"
                                    ? "bg-red-50 text-red-600 border border-red-200"
                                    : "bg-neutral-100 text-neutral-800 border border-neutral-200"
                            }`}>
                            {popup.type === "success" ? (
                                <CheckCircle2 className="w-7 h-7 stroke-[2]" />
                            ) : popup.type === "error" ? (
                                <XCircle className="w-7 h-7 stroke-[2]" />
                            ) : (
                                <AlertCircle className="w-7 h-7 stroke-[2]" />
                            )}
                        </div>

                        <div className="space-y-1">
                            <h3 className="font-clashDisplay text-lg font-semibold text-black">
                                {popup.title}
                            </h3>
                            <p className="text-sm text-neutral-500 leading-relaxed font-sans">
                                {popup.message}
                            </p>
                        </div>

                        <button
                            onClick={() => setPopup({ ...popup, isOpen: false })}
                            className="w-full h-11 bg-black text-white hover:bg-neutral-800 transition-colors rounded-full font-medium text-xs tracking-wider uppercase cursor-pointer"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* Fullscreen Product Image Lightbox Modal */}
            {lightboxIndex !== null && productImages[lightboxIndex] && (
                <div
                    className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200 select-none"
                    onClick={() => setLightboxIndex(null)}
                >
                    {/* Top Header Bar */}
                    <div className="w-full max-w-7xl mx-auto flex items-center justify-between z-10 py-1">
                        <div className="flex items-center gap-3">
                            <span className="text-white/90 font-semibold text-xs sm:text-sm font-sans truncate max-w-[200px] sm:max-w-md">
                                {product.name}
                            </span>
                            {productImages.length > 1 && (
                                <span className="bg-white/10 text-white/80 text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-white/10">
                                    {lightboxIndex + 1} / {productImages.length}
                                </span>
                            )}
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex(null);
                            }}
                            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10 shadow-sm"
                            aria-label="Close image viewer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Center Image Viewing Area with Next/Prev Controls */}
                    <div className="relative flex-1 w-full max-w-7xl mx-auto flex items-center justify-center my-auto py-2">
                        {/* Previous Button */}
                        {productImages.length > 1 && (
                            <button
                                onClick={handlePrevLightbox}
                                className="absolute left-1 sm:left-4 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/15 backdrop-blur-md transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="w-6 h-6 stroke-[2]" />
                            </button>
                        )}

                        {/* Main Active Image Container */}
                        <div
                            className="relative w-full h-[65vh] sm:h-[75vh] max-h-[850px] flex items-center justify-center cursor-default"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src={getImageUrl(productImages[lightboxIndex])}
                                alt={`${product.name} enlarged view`}
                                fill
                                className="object-contain"
                                priority
                                unoptimized
                            />
                        </div>

                        {/* Next Button */}
                        {productImages.length > 1 && (
                            <button
                                onClick={handleNextLightbox}
                                className="absolute right-1 sm:right-4 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/15 backdrop-blur-md transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
                                aria-label="Next image"
                            >
                                <ChevronRight className="w-6 h-6 stroke-[2]" />
                            </button>
                        )}
                    </div>

                    {/* Bottom Thumbnail Strip */}
                    {productImages.length > 1 ? (
                        <div
                            className="w-full max-w-xl mx-auto z-10 flex items-center justify-center pt-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-2 sm:gap-2.5 p-1.5 bg-black/50 backdrop-blur-md rounded-2xl border border-white/10 max-w-full overflow-x-auto scrollbar-none">
                                {productImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setLightboxIndex(idx)}
                                        className={`relative w-11 h-11 sm:w-13 sm:h-13 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer bg-[#F4F0EA] ${
                                            lightboxIndex === idx
                                                ? "border-white scale-105 shadow-md opacity-100"
                                                : "border-transparent opacity-50 hover:opacity-90"
                                        }`}
                                    >
                                        <Image
                                            src={getImageUrl(img)}
                                            alt=""
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-6" />
                    )}
                </div>
            )}

            {/* Review Photo Lightbox Modal */}
            {reviewLightbox.isOpen && reviewLightbox.photos.length > 0 && (
                <div
                    className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200 select-none"
                    onClick={() => setReviewLightbox(prev => ({ ...prev, isOpen: false }))}
                >
                    {/* Top Header Bar */}
                    <div className="w-full max-w-7xl mx-auto flex items-center justify-between z-10 py-1" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                            <span className="text-white/90 font-semibold text-xs sm:text-sm font-sans truncate max-w-[200px] sm:max-w-md">
                                {reviewLightbox.author ? `Photo from ${reviewLightbox.author}'s review` : "Review Photo"}
                            </span>
                            {reviewLightbox.photos.length > 1 && (
                                <span className="bg-white/10 text-white/80 text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-white/10">
                                    {reviewLightbox.activeIndex + 1} / {reviewLightbox.photos.length}
                                </span>
                            )}
                        </div>

                        <button
                            onClick={() => setReviewLightbox(prev => ({ ...prev, isOpen: false }))}
                            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10 shadow-sm"
                            aria-label="Close photo viewer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Center Image Viewing Area with Next/Prev Controls */}
                    <div className="relative flex-1 w-full max-w-7xl mx-auto flex items-center justify-center my-auto py-2">
                        {/* Previous Button */}
                        {reviewLightbox.photos.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setReviewLightbox(prev => ({
                                        ...prev,
                                        activeIndex: prev.activeIndex > 0 ? prev.activeIndex - 1 : prev.photos.length - 1
                                    }));
                                }}
                                className="absolute left-1 sm:left-4 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/15 backdrop-blur-md transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
                                aria-label="Previous photo"
                            >
                                <ChevronLeft className="w-6 h-6 stroke-[2]" />
                            </button>
                        )}

                        {/* Enlarged Photo Container */}
                        <div
                            className="relative max-w-4xl max-h-[75vh] w-full h-[70vh] flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src={getImageUrl(reviewLightbox.photos[reviewLightbox.activeIndex])}
                                alt={`Review photo ${reviewLightbox.activeIndex + 1}`}
                                fill
                                className="object-contain"
                                sizes="90vw"
                                priority
                                unoptimized
                            />
                        </div>

                        {/* Next Button */}
                        {reviewLightbox.photos.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setReviewLightbox(prev => ({
                                        ...prev,
                                        activeIndex: prev.activeIndex < prev.photos.length - 1 ? prev.activeIndex + 1 : 0
                                    }));
                                }}
                                className="absolute right-1 sm:right-4 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/15 backdrop-blur-md transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
                                aria-label="Next photo"
                            >
                                <ChevronRight className="w-6 h-6 stroke-[2]" />
                            </button>
                        )}
                    </div>

                    {/* Bottom Thumbnail Strip */}
                    {reviewLightbox.photos.length > 1 ? (
                        <div
                            className="w-full max-w-xl mx-auto z-10 flex items-center justify-center pt-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-2 sm:gap-2.5 p-1.5 bg-black/50 backdrop-blur-md rounded-2xl border border-white/10 max-w-full overflow-x-auto scrollbar-none">
                                {reviewLightbox.photos.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setReviewLightbox(prev => ({ ...prev, activeIndex: idx }))}
                                        className={`relative w-11 h-11 sm:w-13 sm:h-13 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer bg-neutral-900 ${
                                            reviewLightbox.activeIndex === idx
                                                ? "border-white scale-105 shadow-md opacity-100"
                                                : "border-transparent opacity-50 hover:opacity-90"
                                        }`}
                                    >
                                        <Image
                                            src={getImageUrl(item)}
                                            alt={`Thumbnail ${idx + 1}`}
                                            fill
                                            sizes="48px"
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-6" />
                    )}
                </div>
            )}

            {/* Delete Review Confirmation Modal */}
            {deleteReviewModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
                    <div className="bg-white text-black w-full max-w-sm rounded-3xl p-6 border border-neutral-100 shadow-2xl relative animate-scaleUp text-center space-y-4">
                        <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center bg-red-50 text-red-600 border border-red-200">
                            <Trash2 className="w-6 h-6" />
                        </div>

                        <div className="space-y-1">
                            <h3 className="font-clashDisplay text-lg font-semibold text-black">
                                Delete Your Review?
                            </h3>
                            <p className="text-sm text-neutral-500 leading-relaxed font-sans">
                                Are you sure you want to delete this review? This action cannot be undone.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                disabled={deleteReviewModal.isDeleting}
                                onClick={() => setDeleteReviewModal({ isOpen: false, reviewId: null, isDeleting: false })}
                                className="flex-1 h-11 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors rounded-full font-medium text-xs tracking-wider uppercase cursor-pointer disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deleteReviewModal.isDeleting}
                                onClick={handleConfirmDeleteReview}
                                className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white transition-colors rounded-full font-medium text-xs tracking-wider uppercase cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                                {deleteReviewModal.isDeleting ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <span>Delete</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
