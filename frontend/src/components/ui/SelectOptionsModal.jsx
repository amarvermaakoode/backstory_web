"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Plus, Minus, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { API_BASE_URL, getImageUrl } from "@/lib/api";
import { getStockForSizeAndColor } from "@/lib/stock";

export default function SelectOptionsModal({ isOpen, onClose, product, onConfirmAddToCart }) {
    const [selectedSize, setSelectedSize] = useState("");
    const [selectedColor, setSelectedColor] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [availableSizes, setAvailableSizes] = useState([]);
    const [availableColors, setAvailableColors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeProduct, setActiveProduct] = useState(product);

    useEffect(() => {
        setActiveProduct(product);
    }, [product]);

    useEffect(() => {
        if (!isOpen || !product) return;

        setQuantity(1);

        let sizes = product.sizes || [];
        let colors = product.colors || [];

        // If product already has sizes, colors, and variantStock, use them directly
        if (sizes.length > 0 && colors.length > 0 && product.variantStock) {
            setAvailableSizes(sizes);
            setAvailableColors(colors);

            const initialColor = colors[0] || { name: "Default", hex: "#000000" };
            setSelectedColor(initialColor);

            // Pick first in-stock size for initial color
            const firstInStockSize = sizes.find((sz) => getStockForSizeAndColor(sz, initialColor, product) > 0) || sizes[0] || "M";
            setSelectedSize(firstInStockSize);
            return;
        }

        // Fetch full product details if options are incomplete
        const fetchProductDetails = async () => {
            setLoading(true);
            try {
                const idOrSlug = product.slug || product.id || product._id;
                if (!idOrSlug) throw new Error("No product ID/slug");

                const res = await fetch(`${API_BASE_URL}/frontend/products/${idOrSlug}`);
                const data = await res.json();

                if (data.success && data.data) {
                    const dbProd = data.data;
                    const fetchedSizes = dbProd.sizeGuide?.chart?.map(sz => sz.size) || [];
                    const fetchedColors = (dbProd.colors || []).map(c => ({
                        name: c.color?.name || "Default",
                        hex: c.color?.hexCode || "#000000"
                    }));

                    const finalSizes = fetchedSizes.length > 0 ? fetchedSizes : (sizes.length > 0 ? sizes : []);
                    const finalColors = fetchedColors.length > 0 ? fetchedColors : (colors.length > 0 ? colors : [{ name: "Default", hex: "#000000" }]);

                    setAvailableSizes(finalSizes);
                    setAvailableColors(finalColors);
                    setActiveProduct(dbProd);

                    const initialColor = finalColors[0] || null;
                    setSelectedColor(initialColor);

                    const firstInStock = finalSizes.find((sz) => getStockForSizeAndColor(sz, initialColor, dbProd) > 0) || finalSizes[0] || "";
                    setSelectedSize(firstInStock);
                } else {
                    usePropProduct();
                }
            } catch (err) {
                console.error("Failed to fetch product details for modal:", err);
                usePropProduct();
            } finally {
                setLoading(false);
            }
        };

        const usePropProduct = () => {
            const defaultSizes = product.sizes || [];
            const defaultColors = product.colors || [];
            setAvailableSizes(defaultSizes);
            setAvailableColors(defaultColors);

            const initialColor = defaultColors[0] || null;
            setSelectedColor(initialColor);

            const firstInStock = defaultSizes.find((sz) => getStockForSizeAndColor(sz, initialColor, product) > 0) || defaultSizes[0] || "";
            setSelectedSize(firstInStock);
        };

        fetchProductDetails();
    }, [isOpen, product]);

    // Handle Escape key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    if (!isOpen || !product) return null;

    // Full conditional stock check for currently selected size AND color
    const currentStock = getStockForSizeAndColor(selectedSize, selectedColor, activeProduct);
    const isOutOfStock = currentStock === 0;

    const handleConfirm = () => {
        if (isOutOfStock) return;
        const finalSize = selectedSize || availableSizes[0] || "M";
        const finalColor = selectedColor || availableColors[0] || { name: "Default", hex: "#000000" };
        onConfirmAddToCart(activeProduct, quantity, finalSize, finalColor);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-md bg-[#FAF9F6] text-black rounded-[28px] p-6 shadow-2xl border border-neutral-200/80 space-y-6 my-auto z-10 animate-in fade-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 rounded-full hover:bg-neutral-200/70 transition-colors text-neutral-500 hover:text-black cursor-pointer"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5 stroke-[2]" />
                </button>

                {/* Product Header */}
                <div className="flex gap-4 items-center pr-8">
                    <div className="relative w-20 h-20 bg-[#F4F0EA] rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border border-neutral-200/60">
                        {product.image && (
                            <Image
                                src={getImageUrl(product.image)}
                                alt={product.name || "Product image"}
                                fill
                                className="object-contain p-1"
                                sizes="80px"
                                unoptimized
                            />
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        {product.tag && (
                            <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-500 mb-0.5">
                                {product.tag}
                            </span>
                        )}
                        <h3 className="font-sans text-base font-bold text-black leading-snug line-clamp-1" title={product.name}>
                            {product.name && product.name.length > 15
                                ? `${product.name.slice(0, 15)}...`
                                : product.name}
                        </h3>
                        <p className="font-clashDisplay text-lg font-bold text-black mt-1">
                            {product.price}
                        </p>
                    </div>
                </div>

                <div className="h-px bg-neutral-200/80 w-full" />

                {loading ? (
                    <div className="py-8 text-center text-sm font-medium text-neutral-500 animate-pulse">
                        Loading available options...
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* Color Options */}
                        {availableColors.length > 0 && (
                            <div>
                                <div className="flex justify-between items-center mb-2.5">
                                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                                        Color: <span className="text-black font-extrabold">{selectedColor?.name || "Default"}</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    {availableColors.map((colorObj, idx) => {
                                        const colorName = typeof colorObj === "object" ? colorObj.name : colorObj;
                                        const hex = typeof colorObj === "object" ? colorObj.hex : "#000000";
                                        const isSelected = selectedColor?.name === colorName || (typeof selectedColor === "string" && selectedColor === colorName);

                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => {
                                                    const newColor = typeof colorObj === "object" ? colorObj : { name: colorObj, hex };
                                                    setSelectedColor(newColor);
                                                    setQuantity(1);
                                                }}
                                                className={`group relative w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${isSelected ? "ring-2 ring-offset-2 ring-black scale-110" : "hover:scale-105 opacity-80 hover:opacity-100"
                                                    }`}
                                                style={{ backgroundColor: hex }}
                                                title={colorName}
                                            >
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Size Options with Conditional Stock per Size & Color */}
                        {availableSizes.length > 0 && (
                            <div>
                                <div className="flex justify-between items-center mb-2.5">
                                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                                        Select Size: <span className="text-black font-extrabold">{selectedSize}</span>
                                    </span>

                                    {/* Conditional Stock Badge: Only show for Few Left or Out of Stock */}
                                    {selectedSize && (
                                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                                            {currentStock === 0 ? (
                                                <span className="text-red-600 flex items-center gap-1 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    Out of Stock
                                                </span>
                                            ) : currentStock <= 5 ? (
                                                <span className="text-amber-700 flex items-center gap-1 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                                    Only {currentStock} {currentStock === 1 ? "piece" : "pieces"} left!
                                                </span>
                                            ) : null}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    {availableSizes.map((size) => {
                                        const isSelected = selectedSize === size;
                                        const stock = getStockForSizeAndColor(size, selectedColor, activeProduct);
                                        const sizeOutOfStock = stock === 0;
                                        const isLowStock = stock > 0 && stock <= 5;

                                        return (
                                            <button
                                                key={size}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedSize(size);
                                                    setQuantity(1);
                                                }}
                                                className={`min-w-[48px] h-10 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center border relative ${
                                                    sizeOutOfStock
                                                        ? "bg-neutral-100 text-neutral-400 border-neutral-200 line-through opacity-60 cursor-not-allowed"
                                                        : isSelected
                                                        ? "bg-black text-white border-black shadow-sm scale-[1.02] cursor-pointer"
                                                        : "bg-white text-black border-neutral-300 hover:border-black hover:bg-neutral-50 cursor-pointer"
                                                }`}
                                            >
                                                <span>{size}</span>
                                                {isLowStock && !isSelected && (
                                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" title={`Only ${stock} left!`} />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Quantity Selector */}
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-2.5">
                                Quantity
                            </span>
                            <div className="flex items-center w-fit border border-neutral-300 rounded-full bg-white px-2 py-1 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                    disabled={quantity <= 1 || isOutOfStock}
                                    className="p-1 rounded-full text-black hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                                >
                                    <Minus className="w-4 h-4 stroke-[2]" />
                                </button>
                                <span className="font-sans text-sm font-bold w-6 text-center text-black">
                                    {isOutOfStock ? 0 : quantity}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                                    disabled={quantity >= currentStock || isOutOfStock}
                                    className="p-1 rounded-full text-black hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                                >
                                    <Plus className="w-4 h-4 stroke-[2]" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit / Confirm Button */}
                <div className="pt-2">
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={loading || isOutOfStock}
                        className={`w-full h-12 rounded-full font-bold text-sm tracking-wide flex items-center justify-center transition-all shadow-md ${
                            isOutOfStock
                                ? "bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-none"
                                : "bg-black hover:bg-neutral-800 text-white cursor-pointer active:scale-[0.99]"
                        }`}
                    >
                        {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                    </button>
                </div>
            </div>
        </div>
    );
}


