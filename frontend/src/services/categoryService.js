import { API_BASE_URL } from "@/lib/api";

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
        return [];
    } catch (err) {
        console.error("Error fetching categories:", err);
        return [];
    }
}

export async function getSubCategories() {
    try {
        const res = await fetch(`${API_BASE_URL}/frontend/sub-categories`);
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
            return data.data;
        }
        return [];
    } catch (err) {
        console.error("Error fetching sub-categories:", err);
        return [];
    }
}

export async function getCollections() {
    try {
        const res = await fetch(`${API_BASE_URL}/frontend/collections`);
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
            return data.data;
        }
        return [];
    } catch (err) {
        console.error("Error fetching collections:", err);
        return [];
    }
}
