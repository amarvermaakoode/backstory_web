"use client";

import { useEffect, useState } from "react";
import { searchProducts } from "@/services/searchService";

const MIN_QUERY_LENGTH = 1;
const EMPTY_STATE = { results: [], total: 0, loading: false, error: null };

/**
 * Debounced product suggestions for the header search overlay.
 *
 * A pending request is aborted whenever the query changes, so a slow
 * response for an older query can never overwrite newer results.
 */
export default function useSearchSuggestions(query, { delay = 275, limit = 6 } = {}) {
    const [state, setState] = useState(EMPTY_STATE);

    useEffect(() => {
        const trimmed = (query || "").trim();

        if (trimmed.length < MIN_QUERY_LENGTH) {
            setState(EMPTY_STATE);
            return;
        }

        const controller = new AbortController();
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const timer = setTimeout(() => {
            searchProducts({ q: trimmed, limit, page: 1, signal: controller.signal })
                .then((data) => {
                    if (controller.signal.aborted) return;
                    setState({
                        results: data.products,
                        total: data.total,
                        loading: false,
                        error: null
                    });
                })
                .catch((err) => {
                    if (controller.signal.aborted || err?.name === "AbortError") return;
                    setState({
                        results: [],
                        total: 0,
                        loading: false,
                        error: err?.message || "Something went wrong. Please try again."
                    });
                });
        }, delay);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query, delay, limit]);

    return state;
}
