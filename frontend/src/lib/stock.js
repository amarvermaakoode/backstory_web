/**
 * Full conditional check for stock based on BOTH Size AND Color from real backend inventory data.
 */
export function getStockForSizeAndColor(size, color, product) {
    if (!size || !product) return 0;

    // 1. Explicit out of stock product status
    if (product.status === false || product.outOfStock === true) {
        return 0;
    }

    const getColorName = (c) => {
        if (!c) return "";
        if (typeof c === "string") return c.trim();
        if (typeof c === "object") {
            return (c.name || c.color?.name || c.colorName || "").trim();
        }
        return "";
    };

    const colorName = getColorName(color).toLowerCase();
    const sizeUpper = (size || "").toUpperCase().trim();

    // 2. Backend Array-based Inventory check (if present)
    if (Array.isArray(product.inventory) && product.inventory.length > 0) {
        const match = product.inventory.find(
            (inv) => inv.size?.toUpperCase().trim() === sizeUpper && 
                     inv.color?.toLowerCase().trim() === colorName
        );
        if (match && typeof match.stock === "number") {
            return Math.max(0, match.stock);
        }
    }

    // 3. Backend Object-based variantStock (matrix)
    if (product.variantStock && typeof product.variantStock === "object") {
        // Direct key match: e.g. "XL_navy blue"
        const exactKey = `${sizeUpper}_${colorName}`;
        if (typeof product.variantStock[exactKey] === "number") {
            return Math.max(0, product.variantStock[exactKey]);
        }

        // Robust case-insensitive / whitespace-insensitive key search
        const vsKeys = Object.keys(product.variantStock);
        const normalizedTarget = exactKey.replace(/[\s\-_]/g, "");
        const reverseTarget = `${colorName}_${sizeUpper}`.replace(/[\s\-_]/g, "");

        const matchingKey = vsKeys.find((k) => {
            const normalizedK = k.toLowerCase().replace(/[\s\-_]/g, "");
            return normalizedK === normalizedTarget || normalizedK === reverseTarget;
        });

        if (matchingKey && typeof product.variantStock[matchingKey] === "number") {
            return Math.max(0, product.variantStock[matchingKey]);
        }
    }

    // Default to 0 if stock details are not available or 0 in DB
    return 0;
}
