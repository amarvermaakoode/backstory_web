"use client";

import React from "react";
import { allProducts } from "@/data/products";
import Button from "@/components/ui/Button";
import ProductCard from "@/components/ui/ProductCard";

export default function FeaturedProducts() {
    const products = [
        {
            id: "lost-on-purpose-1",
            name: "Lost on Purpose",
            price: "Rs 1100",
            image: "/images/landing-page/featured3.png",
            tag: "Travel Series",
            link: "#shop",
        },
        {
            id: "miles-over-words-1",
            name: "Miles Over Words",
            price: "Rs 1090",
            image: "/images/landing-page/biker-tshirt.png",
            tag: "Biker Series",
            link: "#shop",
        },
        {
            id: "coding-tshirt-1",
            name: "Coding T-Shirt",
            price: "Rs 990",
            image: "/images/landing-page/coding-tshirt.png",
            tag: "Coding Series",
            link: "#shop",
        },
    ];

    return (
        <section className="w-full bg-[#FFFFFF] py-10 md:py-16 px-6 sm:px-10 md:px-16 lg:px-[4%] select-none text-black">
            <div className="mx-auto max-w-[1600px] space-y-8">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <h2 className="font-clashDisplay text-3xl md:text-[3.3vw] font-semibold tracking-tight">
                        Featured Products
                    </h2>
                    <Button href="/featured-products" hasArrow={false} variant="outline">
                        See All
                    </Button>
                </div>

                {/* Grid layout for featured products on desktop, carousel on mobile */}
                <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-8 overflow-x-auto md:overflow-visible no-scrollbar pb-4 md:pb-0">
                    <style jsx global>{`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .no-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>
                    {products.map((localProduct) => {
                        const product = allProducts.find(
                            p => p.id === localProduct.id || p.name.toLowerCase() === localProduct.name.toLowerCase()
                        ) || localProduct;
                        return (
                            <div key={product.id} className="w-[50vw] md:w-auto shrink-0">
                                <ProductCard 
                                    product={product} 
                                    isHome={true} 
                                    showTag={true} 
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
