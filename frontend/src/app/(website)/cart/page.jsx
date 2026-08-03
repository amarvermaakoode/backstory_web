"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
    Heart, 
    Trash2, 
    ShoppingBag, 
    Minus, 
    Plus, 
    ChevronDown, 
    Lock, 
    RotateCcw,
    CreditCard,
    SlidersHorizontal,
    Check
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { getImageUrl, API_BASE_URL } from "@/lib/api";


export default function CartPage() {
    const { 
        cartItems, 
        setCartItems,
        updateQuantity, 
        removeFromCart 
    } = useCart();

    const { toggleWishlist, isInWishlist } = useWishlist();
    
    const [selectedItems, setSelectedItems] = useState([]);
    const [promoCode, setPromoCode] = useState("");
    const [discount, setDiscount] = useState(0);
    const [promoError, setPromoError] = useState("");
    const [promoSuccess, setPromoSuccess] = useState("");
    const [activePromo, setActivePromo] = useState(null);

    // Initialize all items as selected on load
    useEffect(() => {
        if (cartItems.length > 0 && selectedItems.length === 0) {
            setSelectedItems(cartItems.map(item => item.id));
        }
    }, [cartItems]);

    const toggleSelectItem = (id) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter(itemId => itemId !== id));
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    };

    const toggleSelectAll = () => {
        const allItemIds = cartItems.map(item => item.id);
        const allSelected = allItemIds.every(id => selectedItems.includes(id));

        if (allSelected) {
            setSelectedItems([]);
        } else {
            setSelectedItems(allItemIds);
        }
    };

    const handleBulkDelete = () => {
        if (selectedItems.length === 0) return;
        if (confirm("Are you sure you want to remove selected items?")) {
            selectedItems.forEach(id => removeFromCart(id));
            setSelectedItems([]);
        }
    };

    const handleBulkMoveToWishlist = () => {
        if (selectedItems.length === 0) return;
        selectedItems.forEach(id => {
            const item = cartItems.find(c => c.id === id);
            if (item) {
                const product = {
                    id: item.productId,
                    name: item.name,
                    price: item.price,
                    priceNum: item.priceNum,
                    image: item.image,
                    tag: item.tag,
                    colors: item.colors || [item.color],
                    sizes: item.sizes || [item.size]
                };
                if (!isInWishlist(product.id)) {
                    toggleWishlist(product);
                }
                removeFromCart(id);
            }
        });
        setSelectedItems([]);
    };

    const handleMoveToWishlist = (item) => {
        const product = {
            id: item.productId,
            name: item.name,
            price: item.price,
            priceNum: item.priceNum,
            image: item.image,
            tag: item.tag,
            colors: item.colors || [item.color],
            sizes: item.sizes || [item.size]
        };
        if (!isInWishlist(product.id)) {
            toggleWishlist(product);
        }
        removeFromCart(item.id);
        setSelectedItems(selectedItems.filter(id => id !== item.id));
    };

    const handleSizeChange = (itemId, newSize) => {
        setCartItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const uniqueId = `${item.productId}-${newSize}-${item.color.name}`;
                return { ...item, id: uniqueId, size: newSize };
            }
            return item;
        }));
    };

    const handleColorChange = (itemId, newColorName) => {
        setCartItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const colorObj = (item.colors || []).find(c => c.name === newColorName) || item.color;
                const uniqueId = `${item.productId}-${item.size}-${colorObj.name}`;
                return { ...item, id: uniqueId, color: colorObj };
            }
            return item;
        }));
    };

    const handleApplyPromo = async (e) => {
        if (e) e.preventDefault();
        setPromoError("");
        setPromoSuccess("");

        const code = promoCode.trim().toUpperCase();
        if (!code) {
            setPromoError("Please enter a promo code.");
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/frontend/promo-codes/validate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, orderAmount: subtotal })
            });
            const data = await res.json();

            if (data.success && data.data) {
                setActivePromo(data.data);
                const disc = data.data.discountType === "percentage" 
                    ? Math.round(subtotal * (data.data.discountValue / 100)) 
                    : Math.min(subtotal, data.data.discountValue);
                setDiscount(disc);
                setPromoSuccess(data.message || "Promo code applied successfully!");
            } else {
                if (code === "BACSTORY10") {
                    const disc = Math.round(subtotal * 0.1);
                    setDiscount(disc);
                    setPromoSuccess("10% discount applied successfully!");
                } else {
                    setDiscount(0);
                    setActivePromo(null);
                    setPromoError(data.message || "Invalid promo code. Try 'BACSTORY10'");
                }
            }
        } catch (error) {
            console.error("Error applying promo code:", error);
            if (code === "BACSTORY10") {
                const disc = Math.round(subtotal * 0.1);
                setDiscount(disc);
                setPromoSuccess("10% discount applied successfully!");
            } else {
                setDiscount(0);
                setActivePromo(null);
                setPromoError("Invalid promo code. Try 'BACSTORY10'");
            }
        }
    };

    // Calculate Summary based on selected items only
    const selectedCartItems = cartItems.filter(item => selectedItems.includes(item.id));
    const subtotal = selectedCartItems.reduce((acc, item) => acc + (item.priceNum * item.quantity), 0);
    const shipping = subtotal === 0 || subtotal >= 2000 ? 0 : 150;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + shipping + tax - discount;

    const allSelected = cartItems.length > 0 && cartItems.every(item => selectedItems.includes(item.id));

    return (
        <div className="min-h-screen pt-17 bg-[#FAF9F6] text-black selection:bg-neutral-200">
            <Navbar light={true} />

            <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-10">
                {/* Breadcrumbs */}
                <nav className="text-xs text-neutral-400 font-normal">
                    <Link href="/" className="text-black hover:underline">Home</Link>
                    <span className="mx-1">/</span>
                    <span className="text-neutral-500">Cart</span>
                </nav>

                {/* Page Title */}
                <h1 className="heading-page text-black mt-4">
                    Cart
                </h1>

                {cartItems.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-[#F4F0EA] rounded-full flex items-center justify-center text-neutral-400 mb-2">
                            <ShoppingBag className="w-6 h-6 stroke-[1.25]" />
                        </div>
                        <h3 className="text-xl font-semibold text-black">Your cart is empty</h3>
                        <p className="text-sm text-neutral-500 max-w-sm">
                            Add items to your cart from our shop page to get started.
                        </p>
                        <Link
                            href="/"
                            className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-semibold transition-colors"
                        >
                            Explore Products
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-8">
                        {/* Left column: Cart Items list */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Selection Header */}
                            <div className="flex items-center justify-between bg-white px-5 py-4 rounded-xl border border-neutral-100/70">
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={toggleSelectAll}
                                        className={`w-5 h-5 border-2 rounded flex items-center justify-center cursor-pointer transition-colors ${
                                            allSelected 
                                                ? "bg-black border-black text-white" 
                                                : "border-neutral-300 hover:border-black"
                                        }`}
                                    >
                                        {allSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                    </button>
                                    <span className="font-semibold text-sm text-black">
                                        {selectedCartItems.length}/{cartItems.length} Items Selected
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-neutral-400">
                                    <button 
                                        onClick={handleBulkMoveToWishlist}
                                        disabled={selectedItems.length === 0}
                                        className="hover:text-black transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                        aria-label="Move all to Wishlist"
                                    >
                                        <Heart className="w-5 h-5 stroke-[1.75]" />
                                    </button>
                                    <button 
                                        onClick={handleBulkDelete}
                                        disabled={selectedItems.length === 0}
                                        className="hover:text-red-500 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                        aria-label="Remove all"
                                    >
                                        <Trash2 className="w-5 h-5 stroke-[1.75]" />
                                    </button>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="space-y-4">
                                {cartItems.map((item) => {
                                    const isSelected = selectedItems.includes(item.id);
                                        
                                        return (
                                            <div 
                                                key={item.id} 
                                                className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-neutral-100/60"
                                            >
                                                {/* Checkbox */}
                                                <button 
                                                    onClick={() => toggleSelectItem(item.id)}
                                                    className={`w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${
                                                        isSelected 
                                                            ? "bg-black border-black text-white" 
                                                            : "border-neutral-300 hover:border-black"
                                                    }`}
                                                >
                                                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                </button>

                                                {/* Image */}
                                                <div className="relative w-24 h-28 bg-[#F4F0EA] rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    <Image 
                                                        src={getImageUrl(item.image)} 
                                                        alt={item.name || "Product image"} 
                                                        fill 
                                                        className="object-contain p-2 select-none"
                                                        sizes="96px"
                                                        unoptimized
                                                    />
                                                </div>

                                                {/* Details */}
                                                <div className="flex-grow flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
                                                    <div className="space-y-1.5 min-w-0">
                                                        <h3 className="font-sans text-base font-semibold text-black truncate">
                                                            {item.name}
                                                        </h3>
                                                        <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                                                            {item.tag}
                                                        </p>

                                                        {/* Inline Custom Selectors */}
                                                        <div className="flex flex-wrap gap-2 pt-1">
                                                            {/* Size dropdown */}
                                                            <div className="relative">
                                                                <select
                                                                    value={item.size}
                                                                    onChange={(e) => handleSizeChange(item.id, e.target.value)}
                                                                    className="appearance-none pl-3 pr-8 py-1 rounded-full border border-neutral-200 text-xs font-semibold text-neutral-600 bg-white cursor-pointer focus:outline-none focus:border-black hover:border-black transition-colors"
                                                                >
                                                                    {(item.sizes || [item.size]).map((sz, idx) => (
                                                                        <option key={`sz-${sz}-${idx}`} value={sz}>{sz}</option>
                                                                    ))}
                                                                </select>
                                                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none stroke-[2]" />
                                                            </div>

                                                            {/* Color dropdown */}
                                                            <div className="relative">
                                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-black/10" style={{ backgroundColor: item.color?.hex || "#000000" }} />
                                                                <select
                                                                    value={item.color?.name || "Default"}
                                                                    onChange={(e) => handleColorChange(item.id, e.target.value)}
                                                                    className="appearance-none pl-7 pr-8 py-1 rounded-full border border-neutral-200 text-xs font-semibold text-neutral-600 bg-white cursor-pointer focus:outline-none focus:border-black hover:border-black transition-colors"
                                                                >
                                                                    {(item.colors || [item.color]).map((cl, idx) => {
                                                                        const colorName = cl?.name || (typeof cl === "string" ? cl : "Default");
                                                                        return (
                                                                            <option key={`cl-${colorName}-${idx}`} value={colorName}>{colorName}</option>
                                                                        );
                                                                    })}
                                                                </select>
                                                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none stroke-[2]" />
                                                            </div>
                                                        </div>

                                                        {/* Quantity controls */}
                                                        <div className="pt-2">
                                                            <div className="flex items-center justify-between rounded-full bg-[#F3F3F3] p-1 h-10 w-28 select-none">
                                                                <button
                                                                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                                    className="w-8 h-8 rounded-full bg-[#FAF6F0] border border-[#D5C9B9]/60 flex items-center justify-center text-black cursor-pointer hover:bg-[#EADCC9] transition-all"
                                                                    aria-label="Decrease quantity"
                                                                >
                                                                    <Minus className="w-3.5 h-3.5" strokeWidth={3.5} />
                                                                </button>
                                                                <span className="font-bold text-sm text-black text-center w-6">{item.quantity}</span>
                                                                <button
                                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                    className="w-8 h-8 rounded-full bg-[#FAF6F0] border border-[#D5C9B9]/60 flex items-center justify-center text-black cursor-pointer hover:bg-[#EADCC9] transition-all"
                                                                    aria-label="Increase quantity"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" strokeWidth={3.5} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Price / Actions right side */}
                                                    <div className="flex flex-row md:flex-col items-baseline md:items-end justify-between gap-2.5 min-w-[120px]">
                                                        <div className="text-left md:text-right">
                                                             <p className="font-clashDisplay text-lg font-bold text-black">
                                                                 Rs {((typeof item.priceNum === "number" && !isNaN(item.priceNum) ? item.priceNum : Number(String(item.price || "").replace(/[^0-9.]/g, "")) || 0) * item.quantity).toLocaleString()}
                                                             </p>
                                                            <p className="text-xs text-neutral-400 mt-0.5">
                                                                Qty: {item.quantity}
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center gap-3 pt-2 text-neutral-400 text-xs">
                                                            <button 
                                                                onClick={() => handleMoveToWishlist(item)}
                                                                className="flex items-center gap-1 hover:text-black transition-colors cursor-pointer"
                                                            >
                                                                <Heart className="w-4 h-4 stroke-[1.5]" />
                                                                <span className="hidden sm:inline">Move to Wishlist</span>
                                                            </button>
                                                            <button 
                                                                onClick={() => removeFromCart(item.id)}
                                                                className="flex items-center gap-1 hover:text-red-500 transition-colors cursor-pointer"
                                                            >
                                                                <Trash2 className="w-4 h-4 stroke-[1.5]" />
                                                                <span className="hidden sm:inline">Remove</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                        {/* Right column: Order Summary */}
                        <div className="lg:col-span-4">
                            <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-xs space-y-6 lg:sticky lg:top-28 h-fit">
                                <h3 className="heading-sub text-black">
                                    Order Summary
                                </h3>

                                {/* Promo Code */}
                                <div>
                                    <div className="flex">
                                        <input 
                                            type="text" 
                                            placeholder="Promo code" 
                                            value={promoCode}
                                            onChange={(e) => {
                                                setPromoCode(e.target.value);
                                                if (promoError) setPromoError("");
                                                if (promoSuccess) setPromoSuccess("");
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    handleApplyPromo();
                                                }
                                            }}
                                            className="flex-1 border border-neutral-200 rounded-l-full px-4 text-sm focus:outline-none focus:border-black font-sans bg-neutral-50 h-11"
                                        />
                                        <button 
                                            type="button"
                                            onClick={handleApplyPromo}
                                            className="bg-black hover:bg-neutral-800 text-white font-semibold text-xs uppercase tracking-wider rounded-r-full px-6 h-11 transition-colors cursor-pointer"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                    {promoError && (
                                        <p className="text-xs text-red-600 font-semibold mt-2 ml-1">
                                            {promoError}
                                        </p>
                                    )}
                                    {promoSuccess && (
                                        <p className="text-xs text-emerald-600 font-semibold mt-2 ml-1">
                                            {promoSuccess}
                                        </p>
                                    )}
                                </div>

                                {/* Calculation Rows */}
                                <div className="space-y-3 font-sans text-sm pb-4 border-b border-neutral-100">
                                    <div className="flex justify-between items-center text-neutral-600">
                                        <span>Subtotal ({selectedCartItems.length} {selectedCartItems.length === 1 ? "item" : "items"})</span>
                                        <span className="font-semibold text-black">Rs {subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-neutral-600">
                                        <span>Shipping</span>
                                        <span className="font-semibold text-black">
                                            {shipping === 0 ? "Free" : `Rs ${shipping}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-neutral-600">
                                        <span>Tax (GST 5%)</span>
                                        <span className="font-semibold text-black">Rs {tax.toLocaleString()}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between items-center text-green-600">
                                            <span>Coupon Discount</span>
                                            <span className="font-semibold">- Rs {discount.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Total Row */}
                                <div className="flex justify-between items-baseline pt-2">
                                    <span className="font-bold text-base text-black">Total</span>
                                    <span className="font-clashDisplay text-2xl font-bold text-black">
                                        Rs {total.toLocaleString()}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="space-y-4 pt-2">
                                    <Link
                                        href="/checkout"
                                        className="w-full h-14 bg-black hover:bg-neutral-800 text-white rounded-full font-semibold text-sm tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                                    >
                                        <CreditCard className="w-4 h-4 stroke-[2]" />
                                        Proceed to Payment
                                    </Link>
                                    
                                    <Link 
                                        href="/" 
                                        className="block text-center text-neutral-400 hover:text-black text-xs font-semibold underline transition-colors"
                                    >
                                        Continue Shopping
                                    </Link>
                                </div>

                                {/* Security Badge Icons */}
                                <div className="flex flex-col gap-2.5 pt-4 text-xs text-neutral-500 font-sans border-t border-neutral-100">
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-neutral-400" />
                                        <span>Secure Checkout</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RotateCcw className="w-4 h-4 text-neutral-400" />
                                        <span>Easy Return & Exchange</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
