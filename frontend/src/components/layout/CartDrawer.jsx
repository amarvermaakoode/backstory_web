"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus, Trash, ShoppingBag, Check } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { getImageUrl } from "@/lib/api";

export default function CartDrawer() {
    const {
        cartItems,
        isCartOpen,
        cartCount,
        cartSubtotal,
        selectedItemIds,
        selectedCartItems,
        selectedCount,
        selectedSubtotal,
        toggleSelectItem,
        toggleSelectAll,
        updateQuantity,
        removeFromCart,
        closeCart
    } = useCart();

    const drawerRef = useRef(null);

    const activeSelectedIds = selectedItemIds !== null ? selectedItemIds : cartItems.map(i => i.id);
    const allSelected = cartItems.length > 0 && cartItems.every(item => activeSelectedIds.includes(item.id));

    // Close on Escape key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                closeCart();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [closeCart]);

    // Prevent body scroll when cart is open
    useEffect(() => {
        if (isCartOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isCartOpen]);

    return (
        <>
            {/* Backdrop Overlay */}
            <div
                aria-hidden="true"
                className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300 ${isCartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                onClick={closeCart}
            />

            {/* Slide-out Drawer Panel */}
            <div
                ref={drawerRef}
                role="dialog"
                aria-modal="true"
                aria-label="Shopping Cart Drawer"
                inert={!isCartOpen ? "" : undefined}
                className={`fixed top-0 right-0 h-full w-full sm:max-w-[480px] bg-[#FAF9F6] text-black shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${isCartOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200/80">
                    <h2 className="font-clashDisplay text-2xl font-semibold text-black flex items-baseline gap-2">
                        Cart
                        <span className="font-sans text-sm font-normal text-neutral-400">
                            ({cartCount === 1 ? "1 item" : `${cartCount} items`})
                        </span>
                    </h2>
                    <button
                        onClick={closeCart}
                        className="p-1 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer text-neutral-500 hover:text-black"
                        aria-label="Close shopping cart"
                    >
                        <X className="w-6 h-6 stroke-[1.5]" aria-hidden="true" />
                    </button>
                </div>

                {/* Free Delivery Banner (Mockup Spec) */}
                <div className="px-6 mt-4">
                    <div className="flex items-center justify-center text-[10px] sm:text-xs font-medium tracking-wider text-neutral-400 uppercase w-full">
                        <div className="flex-grow border-t border-neutral-200"></div>
                        <span className="px-4">
                            {selectedSubtotal >= 999
                                ? "You qualify for Free Delivery!"
                                : `Free delivery above Rs 999`}
                        </span>
                        <div className="flex-grow border-t border-neutral-200"></div>
                    </div>
                </div>

                {/* Select All Bar */}
                {cartItems.length > 0 && (
                    <div className="flex items-center justify-between px-6 pt-4 pb-1">
                        <button
                            type="button"
                            onClick={toggleSelectAll}
                            className="flex items-center gap-2 text-xs font-medium text-neutral-700 hover:text-black transition-colors cursor-pointer"
                        >
                            <div
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                    allSelected
                                        ? "bg-black border-black text-white"
                                        : "border-neutral-300 bg-white"
                                }`}
                            >
                                {allSelected && <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />}
                            </div>
                            <span>Select All ({cartItems.length})</span>
                        </button>
                    </div>
                )}

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto px-6 py-4 mt-1 custom-scrollbar">
                    {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                            <div className="w-16 h-16 bg-[#F4F0EA] rounded-full flex items-center justify-center text-neutral-400/80 mb-4 select-none">
                                <ShoppingBag className="w-6 h-6 stroke-[1.25]" aria-hidden="true" />
                            </div>
                            <h3 className="font-sans text-lg font-semibold text-black">Your cart is empty</h3>
                            <p className="text-xs sm:text-sm text-neutral-400 max-w-[280px] leading-relaxed pb-4">
                                Browse our unique collection and find pieces you love.
                            </p>
                            <button
                                onClick={closeCart}
                                className="px-6 py-2 border border-black hover:bg-black hover:text-white transition-colors rounded-full text-xs font-semibold cursor-pointer text-black bg-transparent"
                            >
                                Explore Collection
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {cartItems.map((item) => {
                                const productUrl = item.link || `/products/${item.slug || item.productId || item.id}`;
                                const isSelected = activeSelectedIds.includes(item.id);
                                return (
                                    <div
                                        key={item.id}
                                        className={`flex gap-3.5 items-start pb-6 border-b border-neutral-200/50 last:border-0 last:pb-0 transition-opacity ${
                                            isSelected ? "opacity-100" : "opacity-60 hover:opacity-100"
                                        }`}
                                    >
                                        {/* Selection Checkbox */}
                                        <button
                                            type="button"
                                            onClick={() => toggleSelectItem(item.id)}
                                            className={`mt-2 flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                                                isSelected
                                                    ? "bg-black border-black text-white"
                                                    : "border-neutral-300 hover:border-black bg-white"
                                            }`}
                                            aria-label={isSelected ? `Deselect ${item.name || 'item'}` : `Select ${item.name || 'item'}`}
                                        >
                                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />}
                                        </button>

                                        {/* Product Image Container */}
                                        <Link
                                            href={productUrl}
                                            onClick={closeCart}
                                            className="relative w-20 h-24 sm:w-24 sm:h-28 bg-[#F4F0EA] rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 group cursor-pointer block"
                                        >
                                            <img
                                                src={getImageUrl(item.image)}
                                                alt={item.name || "Product image"}
                                                className="w-full h-full object-contain p-2 select-none group-hover:scale-105 transition-transform duration-300"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "/images/landing-page/coding-tshirt.png";
                                                }}
                                            />
                                        </Link>

                                        {/* Product Details */}
                                        <div className="flex-1 flex flex-col min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div className="min-w-0">
                                                    <Link
                                                        href={productUrl}
                                                        onClick={closeCart}
                                                        className="group block cursor-pointer"
                                                    >
                                                        <h3 className="font-sans text-sm sm:text-base font-semibold text-black truncate pr-2 group-hover:underline transition-colors">
                                                            {item.name || item.title || "Product"}
                                                        </h3>
                                                    </Link>
                                                    <p className="text-[10px] sm:text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mt-0.5">
                                                        {item.tag}
                                                    </p>
                                                </div>

                                                {/* Price */}
                                                <p className="font-clashDisplay text-sm sm:text-base font-bold text-black whitespace-nowrap">
                                                    Rs {((typeof item.priceNum === "number" && !isNaN(item.priceNum) ? item.priceNum : Number(String(item.price || "").replace(/[^0-9.]/g, "")) || 0) * item.quantity).toLocaleString()}
                                                </p>
                                            </div>

                                            {/* Selected options pills */}
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full border border-neutral-200/80 text-neutral-600 bg-white/50 flex items-center select-none">
                                                    {item.size}
                                                </span>
                                                <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full border border-neutral-200/80 text-neutral-600 bg-white/50 flex items-center gap-1.5 select-none">
                                                    <span
                                                        className="w-2 h-2 rounded-full border border-black/10 shadow-xs"
                                                        style={{ backgroundColor: item.color.hex }}
                                                    />
                                                    {item.color.name}
                                                </span>
                                            </div>

                                            {/* Quantity and Actions */}
                                            <div className="flex items-center justify-between mt-4">
                                                {/* Quantity Picker */}
                                                <div className="flex items-center gap-3 bg-neutral-100 rounded-full px-2.5 py-1">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="text-neutral-400 hover:text-black transition-colors cursor-pointer p-0.5"
                                                        aria-label={`Decrease quantity of ${item.name || 'item'}`}
                                                    >
                                                        <Minus className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                                                    </button>
                                                    <span className="text-xs sm:text-sm font-semibold select-none text-neutral-800 w-4 text-center">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="text-neutral-400 hover:text-black transition-colors cursor-pointer p-0.5"
                                                        aria-label={`Increase quantity of ${item.name || 'item'}`}
                                                    >
                                                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                                                    </button>
                                                </div>

                                                {/* Remove Button */}
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="p-1.5 text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
                                                    aria-label={`Remove ${item.name || 'item'} from cart`}
                                                >
                                                    <Trash className="w-4 h-4 stroke-[1.25]" aria-hidden="true" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer (Only rendered when there are items) */}
                {cartItems.length > 0 && (
                    <div className="px-6 py-6 border-t border-neutral-200/80 bg-[#FAF9F6]">
                        {/* Subtotal Row */}
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="text-sm font-medium text-neutral-500">
                                Subtotal ({selectedCount} {selectedCount === 1 ? "item" : "items"})
                            </span>
                            <span className="font-clashDisplay text-xl font-bold text-black">
                                Rs {selectedSubtotal.toLocaleString()}
                            </span>
                        </div>

                        {/* Note */}
                        <p className="text-[11px] sm:text-xs text-neutral-400 text-center mb-4">
                            Shipping calculated at checkout
                        </p>

                        {/* Proceed to Checkout Button */}
                        <Link
                            href="/checkout"
                            onClick={closeCart}
                            className="w-full h-12 bg-[#0F172A] hover:bg-black text-white transition-colors duration-300 rounded-full font-bold text-sm tracking-wide flex items-center justify-center px-6 cursor-pointer shadow-md shadow-black/5"
                        >
                            <span>Proceed to Checkout</span>

                        </Link>

                        {/* Continue Shopping Link */}
                        <button
                            onClick={closeCart}
                            className="w-full text-center text-xs text-neutral-400 hover:text-black transition-colors underline cursor-pointer mt-4 font-medium"
                        >
                            Continue Shopping
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
