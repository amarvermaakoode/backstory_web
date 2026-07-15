"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Lock, Check, ShoppingBag, User, ArrowRight, CheckCircle2, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Button from "@/components/ui/Button";

// Fallback items matching the mockup exactly
const mockCheckoutItems = [
    {
        id: "lost-on-purpose-1-xl-cream",
        productId: "lost-on-purpose-1",
        name: "Lost on Purpose",
        price: "Rs 1,100",
        priceNum: 1100,
        image: "/images/landing-page/featured3.png",
        tag: "Biker Series",
        size: "XL",
        color: { name: "Raw Cream", hex: "#EADCC9" },
        quantity: 1
    },
    {
        id: "built-in-public-1-xl-white",
        productId: "built-in-public-1",
        name: "Built in Public",
        price: "Rs 1,500",
        priceNum: 1500,
        image: "/images/landing-page/featured11.png",
        tag: "Coding Series",
        size: "XL",
        color: { name: "Off White", hex: "#FAF8F5" },
        quantity: 1
    }
];

export default function CheckoutPage() {
    const { cartItems, cartSubtotal, cartCount, openCart, clearCart } = useCart();

    // Check if the cart has items; if not, use mock items for visual exactness
    const isCartEmpty = cartItems.length === 0;
    const activeItems = isCartEmpty ? mockCheckoutItems : cartItems;
    const activeCount = isCartEmpty ? mockCheckoutItems.reduce((acc, item) => acc + item.quantity, 0) : cartCount;
    const activeSubtotal = isCartEmpty
        ? mockCheckoutItems.reduce((acc, item) => acc + (item.priceNum * item.quantity), 0)
        : cartSubtotal;

    // Contact and Delivery Forms State
    const [formData, setFormData] = useState({
        contactEmail: "arjun@example.com",
        newsletter: true,
        firstName: "Arjun",
        lastName: "Mehta",
        deliveryEmail: "arjun@example.com",
        phoneNumber: "+91 98765 43210",
        streetAddress: "42 Riders Lane, Apt 3",
        city: "Mumbai",
        state: "Maharashtra",
        pinCode: "400001",
        country: "India"
    });

    const [shippingMethod, setShippingMethod] = useState("standard"); // standard, express, international
    const [promoInput, setPromoInput] = useState("");
    const [appliedDiscount, setAppliedDiscount] = useState(0); // percentage discount
    const [promoError, setPromoError] = useState("");
    const [promoSuccess, setPromoSuccess] = useState("");

    // Order complete state
    const [isOrderComplete, setIsOrderComplete] = useState(false);
    const [generatedOrderNum, setGeneratedOrderNum] = useState("");

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Calculate shipping cost
    const getShippingCost = () => {
        if (shippingMethod === "standard") return 0;
        if (shippingMethod === "express") return 150;
        if (shippingMethod === "international") return 638;
        return 0;
    };

    const shippingCost = getShippingCost();

    // Promo code handler
    const handleApplyPromo = (e) => {
        e.preventDefault();
        setPromoError("");
        setPromoSuccess("");

        const code = promoInput.trim().toUpperCase();
        if (code === "BACSTORY10") {
            setAppliedDiscount(10);
            setPromoSuccess("10% discount applied successfully!");
        } else if (code === "") {
            setPromoError("Please enter a promo code.");
        } else {
            setPromoError("Invalid promo code.");
        }
    };

    // Calculation values
    const discountAmount = Math.round(activeSubtotal * (appliedDiscount / 100));
    const taxableAmount = activeSubtotal - discountAmount;
    const taxAmount = Math.round(taxableAmount * 0.05); // 5% GST as shown in mockup
    const totalAmount = taxableAmount + shippingCost + taxAmount;

    // Checkout submission
    const handleCheckoutSubmit = (e) => {
        e.preventDefault();

        // Generate random order ID
        const orderId = "BSC-" + Math.floor(100000 + Math.random() * 900000);
        setGeneratedOrderNum(orderId);
        setIsOrderComplete(true);

        // Clear active cart if they actually had items
        if (!isCartEmpty) {
            clearCart();
        }
    };

    return (
        <div className="bg-[#FAF9F6] min-h-screen text-black selection:bg-neutral-200">
            {/* Header */}
            <header className="bg-white border-b border-neutral-200/80 sticky top-0 z-40">
                <div className="max-w-[1600px] mx-auto px-12 h-17 flex items-center justify-between">
                    <Link href="/" className="font-clashDisplay text-2xl font-semibold tracking-tight text-black select-none">
                        <Image
                            src="/images/logo-dark.svg"
                            alt="bacstory logo"
                            width={120}
                            height={26}
                            className="h-6 sm:h-7 w-auto object-contain cursor-pointer"
                            priority
                        />
                    </Link>
                    <div className="flex items-center gap-5 text-neutral-600">
                        <button
                            onClick={openCart}
                            className="relative hover:text-black transition-colors cursor-pointer"
                            aria-label="Open Cart"
                        >
                            <ShoppingBag className="h-5.5 w-5.5 stroke-[1.25]" />
                            {activeCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[9px] font-bold rounded-full bg-black text-white flex items-center justify-center">
                                    {activeCount}
                                </span>
                            )}
                        </button>
                        <button className="hover:text-black transition-colors cursor-pointer" aria-label="Account">
                            <User className="h-5.5 w-5.5 stroke-[1.25]" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-10">
                {isCartEmpty && (
                    <div className="mb-6 bg-[#DFD7CC]/30 border border-[#DFD7CC]/60 text-xs sm:text-sm text-neutral-800 px-4 py-3 rounded-xl flex items-center gap-2 select-none">
                        <span className="font-semibold">Demo Mode:</span> Your cart is currently empty. Showing demo items matching design spec.
                    </div>
                )}

                <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                    {/* Left Column: Form Cards */}
                    <div className="lg:col-span-7 space-y-8">

                        {/* Contact & Delivery Details Block */}
                        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/50 shadow-xs">
                            {/* Contact Details Section */}
                            <div className="border-b border-neutral-100 pb-8">
                                <h2 className="font-clashDisplay text-2xl font-semibold text-black tracking-tight mb-6">
                                    Contact Details
                                </h2>
                                <div className="space-y-4">
                                    <input
                                        type="email"
                                        required
                                        value={formData.contactEmail}
                                        onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                                        placeholder="Email Address"
                                        className="w-full h-12 border border-neutral-200 rounded-lg px-4 focus:outline-none focus:border-black text-sm font-medium transition-colors"
                                    />
                                    <label className="flex items-center gap-2.5 text-xs text-neutral-500 font-semibold cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={formData.newsletter}
                                            onChange={(e) => handleInputChange("newsletter", e.target.checked)}
                                            className="w-4.5 h-4.5 border-neutral-300 rounded-sm text-black focus:ring-black cursor-pointer accent-black"
                                        />
                                        <span>Email me with news and offers</span>
                                    </label>
                                </div>
                            </div>

                            {/* Delivery Details Section */}
                            <div className="pt-8">
                                <h2 className="font-clashDisplay text-2xl font-semibold text-black tracking-tight mb-1">
                                    Delivery Details
                                </h2>
                                <p className="text-xs sm:text-sm text-neutral-400 font-normal mb-8">
                                    Where should we send your order?
                                </p>

                                <div className="space-y-6">
                                    {/* Name Row */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-neutral-400 tracking-wider mb-2 block">
                                                FIRST NAME
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.firstName}
                                                onChange={(e) => handleInputChange("firstName", e.target.value)}
                                                className="w-full h-12 border border-neutral-200 rounded-lg px-4 focus:outline-none focus:border-black text-sm font-semibold transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-neutral-400 tracking-wider mb-2 block">
                                                LAST NAME
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.lastName}
                                                onChange={(e) => handleInputChange("lastName", e.target.value)}
                                                className="w-full h-12 border border-neutral-200 rounded-lg px-4 focus:outline-none focus:border-black text-sm font-semibold transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {/* Email Address */}
                                    <div>
                                        <label className="text-[10px] font-bold text-neutral-400 tracking-wider mb-2 block">
                                            EMAIL ADDRESS
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.deliveryEmail}
                                            onChange={(e) => handleInputChange("deliveryEmail", e.target.value)}
                                            className="w-full h-12 border border-neutral-200 rounded-lg px-4 focus:outline-none focus:border-black text-sm font-semibold transition-colors"
                                        />
                                    </div>

                                    {/* Phone Number */}
                                    <div>
                                        <label className="text-[10px] font-bold text-neutral-400 tracking-wider mb-2 block">
                                            PHONE NUMBER
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phoneNumber}
                                            onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                                            className="w-full h-12 border border-neutral-200 rounded-lg px-4 focus:outline-none focus:border-black text-sm font-semibold transition-colors"
                                        />
                                    </div>

                                    {/* Street Address */}
                                    <div>
                                        <label className="text-[10px] font-bold text-neutral-400 tracking-wider mb-2 block">
                                            STREET ADDRESS
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.streetAddress}
                                            onChange={(e) => handleInputChange("streetAddress", e.target.value)}
                                            className="w-full h-12 border border-neutral-200 rounded-lg px-4 focus:outline-none focus:border-black text-sm font-semibold transition-colors"
                                        />
                                    </div>

                                    {/* City & State Row */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-neutral-400 tracking-wider mb-2 block">
                                                CITY
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.city}
                                                onChange={(e) => handleInputChange("city", e.target.value)}
                                                className="w-full h-12 border border-neutral-200 rounded-lg px-4 focus:outline-none focus:border-black text-sm font-semibold transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-neutral-400 tracking-wider mb-2 block">
                                                STATE
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.state}
                                                onChange={(e) => handleInputChange("state", e.target.value)}
                                                className="w-full h-12 border border-neutral-200 rounded-lg px-4 focus:outline-none focus:border-black text-sm font-semibold transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {/* Pin Code & Country Row */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-neutral-400 tracking-wider mb-2 block">
                                                PIN CODE
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.pinCode}
                                                onChange={(e) => handleInputChange("pinCode", e.target.value)}
                                                className="w-full h-12 border border-neutral-200 rounded-lg px-4 focus:outline-none focus:border-black text-sm font-semibold transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-neutral-400 tracking-wider mb-2 block">
                                                COUNTRY
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.country}
                                                onChange={(e) => handleInputChange("country", e.target.value)}
                                                className="w-full h-12 border border-neutral-200 rounded-lg px-4 focus:outline-none focus:border-black text-sm font-semibold transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping Method Selection */}
                                <div className="mt-10">
                                    <label className="text-[11px] font-bold text-neutral-400 tracking-wider mb-4 block">
                                        SHIPPING METHOD
                                    </label>

                                    <div className="space-y-3">
                                        {/* Standard Delivery Option */}
                                        <label
                                            className={`flex items-center justify-between border rounded-xl p-4 cursor-pointer select-none transition-all ${shippingMethod === "standard"
                                                ? "border-black bg-neutral-50/50 shadow-xs"
                                                : "border-neutral-200 hover:border-neutral-300"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="shipping"
                                                    value="standard"
                                                    checked={shippingMethod === "standard"}
                                                    onChange={() => setShippingMethod("standard")}
                                                    className="w-4 h-4 border-neutral-300 focus:ring-black accent-black cursor-pointer"
                                                />
                                                <div>
                                                    <p className="text-sm font-bold text-black">Standard Delivery</p>
                                                    <p className="text-xs text-neutral-400 mt-0.5">3–5 business days</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-black">Free</span>
                                        </label>

                                        {/* Express Delivery Option */}
                                        <label
                                            className={`flex items-center justify-between border rounded-xl p-4 cursor-pointer select-none transition-all ${shippingMethod === "express"
                                                ? "border-black bg-neutral-50/50 shadow-xs"
                                                : "border-neutral-200 hover:border-neutral-300"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="shipping"
                                                    value="express"
                                                    checked={shippingMethod === "express"}
                                                    onChange={() => setShippingMethod("express")}
                                                    className="w-4 h-4 border-neutral-300 focus:ring-black accent-black cursor-pointer"
                                                />
                                                <div>
                                                    <p className="text-sm font-bold text-black">Express Delivery</p>
                                                    <p className="text-xs text-neutral-400 mt-0.5">1–2 business days</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-black">Rs 150</span>
                                        </label>

                                        {/* International Shipping Option */}
                                        <label
                                            className={`flex items-center justify-between border rounded-xl p-4 cursor-pointer select-none transition-all ${shippingMethod === "international"
                                                ? "border-black bg-neutral-50/50 shadow-xs"
                                                : "border-neutral-200 hover:border-neutral-300"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="shipping"
                                                    value="international"
                                                    checked={shippingMethod === "international"}
                                                    onChange={() => setShippingMethod("international")}
                                                    className="w-4 h-4 border-neutral-300 focus:ring-black accent-black cursor-pointer"
                                                />
                                                <div>
                                                    <p className="text-sm font-bold text-black">International Shipping</p>
                                                    <p className="text-xs text-neutral-400 mt-0.5">7–14 business days</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-black">Rs 638</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Continue to Payment Button */}
                            <Button
                                type="submit"
                                variant="dark"
                                hasArrow={true}
                                className="w-full mt-10"
                            >
                                Continue to Payment
                            </Button>
                        </div>
                    </div>

                    {/* Right Column: Order Summary Card */}
                    <div className="lg:col-span-5">
                        <div className="bg-white rounded-3xl p-6 border border-neutral-200/50 shadow-xs h-fit sticky top-24">
                            <span className="text-xs font-bold text-neutral-400 tracking-wider mb-6 block uppercase">
                                Order Summary
                            </span>

                            {/* Cart Items List */}
                            <div className="divide-y divide-neutral-100 max-h-[400px] overflow-y-auto pr-1">
                                {activeItems.map((item) => (
                                    <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0 items-start">
                                        {/* Thumbnail Image Container */}
                                        <div className="relative w-18 h-20 bg-[#F4F0EA] rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                fill
                                                className="object-contain p-1.5 select-none"
                                                sizes="72px"
                                            />
                                        </div>

                                        {/* Product specifications */}
                                        <div className="flex-1 flex flex-col min-w-0">
                                            <div className="flex justify-between items-start gap-1">
                                                <div>
                                                    <h3 className="font-sans text-sm font-semibold text-black truncate pr-1">
                                                        {item.name}
                                                    </h3>
                                                    <p className="text-[10px] font-semibold text-neutral-400 uppercase mt-0.5">
                                                        {item.tag}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-clashDisplay text-sm font-semibold text-black whitespace-nowrap">
                                                        Rs {item.priceNum.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Attributes & Quantity */}
                                            <div className="flex items-center justify-between mt-2.5">
                                                <div className="flex flex-wrap gap-1.5">
                                                    <span className="text-[9px] font-medium px-2 py-0.5 rounded-full border border-neutral-150 text-neutral-500 select-none">
                                                        {item.size}
                                                    </span>
                                                    <span className="text-[9px] font-medium px-2 py-0.5 rounded-full border border-neutral-150 text-neutral-500 flex items-center gap-1 select-none">
                                                        <span
                                                            className="w-1.5 h-1.5 rounded-full border border-black/10 shadow-xs"
                                                            style={{ backgroundColor: item.color.hex }}
                                                        />
                                                        {item.color.name}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider select-none">
                                                    Qty: {item.quantity}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Promo Code Apply Box */}
                            <div className="mt-6 pt-6 border-t border-neutral-100">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Promo code"
                                        value={promoInput}
                                        onChange={(e) => setPromoInput(e.target.value)}
                                        className="flex-1 h-11 border border-neutral-200 rounded-lg px-3 focus:outline-none focus:border-black text-sm font-medium transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleApplyPromo}
                                        className="h-11 px-5 bg-black text-white hover:bg-neutral-800 rounded-full font-bold text-xs tracking-wider transition-colors cursor-pointer flex items-center justify-center select-none"
                                    >
                                        Apply
                                    </button>
                                </div>
                                {promoError && <p className="text-xs text-red-500 font-semibold mt-2 ml-1">{promoError}</p>}
                                {promoSuccess && <p className="text-xs text-green-600 font-semibold mt-2 ml-1">{promoSuccess}</p>}
                            </div>

                            {/* Pricing summary totals */}
                            <div className="mt-6 pt-6 border-t border-neutral-100 space-y-3.5 text-xs sm:text-sm">
                                <div className="flex justify-between text-neutral-500 font-medium">
                                    <span>Subtotal ({activeCount} item{activeCount === 1 ? "" : "s"})</span>
                                    <span className="font-semibold text-black">Rs {activeSubtotal.toLocaleString()}</span>
                                </div>

                                {appliedDiscount > 0 && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>Discount (10% off)</span>
                                        <span className="font-semibold">-Rs {discountAmount.toLocaleString()}</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-neutral-500 font-medium">
                                    <span>Shipping</span>
                                    <span className="font-semibold text-black">
                                        {shippingCost === 0 ? "Free" : `Rs ${shippingCost.toLocaleString()}`}
                                    </span>
                                </div>

                                <div className="flex justify-between text-neutral-500 font-medium">
                                    <span>Tax (GST 5%)</span>
                                    <span className="font-semibold text-black">Rs {taxAmount.toLocaleString()}</span>
                                </div>

                                <div className="border-t border-neutral-100 pt-4 flex justify-between items-baseline mt-4">
                                    <span className="text-sm font-bold text-black">Total</span>
                                    <span className="font-clashDisplay text-xl sm:text-2xl font-bold text-black">
                                        Rs {totalAmount.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Trust Badge Footer */}
                            <div className="mt-6 pt-6 border-t border-neutral-100 flex items-center justify-center gap-6 text-[10px] sm:text-xs text-neutral-400 font-semibold select-none">
                                <div className="flex items-center gap-1.5">
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>Secure Checkout</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>14-day returns</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </main>

            {/* Success Confirmation Modal Overlay */}
            {isOrderComplete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-fade-in flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-6 border border-green-100">
                            <CheckCircle2 className="w-9 h-9 stroke-[1.5]" />
                        </div>

                        <h2 className="font-clashDisplay text-2xl font-bold text-black leading-tight">
                            Order Placed Successfully!
                        </h2>

                        <p className="text-sm text-neutral-400 mt-2 font-medium">
                            Thank you for shopping with us, {formData.firstName}.
                        </p>

                        <div className="my-6 py-4 px-6 bg-neutral-50 rounded-2xl w-full border border-neutral-100 text-left space-y-2">
                            <div className="flex justify-between text-xs sm:text-sm font-medium">
                                <span className="text-neutral-400">Order Number:</span>
                                <span className="font-bold text-black">{generatedOrderNum}</span>
                            </div>
                            <div className="flex justify-between text-xs sm:text-sm font-medium">
                                <span className="text-neutral-400">Shipment Weight:</span>
                                <span className="font-semibold text-black">280 GSM Cotton</span>
                            </div>
                            <div className="flex justify-between text-xs sm:text-sm font-medium">
                                <span className="text-neutral-400">Method:</span>
                                <span className="font-semibold text-black">
                                    {shippingMethod === "standard" ? "Standard Delivery" : shippingMethod === "express" ? "Express Delivery" : "International Shipping"}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs sm:text-sm font-medium border-t border-neutral-200/60 pt-2 mt-2">
                                <span className="text-neutral-400 font-bold">Paid Total:</span>
                                <span className="font-bold text-black font-clashDisplay">Rs {totalAmount.toLocaleString()}</span>
                            </div>
                        </div>

                        <p className="text-xs text-neutral-400 leading-relaxed px-4">
                            A confirmation email and backstory generated script details have been sent to <span className="font-semibold text-neutral-600">{formData.contactEmail}</span>.
                        </p>

                        <Link
                            href="/"
                            onClick={() => setIsOrderComplete(false)}
                            className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white rounded-full font-bold text-sm tracking-wide transition-colors mt-8 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                        >
                            <span>Back to Homepage</span>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
