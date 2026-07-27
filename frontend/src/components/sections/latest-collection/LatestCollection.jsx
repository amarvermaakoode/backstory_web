"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";
import ProductCard from "@/components/ui/ProductCard";
import { API_BASE_URL } from "@/lib/api";

const defaultProducts = [
    {
        id: "built-in-public",
        name: "Built in Public",
        price: "Rs 1200",
        priceNum: 1200,
        image: "/images/landing-page/featured11.png",
        hoverImage: "/images/person-image-1-removebg-preview.png",
        sizes: ["S", "M", "L"],
        colors: [{ name: "Default", hex: "#CCCCCC" }],
        tag: "T-Shirt"
    },
    {
        id: "life-through-my-lenses",
        name: "Life Through My Lenses",
        price: "Rs 1100",
        priceNum: 1100,
        image: "/images/landing-page/featured2.png",
        hoverImage: "/images/person-image-2-removebg-preview.png",
        sizes: ["S", "M", "L"],
        colors: [{ name: "Default", hex: "#CCCCCC" }],
        tag: "T-Shirt"
    },
    {
        id: "lost-on-purpose",
        name: "Lost on Purpose",
        price: "Rs 1100",
        priceNum: 1100,
        image: "/images/landing-page/featured3.png",
        hoverImage: "/images/person-image-3-removebg-preview.png",
        sizes: ["S", "M", "L"],
        colors: [{ name: "Default", hex: "#CCCCCC" }],
        tag: "T-Shirt"
    },
];

export default function Collections() {
    const [products, setProducts] = useState([]);

    // Carousel Ref
    const carouselRef = useRef(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/frontend/products`);
                const data = await res.json();
                if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
                    // Map MongoDB schemas to front-end schema structures
                    const mapped = data.data.map(item => {
                        // Resolve color arrays
                        const colorsList = (item.colors || []).map(c => ({
                            name: c.color?.name || "Default",
                            hex: c.color?.hexCode || "#CCCCCC"
                        }));

                        // Resolve sizes array
                        const sizesList = item.sizeGuide?.chart?.map(sz => sz.size) || ["S", "M", "L"];

                        // Image resolving logic (front view and hover view)
                        const mainImg = item.colors?.[0]?.images?.[0] || "";
                        const hoverImg = item.colors?.[0]?.images?.[1] || item.colors?.[1]?.images?.[0] || "";
                        return {
                            id: item._id,
                            slug: item.slug,
                            name: item.title,
                            price: `Rs ${item.price}`,
                            priceNum: Number(item.price),
                            image: mainImg,
                            hoverImage: hoverImg,
                            sizes: sizesList,
                            colors: colorsList,
                            tag: item.category?.Name || "Product",
                            link: `/products/${item.slug || item._id}`
                        };
                    });
                    setProducts(mapped);
                } else {
                    setProducts(defaultProducts);
                }
            } catch (err) {
                console.error("Failed to fetch landing products:", err);
                setProducts(defaultProducts);
            }
        };

        fetchProducts();
    }, []);

    const scroll = (direction) => {
        if (carouselRef.current) {
            const cardWidth = 380;
            const scrollAmount = direction === "left" ? -cardWidth : cardWidth;
            carouselRef.current.scrollBy({
                left: scrollAmount,
                behavior: "smooth",
            });
        }
    };

    return (
        <section className="relative w-full bg-[#FFFFFF] xmd:py-16 py-8 pl-6 sm:pl-10 md:pl-16 lg:pl-[4%]">
            <div className=" max-w-full flex flex-col md:flex-row gap-12 md:gap-14 items-start">

                {/* Left Content (Static) */}
                <div className="w-full md:w-[38%] lg:w-[35%] flex flex-col justify-between self-stretch">
                    <div>
                        <h2 className="heading-section text-[#030303]">
                            Shop our <br className="hidden md:block" />Latest Collection
                        </h2>
                        <div className="flex md:flex-col flex-row justify-between">
                            <p className="text-black body-large md:mt-2 mt-2">
                                Inspired by journeys.<br />Designed to be remembered.
                            </p>
                            <Button href="/product-list" hasArrow={false} variant="outline" className="md:mt-6 mt-4 md:mr-0 mr-4 whitespace-nowrap">
                                Shop Now
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Carousel Column */}
                <div className="w-full md:w-[62%] lg:w-[65%]  relative">
                    <style>{`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .no-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>

                    <div
                        ref={carouselRef}
                        className="flex md:gap-6 gap-4 overflow-x-auto scroll-smooth no-scrollbar pb-4"
                    >
                        {products.map((product) => (
                            <div key={product.id} className="md:w-[24vw] w-[50vw] shrink-0">
                                <ProductCard product={product} isHome={true} />
                            </div>
                        ))}
                    </div>

                    {/* Right Edge Gradient Overlay & Next Button */}
                    <div
                        className="absolute hidden md:block right-0 top-0 w-28 z-20 pointer-events-none"
                        style={{
                            height: "24vw",
                            background: "linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.21) 100%)"
                        }}
                    >
                        <button
                            onClick={() => scroll("right")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full bg-white text-black hover:bg-neutral-200 transition-colors shadow-lg cursor-pointer"
                            aria-label="Scroll right"
                        >
                            <ChevronRight className="h-6 w-6 stroke-[2]" />
                        </button>
                    </div>
                </div>

            </div>
        </section>
    );
}