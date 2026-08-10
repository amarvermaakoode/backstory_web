"use client";

import { Suspense } from "react";
import ProductsListing from "@/components/layout/ProductsListing";

export default function FeaturedListingPage() {
    return (
        <Suspense fallback={null}>
            <ProductsListing />
        </Suspense>
    );
}
