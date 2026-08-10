"use client";

import { use, Suspense } from "react";
import ProductsListing from "@/components/layout/ProductsListing";

export default function CollectionListingPage({ params }) {
    const resolvedParams = params && typeof params.then === "function" ? use(params) : (params || {});
    const slug = resolvedParams?.slug || "";

    return (
        <Suspense fallback={null}>
            <ProductsListing collectionSlug={slug} />
        </Suspense>
    );
}
