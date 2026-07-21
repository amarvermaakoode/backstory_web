"use client";

import { use, Suspense } from "react";
import ProductsListing from "@/components/layout/ProductsListing";

export default function CategoryListingPage({ params }) {
    const resolvedParams = params && typeof params.then === "function" ? use(params) : (params || {});
    const slug = resolvedParams?.slug || "";

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white text-black flex flex-col font-sans justify-between">
                <main className="flex-1 w-full pt-28 pb-20 px-6 sm:px-10 md:px-12 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-neutral-500 font-semibold">Loading page...</p>
                    </div>
                </main>
            </div>
        }>
            <ProductsListing categorySlug={slug} />
        </Suspense>
    );
}
