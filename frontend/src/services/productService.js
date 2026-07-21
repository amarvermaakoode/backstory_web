import { API_BASE_URL } from "@/lib/api";
import { defaultProducts, getFallbackProduct } from "@/lib/mockData";

/**
 * Service functions for Product data operations.
 */

// Helper to map DB product doc to frontend product model
export const mapProductItem = (item) => {
    const colorsList = (item.colors || []).map(c => ({
        name: c.color?.name || "Default",
        hex: c.color?.hexCode || "#CCCCCC"
    }));
    const sizesList = item.sizeGuide?.chart?.map(sz => sz.size) || ["S", "M", "L"];
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
        tag: item.subCategory?.name || item.category?.Name || "Product",
        rating: "4.7",
        reviewsCount: 63,
        categoryId: item.category?._id || "",
        categorySlug: item.category?.slug || "",
        categoryName: item.category?.Name || "",
        collectionId: item.collection?._id || "",
        collectionSlug: item.collection?.slug || "",
        collectionName: item.collection?.Name || "",
        subCategoryId: item.subCategory?._id || "",
        subCategorySlug: item.subCategory?.slug || "",
        subCategoryName: item.subCategory?.name || "",
        link: `/products/${item.slug || item._id}`
    };
};

// Fetch all products
export async function getProducts() {
    try {
        const res = await fetch(`${API_BASE_URL}/frontend/products`);
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
            return data.data.map(mapProductItem);
        }
        return defaultProducts;
    } catch (err) {
        console.error("Error fetching products, using fallback data:", err);
        return defaultProducts;
    }
}

// Fetch featured products
export async function getFeaturedProducts() {
    try {
        const res = await fetch(`${API_BASE_URL}/frontend/products/featured`);
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
            return data.data.map(mapProductItem);
        }
        return defaultProducts;
    } catch (err) {
        console.error("Error fetching featured products, using fallback data:", err);
        return defaultProducts;
    }
}

// Fetch single product detail by ID or Slug
export async function getProductByIdOrSlug(idOrSlug) {
    try {
        const res = await fetch(`${API_BASE_URL}/frontend/products/${idOrSlug}`);
        const data = await res.json();
        if (data && data.success && data.data) {
            const dbProd = data.data;
            return {
                id: dbProd._id,
                name: dbProd.title,
                price: `Rs ${dbProd.price}`,
                priceNum: Number(dbProd.price),
                image: dbProd.colors?.[0]?.images?.[0] || "",
                tag: dbProd.subCategory?.name || dbProd.category?.Name || "Product",
                rating: dbProd.rating || "4.7",
                reviewsCount: dbProd.reviewsCount || 63,
                description: dbProd.description || "",
                details: {
                    material: dbProd.material || "100% Cotton",
                    fit: dbProd.fit || "Standard Fit",
                    weight: dbProd.weight || "240 GSM",
                    care: dbProd.care || "Machine wash cold"
                },
                colors: (dbProd.colors || []).map(c => ({
                    name: c.color?.name || "Default",
                    hex: c.color?.hexCode || "#CCCCCC",
                    images: c.images || []
                })),
                sizes: dbProd.sizeGuide?.chart?.map(sz => sz.size) || ["S", "M", "L"],
                faqs: dbProd.faqs || []
            };
        }
        return getFallbackProduct(idOrSlug);
    } catch (err) {
        console.error("Error fetching product detail, using fallback product:", err);
        return getFallbackProduct(idOrSlug);
    }
}
