"use client";

import { Suspense } from "react";
import SearchResults from "@/components/layout/SearchResults";

export default function SearchPage() {
    return (
        <Suspense fallback={null}>
            <SearchResults />
        </Suspense>
    );
}
