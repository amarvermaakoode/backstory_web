// Comprehensive Variant Stock Matrix (Color + Size)
export const DUMMY_VARIANT_STOCK_MATRIX = {
    blue: { S: 2, M: 8, L: 12, XL: 0, XXL: 0 },
    black: { S: 0, M: 3, L: 6, XL: 1, XXL: 0 },
    white: { S: 15, M: 0, L: 4, XL: 0, XXL: 5 },
    beige: { S: 1, M: 5, L: 0, XL: 2, XXL: 0 },
    navy: { S: 0, M: 0, L: 7, XL: 3, XXL: 0 },
    grey: { S: 4, M: 2, L: 0, XL: 0, XXL: 1 },
    default: { S: 2, M: 8, L: 5, XL: 0, XXL: 0 }
};

/**
 * Full conditional check for stock based on BOTH Size AND Color
 */
export function getStockForSizeAndColor(size, color, product) {
    if (!size) return 0;

    // 1. Explicit out of stock product status
    if (product && (product.status === false || product.outOfStock === true)) {
        return 0;
    }

    const colorName = (typeof color === "object" ? color?.name : color || "Default").toLowerCase().trim();
    const sizeUpper = (size || "").toUpperCase().trim();

    // 2. Backend Inventory / Variant Stock check (if present on product object)
    if (product && Array.isArray(product.inventory)) {
        const match = product.inventory.find(
            (inv) => inv.size?.toUpperCase() === sizeUpper && inv.color?.toLowerCase() === colorName
        );
        if (match && typeof match.stock === "number") return match.stock;
    }

    if (product && product.variantStock && typeof product.variantStock[`${sizeUpper}_${colorName}`] === "number") {
        return product.variantStock[`${sizeUpper}_${colorName}`];
    }

    // 3. Fallback dummy stock matrix lookup by Color and Size
    const colorMatrix = DUMMY_VARIANT_STOCK_MATRIX[colorName] || DUMMY_VARIANT_STOCK_MATRIX["default"];
    if (colorMatrix && colorMatrix[sizeUpper] !== undefined) {
        return colorMatrix[sizeUpper];
    }

    // 4. Seeded deterministic stock calculation for any custom color/size pair
    const seed = `${product?.id || product?.slug || "prod"}-${colorName}-${sizeUpper}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
    }
    const val = Math.abs(hash % 10);
    return val < 2 ? 0 : (val < 4 ? 2 : val + 2);
}
