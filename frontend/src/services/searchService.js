import { API_BASE_URL } from "@/lib/api";
import { mapProductItem } from "@/services/productService";

/**
 * Service functions for product search.
 * Every result comes from the backend search API — there is no local
 * catalog filtering and no fallback data.
 */

export const SEARCH_PAGE_SIZE = 8;

// Turn the listing filter object into query params the search API understands
export const buildSearchQueryString = ({
    q,
    page = 1,
    limit = SEARCH_PAGE_SIZE,
    sort = "featured",
    filters = {}
} = {}) => {
    const params = new URLSearchParams();
    params.set("q", q);
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (sort && sort !== "featured") params.set("sort", sort);

    if (filters.gender && filters.gender !== "ALL") {
        params.set("gender", filters.gender);
    }
    if (typeof filters.minPrice === "number" && filters.minPrice > 0) {
        params.set("minPrice", String(filters.minPrice));
    }
    if (
        typeof filters.maxPrice === "number" &&
        Number.isFinite(filters.maxPrice) &&
        filters.maxPrice > 0
    ) {
        params.set("maxPrice", String(filters.maxPrice));
    }
    if (filters.sizes?.length) params.set("sizes", filters.sizes.join(","));
    if (filters.colors?.length) params.set("colors", filters.colors.join(","));
    if (filters.series?.length) params.set("series", filters.series.join(","));

    return params.toString();
};

/**
 * Run a product search against the backend.
 * Rejects on network/API failure so callers can render a real error state.
 */
export async function searchProducts({
    q,
    page = 1,
    limit = SEARCH_PAGE_SIZE,
    sort = "featured",
    filters = {},
    signal
} = {}) {
    const trimmed = (q || "").trim();
    if (!trimmed) {
        return { products: [], total: 0, page: 1, totalPages: 0, limit, maxPrice: 0, query: "" };
    }

    const queryString = buildSearchQueryString({ q: trimmed, page, limit, sort, filters });
    const res = await fetch(`${API_BASE_URL}/frontend/search?${queryString}`, { signal });

    let data = null;
    try {
        data = await res.json();
    } catch {
        data = null;
    }

    if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Unable to load search results.");
    }

    return {
        products: Array.isArray(data.data) ? data.data.map(mapProductItem) : [],
        total: data.total || 0,
        page: data.page || page,
        totalPages: data.totalPages || 0,
        limit: data.limit || limit,
        maxPrice: data.maxPrice || 0,
        query: data.query || trimmed
    };
}
