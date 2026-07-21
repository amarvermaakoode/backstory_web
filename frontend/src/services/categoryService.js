import { API_BASE_URL } from "@/lib/api";
import { defaultCategories, defaultTribes, defaultCollections } from "@/lib/mockData";

/**
 * Service functions for Categories, Sub-categories (Tribes), and Collections.
 */

export async function getCategories() {
    try {
        const res = await fetch(`${API_BASE_URL}/frontend/categories`);
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
            let fetchedList = [...data.data];
            if (fetchedList.length === 3) {
                fetchedList.push({
                    _id: "more",
                    Name: "More...",
                    image: "/images/landing-page/pants.png"
                });
            }
            return fetchedList;
        }
        return defaultCategories;
    } catch (err) {
        console.error("Error fetching categories, using fallback:", err);
        return defaultCategories;
    }
}

export async function getSubCategories() {
    try {
        const res = await fetch(`${API_BASE_URL}/frontend/sub-categories`);
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
            return data.data;
        }
        return defaultTribes;
    } catch (err) {
        console.error("Error fetching sub-categories, using fallback:", err);
        return defaultTribes;
    }
}

export async function getCollections() {
    try {
        const res = await fetch(`${API_BASE_URL}/frontend/collections`);
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
            return data.data;
        }
        return defaultCollections;
    } catch (err) {
        console.error("Error fetching collections, using fallback:", err);
        return defaultCollections;
    }
}
