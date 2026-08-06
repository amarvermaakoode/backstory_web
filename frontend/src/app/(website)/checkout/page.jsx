"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { Lock, Check, ShoppingBag, User, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useUserAuth } from "@/context/UserAuthContext";
import Button from "@/components/ui/Button";
import { getImageUrl, API_BASE_URL } from "@/lib/api";

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
    const { user, userFetch } = useUserAuth();

    // Check if the cart has items; if not, use mock items for visual exactness
    const isCartEmpty = cartItems.length === 0;
    const activeItems = isCartEmpty ? mockCheckoutItems : cartItems;
    const activeCount = isCartEmpty ? mockCheckoutItems.reduce((acc, item) => acc + item.quantity, 0) : cartCount;
    const activeSubtotal = isCartEmpty
        ? mockCheckoutItems.reduce((acc, item) => acc + (item.priceNum * item.quantity), 0)
        : cartSubtotal;

    // Contact and Delivery Forms State
    const [formData, setFormData] = useState({
        contactEmail: "",
        newsletter: true,
        firstName: "",
        lastName: "",
        deliveryEmail: "",
        phoneNumber: "",
        streetAddress: "",
        city: "",
        state: "",
        pinCode: "",
        country: "India"
    });

    // Prefill form from localStorage saved address and/or logged-in user details
    useEffect(() => {
        let localData = {};
        try {
            const stored = localStorage.getItem("savedShippingAddress");
            if (stored) {
                localData = JSON.parse(stored);
            }
        } catch (e) {
            console.error("Error reading saved address from localStorage:", e);
        }

        if (user) {
            const nameParts = user.name ? user.name.split(" ") : ["", ""];
            const fName = nameParts[0] || "";
            const lName = nameParts.slice(1).join(" ") || "";

            let savedUserAddress = {};
            if (user.addresses && user.addresses.length > 0) {
                const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
                if (defaultAddr) {
                    const cityStatePinMatch = defaultAddr.cityStatePin ? defaultAddr.cityStatePin.split("-") : [];
                    const pin = cityStatePinMatch.length > 1 ? cityStatePinMatch[1].trim() : "";
                    const cityStateParts = cityStatePinMatch[0] ? cityStatePinMatch[0].split(",") : [];
                    const city = cityStateParts[0] ? cityStateParts[0].trim() : "";
                    const state = cityStateParts[1] ? cityStateParts[1].trim() : "";

                    savedUserAddress = {
                        streetAddress: defaultAddr.addressLine1 || "",
                        city: city,
                        state: state,
                        pinCode: pin,
                        phoneNumber: defaultAddr.phone || ""
                    };
                }
            }

            setFormData(prev => ({
                ...prev,
                ...localData,
                contactEmail: localData.contactEmail || user.email || prev.contactEmail,
                deliveryEmail: localData.deliveryEmail || user.email || prev.deliveryEmail,
                phoneNumber: localData.phoneNumber || user.phoneNumber || savedUserAddress.phoneNumber || prev.phoneNumber,
                firstName: localData.firstName || fName || prev.firstName,
                lastName: localData.lastName || lName || prev.lastName,
                streetAddress: localData.streetAddress || savedUserAddress.streetAddress || prev.streetAddress,
                city: localData.city || savedUserAddress.city || prev.city,
                state: localData.state || savedUserAddress.state || prev.state,
                pinCode: localData.pinCode || savedUserAddress.pinCode || prev.pinCode,
            }));
        } else if (Object.keys(localData).length > 0) {
            setFormData(prev => ({ ...prev, ...localData }));
        }
    }, [user]);

    const [shippingMethod, setShippingMethod] = useState("standard"); // standard, express, international
    const [promoInput, setPromoInput] = useState("");
    const [activePromo, setActivePromo] = useState(null);
    const [promoError, setPromoError] = useState("");
    const [promoSuccess, setPromoSuccess] = useState("");

    // Clear coupon if cart subtotal drops below minimum spend requirement
    useEffect(() => {
        if (activePromo && activeSubtotal < activePromo.minOrderAmount) {
            setActivePromo(null);
            setPromoError(`Promo code cleared: requires minimum spend of Rs ${activePromo.minOrderAmount}`);
            setPromoSuccess("");
        }
    }, [activeSubtotal, activePromo]);

    // Order & Payment state
    const [isOrderComplete, setIsOrderComplete] = useState(false);
    const [generatedOrderNum, setGeneratedOrderNum] = useState("");
    const [pinCodeError, setPinCodeError] = useState("");
    const [isFetchingPincode, setIsFetchingPincode] = useState(false);

    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [paymentError, setPaymentError] = useState("");

    // Auto-fetch city & state via India Post API when valid 6-digit PIN code is typed
    useEffect(() => {
        const pin = formData.pinCode.trim();
        if (pin.length === 6 && /^\d{6}$/.test(pin)) {
            const fetchPincodeDetails = async () => {
                setIsFetchingPincode(true);
                setPinCodeError("");
                try {
                    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
                    const data = await res.json();
                    if (Array.isArray(data) && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
                        const po = data[0].PostOffice[0];
                        const fetchedCity = po.District || po.Block || po.Name || "";
                        const fetchedState = po.State || "";
                        setFormData(prev => {
                            const updated = {
                                ...prev,
                                city: fetchedCity,
                                state: fetchedState
                            };
                            try {
                                localStorage.setItem("savedShippingAddress", JSON.stringify(updated));
                            } catch (e) { }
                            return updated;
                        });
                        setPinCodeError("");
                    } else {
                        setPinCodeError("Invalid PIN code. Please enter a valid Indian PIN code.");
                        setFormData(prev => {
                            const updated = {
                                ...prev,
                                city: "",
                                state: ""
                            };
                            try {
                                localStorage.setItem("savedShippingAddress", JSON.stringify(updated));
                            } catch (e) { }
                            return updated;
                        });
                    }
                } catch (err) {
                    console.error("Error fetching PIN code details:", err);
                    setPinCodeError("");
                } finally {
                    setIsFetchingPincode(false);
                }
            };
            fetchPincodeDetails();
        } else if (pin.length > 0 && pin.length < 6) {
            setPinCodeError("PIN code must be exactly 6 digits.");
        } else {
            setPinCodeError("");
        }
    }, [formData.pinCode]);

    const handleInputChange = (field, value) => {
        const valToSet = field === "pinCode" ? value.replace(/\D/g, "").slice(0, 6) : value;

        setFormData(prev => {
            const updated = {
                ...prev,
                [field]: valToSet
            };
            try {
                localStorage.setItem("savedShippingAddress", JSON.stringify(updated));
            } catch (e) {
                console.error("Error persisting checkout form to localStorage:", e);
            }
            return updated;
        });
    };

    // Save shipping address function
    const saveShippingAddress = async () => {
        const addressLine1 = formData.streetAddress;
        const cityStatePin = `${formData.city}, ${formData.state} - ${formData.pinCode}`;
        const recipientName = `${formData.firstName} ${formData.lastName}`.trim();

        // 1. Save to user profile via backend API if logged in
        if (userFetch) {
            try {
                // Check if identical address already exists in user's saved addresses
                const alreadySaved = user?.addresses && Array.isArray(user.addresses) && user.addresses.some(a =>
                    (a.addressLine1 || "").trim().toLowerCase() === (addressLine1 || "").trim().toLowerCase() &&
                    (a.cityStatePin || "").trim().toLowerCase() === (cityStatePin || "").trim().toLowerCase()
                );

                if (!alreadySaved) {
                    await userFetch("/auth/addresses", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            name: "Shipping Address",
                            recipientName,
                            addressLine1,
                            cityStatePin,
                            phone: formData.phoneNumber,
                            isDefault: true
                        })
                    });
                }
            } catch (err) {
                console.error("Note: Address auto-save to user profile:", err.message);
            }
        }

        // 2. Always persist to localStorage for seamless checkout experience
        try {
            localStorage.setItem("savedShippingAddress", JSON.stringify({
                firstName: formData.firstName,
                lastName: formData.lastName,
                contactEmail: formData.contactEmail,
                deliveryEmail: formData.deliveryEmail,
                phoneNumber: formData.phoneNumber,
                streetAddress: formData.streetAddress,
                city: formData.city,
                state: formData.state,
                pinCode: formData.pinCode,
                country: formData.country
            }));
        } catch (e) {
            console.error("Error saving address to local storage:", e);
        }
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
    const handleApplyPromo = async (e) => {
        e.preventDefault();
        setPromoError("");
        setPromoSuccess("");

        const code = promoInput.trim().toUpperCase();
        if (code === "") {
            setPromoError("Please enter a promo code.");
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/frontend/promo-codes/validate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    code,
                    orderAmount: activeSubtotal
                })
            });
            const data = await res.json();

            if (data.success && data.data) {
                setActivePromo(data.data);
                setPromoSuccess(data.message || "Promo code applied successfully!");
            } else {
                setPromoError(data.message || "Invalid promo code.");
                setActivePromo(null);
            }
        } catch (error) {
            console.error("Error applying promo code:", error);
            setPromoError("Failed to apply promo code. Please try again.");
            setActivePromo(null);
        }
    };

    // Calculation values
    const discountAmount = activePromo
        ? (activePromo.discountType === "percentage"
            ? Math.round(activeSubtotal * (activePromo.discountValue / 100))
            : Math.min(activeSubtotal, activePromo.discountValue))
        : 0;
    const taxableAmount = activeSubtotal - discountAmount;
    const taxAmount = Math.round(taxableAmount * 0.05); // 5% GST as shown in mockup
    const totalAmount = taxableAmount + shippingCost + taxAmount;

    // Helper to dynamically load Razorpay SDK if needed
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (typeof window === "undefined") return resolve(false);
            if (window.Razorpay) return resolve(true);
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // Checkout submission with Razorpay Standard Web Checkout
    const handleCheckoutSubmit = async (e) => {
        e.preventDefault();
        setPaymentError("");

        // Validate PIN code
        if (!/^\d{6}$/.test(formData.pinCode)) {
            setPinCodeError("Please enter a valid 6-digit PIN code.");
            return;
        }
        setPinCodeError("");

        setIsProcessingPayment(true);

        try {
            // STEP 0: Save the user's shipping address
            await saveShippingAddress();

            // Load Razorpay Checkout Script
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded || typeof window.Razorpay === "undefined") {
                setPaymentError("Razorpay Checkout SDK failed to load. Please check your internet connection.");
                setIsProcessingPayment(false);
                return;
            }

            // Amount in paise (1 INR = 100 paise). Minimum 100 paise required by Razorpay API
            const amountInPaise = Math.max(100, Math.round(totalAmount * 100));

            // STEP 1: BACKEND - Create Razorpay Order
            let orderRes = await fetch(`${API_BASE_URL}/create-order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: amountInPaise,
                    currency: "INR",
                    receipt: `bac_receipt_${Date.now()}`
                })
            });

            if (!orderRes.ok) {
                orderRes = await fetch(`${API_BASE_URL}/payment/create-order`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        amount: amountInPaise,
                        currency: "INR",
                        receipt: `bac_receipt_${Date.now()}`
                    })
                });
            }

            const orderData = await orderRes.json();

            if (!orderRes.ok || !orderData.success || !orderData.order_id) {
                throw new Error(orderData.message || "Failed to create Razorpay order on backend.");
            }

            const localOrderId = "BAC-" + Math.floor(100000 + Math.random() * 900000);
            const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TMPgBtafMzjbIX";

            // STEP 2: FRONTEND - Open Razorpay Modal
            const options = {
                key: razorpayKey,
                amount: orderData.amount,
                currency: orderData.currency || "INR",
                name: "BACSTORY",
                description: `Checkout Order ${localOrderId}`,
                order_id: orderData.order_id,
                prefill: {
                    name: `${formData.firstName} ${formData.lastName}`.trim(),
                    email: formData.contactEmail || formData.deliveryEmail,
                    contact: formData.phoneNumber
                },
                notes: {
                    address: `${formData.streetAddress}, ${formData.city}, ${formData.state} - ${formData.pinCode}, ${formData.country}`
                },
                theme: {
                    color: "#000000"
                },
                handler: async function (response) {
                    try {
                        // STEP 3: BACKEND - Verify Signature
                        let verifyRes = await fetch(`${API_BASE_URL}/verify-payment`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        if (!verifyRes.ok) {
                            verifyRes = await fetch(`${API_BASE_URL}/payment/verify-payment`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature
                                })
                            });
                        }

                        const verifyData = await verifyRes.json();

                        if (verifyRes.ok && verifyData.success) {
                            // Payment verified successfully! Finalize order & stock reduction
                            try {
                                const checkoutItems = activeItems.map(item => ({
                                    productId: item.productId || item.id,
                                    size: item.size,
                                    color: item.color,
                                    quantity: item.quantity
                                }));

                                await fetch(`${API_BASE_URL}/frontend/products/reduce-stock`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ items: checkoutItems })
                                });
                            } catch (stockErr) {
                                console.error("Error reducing stock during checkout:", stockErr);
                            }

                            // Save order details to MongoDB database
                            try {
                                const token = localStorage.getItem("userToken");
                                await fetch(`${API_BASE_URL}/frontend/orders`, {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        ...(token && { Authorization: `Bearer ${token}` })
                                    },
                                    body: JSON.stringify({
                                        orderId: localOrderId,
                                        razorpayOrderId: response.razorpay_order_id,
                                        razorpayPaymentId: response.razorpay_payment_id,
                                        razorpaySignature: response.razorpay_signature,
                                        shippingAddress: {
                                            firstName: formData.firstName,
                                            lastName: formData.lastName,
                                            email: formData.contactEmail || formData.deliveryEmail,
                                            phoneNumber: formData.phoneNumber,
                                            streetAddress: formData.streetAddress,
                                            city: formData.city,
                                            state: formData.state,
                                            pinCode: formData.pinCode,
                                            country: formData.country
                                        },
                                        items: activeItems.map(item => ({
                                            productId: item.productId || item.id,
                                            name: item.name || item.title || "Product",
                                            category: item.tag || "COLLECTION",
                                            size: item.size || "M",
                                            color: typeof item.color === "object" ? item.color?.name || "Standard" : (item.color || "Standard"),
                                            colorHex: typeof item.color === "object" ? item.color?.hex : "#000",
                                            price: item.price || `Rs ${item.priceNum || 0}`,
                                            priceNum: typeof item.priceNum === "number" && !isNaN(item.priceNum) ? item.priceNum : Number(String(item.price || "").replace(/[^0-9.]/g, "")) || 0,
                                            quantity: item.quantity || 1,
                                            image: item.image || (Array.isArray(item.images) ? item.images[0] : "") || "/images/landing-page/coding-tshirt.png"
                                        })),
                                        subtotal: activeSubtotal,
                                        discountAmount,
                                        shippingCost,
                                        taxAmount,
                                        totalAmount
                                    })
                                });
                            } catch (dbErr) {
                                console.error("Error saving order to MongoDB:", dbErr);
                            }

                            // Also save to localStorage for offline fallback
                            const newOrder = {
                                id: localOrderId,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpayOrderId: response.razorpay_order_id,
                                createdAt: new Date().toISOString(),
                                items: activeItems.map(item => ({
                                    id: item.id || item.productId,
                                    productId: item.productId || item.id,
                                    name: item.name || item.title || "Product",
                                    category: item.tag || "COLLECTION",
                                    size: item.size || "M",
                                    color: typeof item.color === "object" ? item.color?.name || "Standard" : (item.color || "Standard"),
                                    colorHex: typeof item.color === "object" ? item.color?.hex : "#000",
                                    price: item.price || `Rs ${item.priceNum || 0}`,
                                    quantity: item.quantity || 1,
                                    orderStatus: "Processing",
                                    paymentStatus: "Confirmed",
                                    deliveryDate: "Estimated Delivery: 3-5 Business Days",
                                    image: item.image || (Array.isArray(item.images) ? item.images[0] : "") || "/images/landing-page/coding-tshirt.png"
                                }))
                            };

                            try {
                                const existingOrders = JSON.parse(localStorage.getItem("userOrders") || "[]");
                                localStorage.setItem("userOrders", JSON.stringify([newOrder, ...existingOrders]));
                            } catch (err) {
                                console.error("Error saving user order to local storage:", err);
                            }

                            setGeneratedOrderNum(localOrderId);
                            setIsOrderComplete(true);
                            if (!isCartEmpty) {
                                clearCart();
                            }
                        } else {
                            setPaymentError(verifyData.message || "Payment signature verification failed.");
                        }
                    } catch (verifyErr) {
                        console.error("Error verifying payment:", verifyErr);
                        setPaymentError("Payment verification error. Please contact support.");
                    } finally {
                        setIsProcessingPayment(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessingPayment(false);
                        console.log("Razorpay checkout modal dismissed by user.");
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", function (response) {
                setIsProcessingPayment(false);
                setPaymentError(response.error?.description || response.error?.reason || "Payment failed. Please try again.");
            });
            rzp.open();

        } catch (error) {
            console.error("Checkout error:", error);
            setPaymentError(error.message || "An error occurred while initializing payment.");
            setIsProcessingPayment(false);
        }
    };

    return (
        <div className="bg-[#FAF9F6] min-h-screen text-black selection:bg-neutral-200">
            {/* Razorpay Standard Web Checkout Script */}
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

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
                                <h2 className="heading-sub text-black mb-6">
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
                                <h2 className="heading-sub text-black mb-1">
                                    Delivery Details
                                </h2>
                                <p className="text-xs sm:text-sm text-neutral-400 font-normal mb-8">
                                    Where should we send your order? Your address will be saved upon continuing to payment.
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
                                                placeholder="Enter first name"
                                                className="w-full h-12 border border-neutral-200 rounded-lg px-4 focus:outline-none focus:border-black text-sm font-semibold transition-colors placeholder:text-neutral-300 font-normal"
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
                                                placeholder="Enter last name"
                                                className="w-full h-12 border border-neutral-200 rounded-lg px-4 focus:outline-none focus:border-black text-sm font-semibold transition-colors placeholder:text-neutral-300 font-normal"
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
                                            placeholder="Enter email address"
                                            className="w-full h-12 border border-neutral-200 rounded-lg px-4 focus:outline-none focus:border-black text-sm font-semibold transition-colors placeholder:text-neutral-300 font-normal"
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
                                            placeholder="Enter phone number"
                                            className="w-full h-12 border border-neutral-200 rounded-lg px-4 focus:outline-none focus:border-black text-sm font-semibold transition-colors placeholder:text-neutral-300 font-normal"
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
                                            placeholder="House No, Building, Street, Area"
                                            className="w-full h-12 border border-neutral-200 rounded-lg px-4 focus:outline-none focus:border-black text-sm font-semibold transition-colors placeholder:text-neutral-300 font-normal"
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
                                                placeholder="Enter city"
                                                className="w-full h-12 border border-neutral-200 rounded-lg px-4 focus:outline-none focus:border-black text-sm font-semibold transition-colors placeholder:text-neutral-300 font-normal"
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
                                                placeholder="Enter state"
                                                className="w-full h-12 border border-neutral-200 rounded-lg px-4 focus:outline-none focus:border-black text-sm font-semibold transition-colors placeholder:text-neutral-300 font-normal"
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
                                                placeholder="Enter 6-digit PIN code"
                                                maxLength={6}
                                                className={`w-full h-12 border rounded-lg px-4 focus:outline-none text-sm font-semibold transition-colors placeholder:text-neutral-300 font-normal ${pinCodeError
                                                    ? "border-red-500 focus:border-red-500 bg-red-50/20"
                                                    : "border-neutral-200 focus:border-black"
                                                    }`}
                                            />
                                            {isFetchingPincode && (
                                                <p className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 mt-1.5 select-none">
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                                                    Fetching city & state...
                                                </p>
                                            )}
                                            {pinCodeError && !isFetchingPincode && (
                                                <p className="text-xs text-red-500 font-semibold mt-1.5">{pinCodeError}</p>
                                            )}
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
                                                placeholder="Enter country"
                                                className="w-full h-12 border border-neutral-200 rounded-lg px-4 focus:outline-none focus:border-black text-sm font-semibold transition-colors placeholder:text-neutral-300 font-normal"
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

                            {/* Payment Error Banner */}
                            {paymentError && (
                                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs sm:text-sm font-semibold flex items-center gap-2.5">
                                    <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                                    <span>{paymentError}</span>
                                </div>
                            )}

                            {/* Continue to Payment Button */}
                            <Button
                                type="submit"
                                variant="dark"
                                hasArrow={!isProcessingPayment}
                                disabled={isProcessingPayment}
                                className="w-full mt-10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                            >
                                {isProcessingPayment ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                                        <span>Opening Razorpay Checkout...</span>
                                    </>
                                ) : (
                                    <span>Continue to Payment</span>
                                )}
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
                                                src={getImageUrl(item.image)}
                                                alt={item.name || item.title || "Product image"}
                                                fill
                                                className="object-contain p-1.5 select-none"
                                                sizes="72px"
                                                unoptimized
                                            />
                                        </div>
                                        {/* Product specifications */}
                                        <div className="flex-1 flex flex-col min-w-0">
                                            <div className="flex justify-between items-start gap-1">
                                                <div>
                                                    <h3 className="font-sans text-sm font-semibold text-black truncate pr-1">
                                                        {item.name || item.title || "Product"}
                                                    </h3>
                                                    <p className="text-[10px] font-semibold text-neutral-400 uppercase mt-0.5">
                                                        {item.tag}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-clashDisplay text-sm font-semibold text-black whitespace-nowrap">
                                                        Rs {((typeof item.priceNum === "number" && !isNaN(item.priceNum) ? item.priceNum : Number(String(item.price || "").replace(/[^0-9.]/g, "")) || 0) * (item.quantity || 1)).toLocaleString()}
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
                                                            style={{ backgroundColor: typeof item.color === "object" ? item.color?.hex : "#000" }}
                                                        />
                                                        {typeof item.color === "object" ? item.color?.name : item.color}
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

                                {activePromo && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>Discount ({activePromo.code} - {activePromo.discountType === "percentage" ? `${activePromo.discountValue}% off` : `Rs ${activePromo.discountValue} off`})</span>
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

                        <h2 className="heading-sub text-black">
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
                                <span className="text-neutral-400">Payment Status:</span>
                                <span className="font-bold text-green-600">Paid (Razorpay Verified)</span>
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
                            A confirmation email and order receipt have been sent to <span className="font-semibold text-neutral-600">{formData.contactEmail || formData.deliveryEmail}</span>.
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
