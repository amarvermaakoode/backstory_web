"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    ArrowRight,
    ArrowLeft,
    Package,
    Truck,
    RotateCcw,
    Check,
    Upload,
    X,
    Edit2,
    CheckCircle2,
    ChevronDown,
    Loader2,
    Video,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CustomSelect from "@/components/ui/CustomSelect";
import { API_BASE_URL, getImageUrl } from "@/lib/api";

// Policy summary data for landing state
const policyItems = [
    {
        number: "01",
        title: "7-day return & exchange window",
        description:
            "Returns and exchanges are accepted within 7 days of delivery. Items must be unused, unwashed, with original tags and packaging intact. Returns are not accepted for used, damaged, or customized products.",
    },
    {
        number: "02",
        title: "Shipping & Return shipping",
        description:
            "Shipping is ₹99 for orders below ₹999, and Free on ₹999+. Customer bears return shipping for change of mind. Bacstory bears all shipping costs for defective, damaged, or incorrect items.",
    },
    {
        number: "03",
        title: "Damaged / Wrong product policy",
        description:
            "Damaged or incorrect products must be reported within 48 hours of delivery with clear photos PLUS a mandatory complete unboxing video. After verification, we arrange free reverse pickup or courier reimbursement.",
    },
    {
        number: "04",
        title: "Order cancellation policy",
        description:
            "Cancel free of charge before your order is packed for dispatch (100% refund for prepaid orders, zero cancellation fee). Once packed or shipped, orders cannot be cancelled.",
    },
    {
        number: "05",
        title: "Refund processing & COD payouts",
        description:
            "Refunds are initiated within 2 business days after returned products pass quality inspection (credited in 5–7 business days). COD refunds are processed via Bank Transfer or UPI.",
    },
    {
        number: "06",
        title: "Exchanges",
        description:
            "Allowed within 7 days for size change, color change (subject to stock), damaged, or incorrect products. One exchange is allowed per order. Store credit or refund if requested item is unavailable.",
    },
];

const stepsOverview = [
    {
        step: "STEP 01",
        title: "Select your items",
        description:
            "Choose eligible items from your recent orders below and pick return or exchange.",
        icon: Package,
    },
    {
        step: "STEP 02",
        title: "Ship it back",
        description:
            "For defective/damaged items or approved returns, we arrange free reverse pickup or provide courier reimbursement instructions.",
        icon: Truck,
    },
    {
        step: "STEP 03",
        title: "Refund or new item",
        description:
            "Refunds are initiated within 2 business days after inspection (credited in 5–7 business days). Exchanges ship upon receipt.",
        icon: RotateCcw,
    },
];



const returnReasonOptions = [
    "Fabric or print quality issue",
    "Product doesn't match description / image",
    "Item defective or damaged",
    "Received wrong item",
    "Changed my mind",
    "Other",
];

const exchangeReasonOptions = [
    "Product is too small/large (Size Change)",
    "Color change (subject to stock)",
    "Item defective or damaged",
    "Received wrong item",
    "Other",
];

export default function ReturnAndExchangePage() {
    // Flow state: "landing" | 1 | 2 | 3 | 4 | "submitted"
    const [currentStep, setCurrentStep] = useState("landing");

    // Form inputs state
    const [orderNumber, setOrderNumber] = useState("");
    const [emailAddress, setEmailAddress] = useState("");

    // Dynamic fetched order data & items
    const [foundOrder, setFoundOrder] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [orderEligibility, setOrderEligibility] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState("");

    // Step 2: Selected items IDs & quantities
    const [selectedItemIds, setSelectedItemIds] = useState([]);
    const [selectedQuantities, setSelectedQuantities] = useState({});

    // Step 3: Reason & Request details
    const [requestType, setRequestType] = useState("return"); // "return" | "exchange"
    const [selectedReason, setSelectedReason] = useState("Fabric or print quality issue");
    const [requestedSize, setRequestedSize] = useState("L");
    const [requestedColor, setRequestedColor] = useState("Black");
    const [additionalNotes, setAdditionalNotes] = useState("");
    const [unboxingVideoFile, setUnboxingVideoFile] = useState(null);
    const [stepError, setStepError] = useState("");
    const [uploadedImages, setUploadedImages] = useState([]);

    // Step 4: Payment mode & COD Bank/UPI refund details
    const [paymentMode, setPaymentMode] = useState("original"); // "original" | "wallet" | "bank" | "upi"
    const [bankHolderName, setBankHolderName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [ifscCode, setIfscCode] = useState("");
    const [upiId, setUpiId] = useState("");

    // Generated Return ID & Submit states
    const [returnRequestId, setReturnRequestId] = useState("");
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState("");

    // Look up real order from MongoDB backend
    const handleFindOrder = async () => {
        setSearchError("");
        if (!orderNumber.trim()) {
            setSearchError("Please enter your Order Number * to proceed.");
            return;
        }

        setSearchLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (orderNumber.trim()) queryParams.append("orderId", orderNumber.trim());
            if (emailAddress.trim()) queryParams.append("email", emailAddress.trim());

            const res = await fetch(`${API_BASE_URL}/frontend/orders/find-order?${queryParams.toString()}`);
            const data = await res.json();

            if (res.ok && data.success && data.data) {
                setFoundOrder(data.data);
                setOrderEligibility(data.eligibility);

                // Map items from fetched database order
                if (data.data.items && Array.isArray(data.data.items) && data.data.items.length > 0) {
                    let allReturnedItems = [];
                    if (Array.isArray(data.data.returnRequestsHistory) && data.data.returnRequestsHistory.length > 0) {
                        data.data.returnRequestsHistory.forEach(req => {
                            if (req.status !== "Rejected" && Array.isArray(req.requestedItems)) {
                                allReturnedItems.push(...req.requestedItems);
                            }
                        });
                    } else if (data.data.returnExchange?.requestedItems) {
                        allReturnedItems = data.data.returnExchange.requestedItems;
                    }

                    const mappedItems = data.data.items.map((i, idx) => {
                        const itemIdStr = i._id?.toString() || `item-${idx + 1}`;
                        const returnedQty = allReturnedItems
                            .filter(ritem => ritem.itemId === itemIdStr || ritem.itemId === i.id || (ritem.name === i.name && ritem.size === i.size && ritem.color === i.color))
                            .reduce((sum, ritem) => sum + (ritem.returnQuantity || 1), 0);

                        const totalQty = i.quantity || 1;
                        const remainingQty = Math.max(0, totalQty - returnedQty);

                        return {
                            id: itemIdStr,
                            title: i.name || "Product",
                            subtitle: i.category || "Collection",
                            size: i.size || "",
                            color: i.color || "",
                            colorDot: i.colorHex || "#000000",
                            price: i.priceNum || 0,
                            quantity: remainingQty,
                            totalOrderedQuantity: totalQty,
                            returnedQuantity: returnedQty,
                            orderId: data.data.orderId,
                            image: i.image || "/images/landing-page/coding-tshirt.png",
                            eligibleExchangeVariants: Array.isArray(i.eligibleExchangeVariants) ? i.eligibleExchangeVariants : [],
                            availableColors: Array.isArray(i.availableColors) ? i.availableColors : [],
                            availableSizes: Array.isArray(i.availableSizes) ? i.availableSizes : []
                        };
                    });

                    setOrderItems(mappedItems);
                    const firstSelectable = mappedItems.find(i => i.quantity > 0) || mappedItems[0];
                    setSelectedItemIds([firstSelectable.id]);

                    const initialQuantities = {};
                    mappedItems.forEach((i) => {
                        initialQuantities[i.id] = i.quantity > 0 ? i.quantity : 1;
                    });
                    setSelectedQuantities(initialQuantities);

                    const initialEligible = firstSelectable?.eligibleExchangeVariants || [];
                    const sizeOrderMap = { XS: 1, S: 2, M: 3, L: 4, XL: 5, XXL: 6, "3XL": 7 };
                    const initialSizes = Array.from(new Set(initialEligible.map(v => v.size)));
                    initialSizes.sort((a, b) => (sizeOrderMap[a.toUpperCase()] || 99) - (sizeOrderMap[b.toUpperCase()] || 99));

                    if (initialSizes.length > 0) {
                        const initSize = initialSizes[0];
                        setRequestedSize(initSize);
                        const initColors = initialEligible
                            .filter(v => v.size.toUpperCase().trim() === initSize.toUpperCase().trim())
                            .map(v => v.color);
                        if (initColors.length > 0) setRequestedColor(initColors[0]);
                    }
                } else {
                    setOrderItems([]);
                    setSelectedItemIds([]);
                    setSelectedQuantities({});
                }

                setCurrentStep(2);
            } else {
                setSearchError(data.message || "No matching order found. Please check order details.");
            }
        } catch (err) {
            console.error("Error looking up order:", err);
            setSearchError("Failed to lookup order. Please try again.");
        } finally {
            setSearchLoading(false);
        }
    };

    // Submit Return or Exchange request to Backend API
    const handleSubmitReturnExchange = async () => {
        setSubmitError("");
        setSubmitLoading(true);

        // Step 4 Validation for COD refund details
        if (requestType === "return" && (foundOrder?.paymentStatus === "COD" || foundOrder?.paymentMethod === "COD")) {
            if (paymentMode === "bank") {
                if (!bankHolderName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
                    setSubmitError("Please fill in all required bank details marked with an asterisk (*).");
                    setSubmitLoading(false);
                    return;
                }
            } else if (paymentMode === "upi") {
                if (!upiId.trim()) {
                    setSubmitError("Please enter your UPI ID * for refund payout.");
                    setSubmitLoading(false);
                    return;
                }
            }
        }

        try {
            const targetOrderId = foundOrder ? foundOrder.orderId : orderNumber;
            const payload = {
                orderId: targetOrderId,
                requestType,
                reason: selectedReason,
                additionalNotes,
                requestedSize: requestType === "exchange" ? requestedSize : "",
                requestedColor: requestType === "exchange" ? requestedColor : "",
                unboxingVideo: unboxingVideoFile ? (unboxingVideoFile.name || "unboxing_video.mp4") : "",
                proofPhotos: uploadedImages,
                refundMethod: paymentMode === "bank" ? "Bank Transfer" : (paymentMode === "upi" ? "UPI" : (paymentMode === "wallet" ? "Bacstory Wallet" : "Original Payment Method")),
                bankHolderName,
                accountNumber,
                ifscCode,
                upiId,
                reportedWithin48Hours: orderEligibility?.isWithin48Hours || true,
                items: selectedItemIds.map((id) => {
                    const itemObj = orderItems.find((i) => i.id === id);
                    return {
                        itemId: id,
                        name: itemObj?.title,
                        size: itemObj?.size,
                        color: itemObj?.color,
                        returnQuantity: selectedQuantities[id] || itemObj?.quantity || 1
                    };
                })
            };

            const res = await fetch(`${API_BASE_URL}/frontend/orders/return-exchange`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok && data.success) {
                const reqId = data.data?.orderId ? `RET-${data.data.orderId}` : `RET-${Math.floor(10000 + Math.random() * 90000)}`;
                setReturnRequestId(reqId);
                setCurrentStep("submitted");
            } else {
                setSubmitError(data.message || "Failed to submit return/exchange request.");
            }
        } catch (err) {
            console.error("Error submitting return/exchange request:", err);
            setSubmitError("Failed to submit request. Please try again.");
        } finally {
            setSubmitLoading(false);
        }
    };

    // Stepper navigation helpers
    const nextStep = () => {
        if (currentStep === "landing") setCurrentStep(1);
        else if (currentStep === 1) handleFindOrder();
        else if (currentStep === 2) setCurrentStep(3);
        else if (currentStep === 3) setCurrentStep(4);
        else if (currentStep === 4) handleSubmitReturnExchange();
    };

    const prevStep = () => {
        if (currentStep === 1) setCurrentStep("landing");
        else if (currentStep === 2) setCurrentStep(1);
        else if (currentStep === 3) setCurrentStep(2);
        else if (currentStep === 4) setCurrentStep(3);
        else if (currentStep === "submitted") setCurrentStep("landing");
    };

    const toggleSelectItem = (id) => {
        if (selectedItemIds.includes(id)) {
            if (selectedItemIds.length > 1) {
                setSelectedItemIds(selectedItemIds.filter((item) => item !== id));
            }
        } else {
            setSelectedItemIds([...selectedItemIds, id]);
        }
    };

    const handleMockUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setUploadedImages((prev) => [...prev, url]);
        }
    };

    const removeImage = (index) => {
        setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    };

    // Calculate selected item details
    const activeItemsList = orderItems;
    const selectedItem = activeItemsList.find((i) => selectedItemIds.includes(i.id)) || activeItemsList[0] || {};
    const itemSubtotal = selectedItemIds.reduce((sum, id) => {
        const item = activeItemsList.find((i) => i.id === id);
        const qty = selectedQuantities[id] || (item ? item.quantity || 1 : 1);
        return sum + (item ? (item.price * qty) : 0);
    }, 0);

    // Shipping cost rule for returns:
    // Bacstory bears shipping costs for defective, damaged, or incorrect items.
    // Customer bears ₹99 return shipping fee for change of mind.
    const isBacstoryFault = ["Damaged product", "Incorrect product", "Item defective or damaged", "Received wrong item"].some(r =>
        selectedReason.toLowerCase().includes(r.toLowerCase())
    );
    const returnShippingFee = isBacstoryFault ? 0 : 99;
    const totalRefund = Math.max(0, itemSubtotal - (requestType === "return" ? returnShippingFee : 0));

    return (
        <div className="min-h-screen bg-[#F9F9F9] text-black flex flex-col font-sans">
            <Navbar solid={true} light={true} />

            <main className="flex-1 w-full pt-10">
                {/* Hero Header Section */}
                <div className="relative w-full h-[200px] sm:h-[320px] md:h-[42vh] bg-black text-white flex flex-col justify-between p-6 sm:p-10 md:p-14 overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <Image
                            src="/images/landing-page/discover-more.png"
                            alt="Return & Exchange Banner"
                            fill
                            priority
                            className="object-cover object-center opacity-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-10" />
                    </div>

                    <div className="relative z-20 mx-auto max-w-[100%] w-full h-full flex flex-col justify-between">
                        <nav className="text-xs sm:text-sm text-white/90 font-normal mt-12 md:mt-14 flex items-center gap-2">
                            <Link href="/" className="hover:text-white transition-colors">
                                Home
                            </Link>
                            <span>/</span>
                            <Link href="/faq" className="hover:text-white transition-colors">
                                Support
                            </Link>
                            <span>/</span>
                            <span className="text-white font-medium">Return & Exchange</span>
                        </nav>

                        <div className="mb-6 space-y-3">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold font-clashDisplay tracking-tight">
                                Return & Exchange
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Content Container */}
                <div className="mx-auto max-w-[1400px] px-4 sm:px-10 md:px-12 py-6 sm:py-16">
                    <style jsx global>{`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .no-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>
                    {/* LANDING PAGE STATE */}
                    {currentStep === "landing" && (
                        <div className="space-y-16 sm:space-y-24">
                            {/* Top Policy Section: 2 Columns */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                                {/* Left Column */}
                                <div className="lg:col-span-5 space-y-6">
                                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold font-clashDisplay text-black leading-[1.15] tracking-tight">
                                        We stand behind every piece we make.
                                    </h2>
                                    <p className="text-neutral-500 text-sm sm:text-base font-normal leading-relaxed max-w-md">
                                        If it doesn&apos;t fit, doesn&apos;t feel right, or just isn&apos;t what you expected - return it. No lectures. No hassle.
                                    </p>

                                    <div className="pt-2">
                                        <button
                                            onClick={() => setCurrentStep(1)}
                                            className="inline-flex items-center gap-3 bg-[#101820] text-white px-6 py-3.5 rounded-full text-sm font-medium hover:bg-black transition-all group cursor-pointer shadow-sm"
                                        >
                                            <span>Start a Return or Exchange</span>
                                            <span className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center group-hover:translate-x-0.5 transition-transform shrink-0">
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="lg:col-span-7 space-y-7">
                                    {policyItems.map((item) => (
                                        <div
                                            key={item.number}
                                            className="flex items-start gap-6 pb-7 border-b border-neutral-200/80 last:border-0 last:pb-0"
                                        >
                                            <span className="text-neutral-300 font-bold text-lg sm:text-xl font-sans tracking-wide shrink-0 pt-0.5 min-w-[28px]">
                                                {item.number}
                                            </span>
                                            <div className="space-y-1.5">
                                                <h3 className="font-semibold text-base sm:text-lg text-black font-sans">
                                                    {item.title}
                                                </h3>
                                                <p className="text-neutral-500 text-xs sm:text-sm font-normal leading-relaxed">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* How It Works Section */}
                            <div className="pt-16 sm:pt-20 border-t border-neutral-200/80">
                                <h2 className="text-2xl sm:text-3xl font-semibold font-clashDisplay text-black mb-10 md:mb-14 tracking-tight">
                                    How it works
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                                    {stepsOverview.map((stepItem) => {
                                        const IconComponent = stepItem.icon;
                                        return (
                                            <div key={stepItem.step} className="space-y-4">
                                                <div className="w-11 h-11 rounded-lg bg-[#F5F5F5] border border-neutral-200/60 flex items-center justify-center text-black">
                                                    <IconComponent className="w-5 h-5 stroke-[1.75]" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                                                        {stepItem.step}
                                                    </span>
                                                    <h3 className="font-semibold text-base sm:text-lg text-black">
                                                        {stepItem.title}
                                                    </h3>
                                                    <p className="text-neutral-500 text-xs sm:text-sm font-normal leading-relaxed">
                                                        {stepItem.description}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MULTI-STEP WIZARD FLOW (Steps 1, 2, 3, 4) */}
                    {typeof currentStep === "number" && (
                        <div className="max-w-2xl mx-auto space-y-6 sm:space-y-10">
                            {/* Back Button */}
                            <div className="hidden sm:block">
                                <button
                                    onClick={prevStep}
                                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-neutral-500 hover:text-black transition-colors cursor-pointer"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Back</span>
                                </button>
                            </div>

                            {/* Stepper Wizard Bar */}
                            <div className="pb-3 border-b border-neutral-200/60 overflow-x-auto no-scrollbar">
                                <div className="flex items-start justify-between min-w-max sm:min-w-0 max-w-xl mx-auto px-1">
                                    {[
                                        { num: 1, label: "Find Order" },
                                        { num: 2, label: "Select Items" },
                                        { num: 3, label: "State Reason" },
                                        { num: 4, label: "Review Details" },
                                    ].map((s, idx, arr) => {
                                        const isCompleted = currentStep > s.num;
                                        const isActive = currentStep === s.num;
                                        return (
                                            <div key={s.num} className="flex items-start">
                                                <div className="flex flex-col items-center gap-1.5 text-center">
                                                    <div
                                                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all ${isCompleted || isActive
                                                            ? "bg-[#101820] text-white shadow-sm"
                                                            : "bg-[#EAEAEA] text-neutral-400"
                                                            }`}
                                                    >
                                                        {isCompleted ? (
                                                            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                                                        ) : (
                                                            s.num
                                                        )}
                                                    </div>
                                                    <span
                                                        className={`text-[10px] sm:text-xs font-medium whitespace-nowrap ${isActive
                                                            ? "text-black font-semibold"
                                                            : isCompleted
                                                                ? "text-neutral-700"
                                                                : "text-neutral-400"
                                                            }`}
                                                    >
                                                        {s.label}
                                                    </span>
                                                </div>

                                                {idx < arr.length - 1 && (
                                                    <div
                                                        className={`h-[2px] w-4 xs:w-6 sm:w-12 md:w-16 mx-1 sm:mx-3 mt-4 transition-colors ${currentStep > s.num ? "bg-black" : "bg-neutral-200"
                                                            }`}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* STEP 1: FIND ORDER */}
                            {currentStep === 1 && (
                                <div className="space-y-8 pt-2">
                                    <div className="text-center sm:text-left space-y-2">
                                        <h2 className="text-2xl sm:text-3xl font-semibold font-clashDisplay text-black tracking-tight">
                                            Find your order
                                        </h2>
                                    </div>

                                    {searchError && (
                                        <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm p-4 rounded-2xl">
                                            {searchError}
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            placeholder="Order Number (e.g. BS-10024) *"
                                            value={orderNumber}
                                            onChange={(e) => {
                                                setOrderNumber(e.target.value);
                                                setSearchError("");
                                            }}
                                            className="w-full bg-[#F4F4F4] border border-transparent rounded-2xl px-6 py-4 text-sm text-black placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-black transition-all"
                                        />

                                        <input
                                            type="email"
                                            placeholder="Email Address (Optional)"
                                            value={emailAddress}
                                            onChange={(e) => {
                                                setEmailAddress(e.target.value);
                                                setSearchError("");
                                            }}
                                            className="w-full bg-[#F4F4F4] border border-transparent rounded-2xl px-6 py-4 text-sm text-black placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-black transition-all"
                                        />

                                        <button
                                            onClick={handleFindOrder}
                                            disabled={searchLoading || !orderNumber.trim()}
                                            className={`w-full py-4 rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-sm ${orderNumber.trim()
                                                ? "bg-[#101820] text-white hover:bg-black cursor-pointer"
                                                : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                                                }`}
                                        >
                                            {searchLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <span>Find my order</span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <p className="text-center text-xs text-neutral-400 pt-4">
                                        Need help? Email{" "}
                                        <a
                                            href="mailto:support@bacstory.com"
                                            className="text-neutral-700 underline underline-offset-2 font-medium hover:text-black"
                                        >
                                            support@bacstory.com
                                        </a>
                                    </p>
                                </div>
                            )}

                            {/* STEP 2: SELECT ITEMS */}
                            {currentStep === 2 && (
                                <div className="space-y-8 pt-2">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl sm:text-3xl font-semibold font-clashDisplay text-black tracking-tight">
                                            Select items to return or exchange
                                        </h2>
                                        {foundOrder && (
                                            <p className="text-xs text-neutral-500">
                                                Order Number: <strong className="text-neutral-900">{foundOrder.orderId}</strong>
                                            </p>
                                        )}


                                        {orderEligibility && !orderEligibility.isWithin7Days && (
                                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900 space-y-1">
                                                <p className="font-bold text-sm text-amber-950">Notice: 7-Day Window Expired</p>
                                                <p>Returns and exchanges are accepted within 7 days of delivery according to Bacstory policy.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        {orderItems.map((item) => {
                                            const isSelected = selectedItemIds.includes(item.id);
                                            const itemOrderedQty = item.quantity || 1;
                                            const returnQty = selectedQuantities[item.id] || itemOrderedQty;

                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`border rounded-2xl p-4 sm:p-5 transition-all ${isSelected
                                                        ? "border-black bg-white shadow-sm"
                                                        : "border-neutral-200/90 bg-white/70 hover:border-neutral-300"
                                                        }`}
                                                >
                                                    <div
                                                        onClick={() => toggleSelectItem(item.id)}
                                                        className="flex items-center justify-between cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-4 sm:gap-5">
                                                            <div className="relative w-16 h-20 sm:w-20 sm:h-24 bg-neutral-100 rounded-xl overflow-hidden shrink-0 border border-neutral-200/60">
                                                                <img
                                                                    src={getImageUrl(item.image)}
                                                                    alt={item.title || "Product image"}
                                                                    className="w-full h-full object-cover object-center"
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = "/images/landing-page/coding-tshirt.png";
                                                                    }}
                                                                />
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <h3 className="font-semibold text-base sm:text-lg text-black">
                                                                    {item.title}
                                                                </h3>
                                                                <p className="text-xs text-neutral-400 font-normal">
                                                                    {item.subtitle}
                                                                </p>
                                                                <div className="flex items-center flex-wrap gap-2 text-[11px] text-neutral-600 font-medium">
                                                                    <span className="bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200/60">
                                                                        {item.size}
                                                                    </span>
                                                                    <span className="flex items-center gap-1.5 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200/60">
                                                                        <span
                                                                            className="w-2 h-2 rounded-full inline-block border border-neutral-300"
                                                                            style={{ backgroundColor: item.colorDot }}
                                                                        />
                                                                        {item.color}
                                                                    </span>
                                                                    {isSelected ? (
                                                                        <div
                                                                            className="flex items-center gap-1 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-300 font-semibold text-neutral-800"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <span className="text-neutral-700">Qty:</span>
                                                                            <button
                                                                                type="button"
                                                                                disabled={returnQty <= 1}
                                                                                onClick={() => {
                                                                                    if (returnQty > 1) {
                                                                                        setSelectedQuantities((prev) => ({ ...prev, [item.id]: returnQty - 1 }));
                                                                                    }
                                                                                }}
                                                                                className="w-4 h-4 flex items-center justify-center rounded bg-white font-bold text-[11px] shadow-2xs hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-neutral-900 border border-neutral-200 ml-0.5"
                                                                            >
                                                                                -
                                                                            </button>
                                                                            <span className="px-1 text-center font-bold text-neutral-900 text-xs">
                                                                                {returnQty}
                                                                            </span>
                                                                            <button
                                                                                type="button"
                                                                                disabled={returnQty >= itemOrderedQty}
                                                                                onClick={() => {
                                                                                    if (returnQty < itemOrderedQty) {
                                                                                        setSelectedQuantities((prev) => ({ ...prev, [item.id]: returnQty + 1 }));
                                                                                    }
                                                                                }}
                                                                                className="w-4 h-4 flex items-center justify-center rounded bg-white font-bold text-[11px] shadow-2xs hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-neutral-900 border border-neutral-200"
                                                                            >
                                                                                +
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200/60 font-semibold text-neutral-700">
                                                                            Qty: {itemOrderedQty}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="text-right space-y-2 shrink-0">
                                                            <p className="font-semibold text-base sm:text-lg text-black">
                                                                Rs {((item.price || 0) * returnQty)?.toLocaleString()}
                                                            </p>
                                                            <p className="text-[11px] text-neutral-400">
                                                                Order {item.orderId}
                                                            </p>
                                                            <div className="flex justify-end pt-1">
                                                                <div
                                                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected
                                                                        ? "bg-[#101820] text-white"
                                                                        : "border-2 border-neutral-300 bg-transparent"
                                                                        }`}
                                                                >
                                                                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {(() => {
                                        const totalSelectedQuantity = selectedItemIds.reduce((sum, id) => {
                                            return sum + (selectedQuantities[id] || 1);
                                        }, 0);

                                        return (
                                            <button
                                                onClick={nextStep}
                                                className="w-full py-4 rounded-full bg-[#101820] text-white font-medium text-sm hover:bg-black transition-all cursor-pointer shadow-sm"
                                            >
                                                Continue with {totalSelectedQuantity} item{totalSelectedQuantity > 1 ? "s" : ""}
                                            </button>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* STEP 3: STATE REASON */}
                            {currentStep === 3 && (
                                <div className="space-y-6 pt-2">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl sm:text-3xl font-semibold font-clashDisplay text-black tracking-tight">
                                            Tell us what went wrong
                                        </h2>
                                    </div>

                                    {/* Selected Item Preview Card */}
                                    <div className="border border-neutral-200/90 rounded-2xl p-4 sm:p-5 bg-white flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-14 h-16 bg-neutral-100 rounded-xl overflow-hidden shrink-0 border border-neutral-200/60">
                                                <img
                                                    src={getImageUrl(selectedItem.image)}
                                                    alt={selectedItem.title || "Product image"}
                                                    className="w-full h-full object-cover object-center"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "/images/landing-page/coding-tshirt.png";
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="font-semibold text-sm sm:text-base text-black">
                                                    {selectedItem.title}
                                                </h3>
                                                <p className="text-xs text-neutral-400">{selectedItem.subtitle}</p>
                                                <div className="flex items-center gap-2 text-[11px] text-neutral-600 font-medium">
                                                    <span className="bg-neutral-100 px-2 py-0.5 rounded-md">
                                                        {selectedItem.size}
                                                    </span>
                                                    <span className="flex items-center gap-1 bg-neutral-100 px-2 py-0.5 rounded-md">
                                                        <span
                                                            className="w-2 h-2 rounded-full inline-block"
                                                            style={{ backgroundColor: selectedItem.colorDot }}
                                                        />
                                                        {selectedItem.color}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-xs text-neutral-400">Order {selectedItem.orderId}</span>
                                    </div>

                                    {/* Options & Inputs Box */}
                                    <div className="border border-neutral-200/90 rounded-2xl p-6 bg-white space-y-6">
                                        {/* Return / Exchange Pill Switch */}
                                        <div className="grid grid-cols-2 gap-3 bg-[#F5F5F5] p-1.5 rounded-full border border-neutral-200/70">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setRequestType("return");
                                                    if (!returnReasonOptions.includes(selectedReason)) {
                                                        setSelectedReason(returnReasonOptions[0]);
                                                    }
                                                }}
                                                className={`py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${requestType === "return"
                                                    ? "bg-[#101820] text-white shadow-sm"
                                                    : "bg-transparent text-neutral-600 hover:text-black"
                                                    }`}
                                            >
                                                <Package className="w-4 h-4" />
                                                <span>Return</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (orderEligibility?.hasAlreadyExchanged) {
                                                        alert("Only one exchange is allowed per order according to Bacstory policy.");
                                                        return;
                                                    }
                                                    setRequestType("exchange");
                                                    if (!exchangeReasonOptions.includes(selectedReason)) {
                                                        setSelectedReason(exchangeReasonOptions[0]);
                                                    }
                                                }}
                                                className={`py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${requestType === "exchange"
                                                    ? "bg-[#101820] text-white shadow-sm"
                                                    : orderEligibility?.hasAlreadyExchanged
                                                        ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                                                        : "bg-transparent text-neutral-600 hover:text-black"
                                                    }`}
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                <span>Exchange {orderEligibility?.hasAlreadyExchanged && "(Limit Reached)"}</span>
                                            </button>
                                        </div>

                                        {orderEligibility?.hasAlreadyExchanged && (
                                            <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-xs text-red-800 font-medium">
                                                Notice: An exchange has already been processed for this order. Only 1 exchange per order is allowed.
                                            </div>
                                        )}

                                        {/* Exchange Options (New Size & Color) */}
                                        {requestType === "exchange" && (() => {
                                            const eligibleVariants = selectedItem?.eligibleExchangeVariants || [];

                                            const sizeOrderMap = { XS: 1, S: 2, M: 3, L: 4, XL: 5, XXL: 6, "3XL": 7 };
                                            const availSizes = Array.from(new Set(eligibleVariants.map(v => v.size)));
                                            availSizes.sort((a, b) => (sizeOrderMap[a.toUpperCase()] || 99) - (sizeOrderMap[b.toUpperCase()] || 99));

                                            if (availSizes.length === 0) {
                                                return (
                                                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900 font-medium">
                                                        No eligible replacement variants (different size/color with available stock) are currently in stock for exchange.
                                                    </div>
                                                );
                                            }

                                            const currentSelectedSize = requestedSize && availSizes.includes(requestedSize) ? requestedSize : availSizes[0];
                                            const colorsForCurrentSize = Array.from(new Set(
                                                eligibleVariants
                                                    .filter(v => v.size.toUpperCase().trim() === currentSelectedSize.toUpperCase().trim())
                                                    .map(v => v.color)
                                            ));

                                            const currentSelectedColor = requestedColor && colorsForCurrentSize.includes(requestedColor)
                                                ? requestedColor
                                                : (colorsForCurrentSize[0] || "");

                                            return (
                                                <div className="bg-purple-50/70 border border-purple-200 p-4 sm:p-5 rounded-2xl space-y-3 text-xs text-purple-950">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-semibold text-sm text-purple-900">Exchange Replacement Preferences</p>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md">
                                                            Available Options Only
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-[11px] font-semibold text-purple-800 mb-1.5">
                                                                Requested Size
                                                            </label>
                                                            <CustomSelect
                                                                options={availSizes.map((sz) => ({ value: sz, label: sz }))}
                                                                value={currentSelectedSize}
                                                                onChange={(e) => {
                                                                    const newSize = e.target.value;
                                                                    setRequestedSize(newSize);
                                                                    const colorsForNewSize = eligibleVariants
                                                                        .filter(v => v.size.toUpperCase().trim() === newSize.toUpperCase().trim())
                                                                        .map(v => v.color);
                                                                    if (colorsForNewSize.length > 0 && !colorsForNewSize.includes(requestedColor)) {
                                                                        setRequestedColor(colorsForNewSize[0]);
                                                                    }
                                                                }}
                                                                placeholder="Select Size"
                                                                showPlaceholderInMenu={false}
                                                                className="!bg-white !border-purple-200 !rounded-xl !py-2.5 !px-3.5 !text-xs text-black hover:!border-purple-300 shadow-2xs"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-semibold text-purple-800 mb-1.5">
                                                                Requested Color
                                                            </label>
                                                            <CustomSelect
                                                                options={colorsForCurrentSize.map((col) => ({ value: col, label: col }))}
                                                                value={currentSelectedColor}
                                                                onChange={(e) => setRequestedColor(e.target.value)}
                                                                placeholder="Select Color"
                                                                showPlaceholderInMenu={false}
                                                                className="!bg-white !border-purple-200 !rounded-xl !py-2.5 !px-3.5 !text-xs text-black hover:!border-purple-300 shadow-2xs"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Reason Select Dropdown */}
                                        <div>
                                            <label className="block text-xs font-semibold text-black mb-1.5 font-sans">
                                                Reason for {requestType === "return" ? "Return" : "Exchange"} <span className="text-red-500">*</span>
                                            </label>
                                            <CustomSelect
                                                options={requestType === "return" ? returnReasonOptions : exchangeReasonOptions}
                                                value={selectedReason}
                                                placeholder="Select a reason"
                                                showPlaceholderInMenu={false}
                                                onChange={(e) => {
                                                    setSelectedReason(e.target.value);
                                                    setStepError("");
                                                }}
                                                className="!bg-[#F4F4F4] !border-transparent !rounded-2xl !py-4 !px-6 !text-sm !font-normal text-black hover:!border-neutral-300"
                                            />
                                        </div>

                                        {/* Additional Notes Textarea */}
                                        <div>
                                            <label className="block text-xs font-semibold text-black mb-1.5 font-sans">
                                                Additional Notes {selectedReason === "Other" && <span className="text-red-500">*</span>}
                                            </label>
                                            <textarea
                                                rows={3}
                                                placeholder={selectedReason === "Other" ? "Please specify your reason in detail..." : "Tell us more about the issue..."}
                                                value={additionalNotes}
                                                onChange={(e) => {
                                                    setAdditionalNotes(e.target.value);
                                                    setStepError("");
                                                }}
                                                className="w-full bg-[#F4F4F4] border border-transparent rounded-2xl p-5 text-sm text-black placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-black transition-all resize-none"
                                            />
                                        </div>

                                        {/* Direct Unboxing Video Upload Field for Damaged / Defective / Wrong Items */}
                                        {(selectedReason.toLowerCase().includes("damaged") || selectedReason.toLowerCase().includes("defective") || selectedReason.toLowerCase().includes("wrong")) && (
                                            <div className="space-y-2">
                                                <label className="block text-xs font-semibold text-black font-sans">
                                                    Unboxing Video <span className="text-red-500">*</span>
                                                </label>
                                                <label className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${unboxingVideoFile
                                                    ? "border-emerald-300 bg-emerald-50/40"
                                                    : "border-amber-300 bg-amber-50/50 hover:bg-amber-100/50"
                                                    } ${orderEligibility?.isWithin48Hours === false ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}>
                                                    <input
                                                        type="file"
                                                        accept="video/*"
                                                        className="hidden"
                                                        disabled={orderEligibility?.isWithin48Hours === false}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                setUnboxingVideoFile({
                                                                    name: file.name,
                                                                    size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
                                                                    url: URL.createObjectURL(file)
                                                                });
                                                                setStepError("");
                                                            }
                                                        }}
                                                    />
                                                    {unboxingVideoFile ? (
                                                        <div className="flex items-center gap-3 w-full justify-between bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                                                                    <Video className="w-4 h-4" />
                                                                </div>
                                                                <div className="min-w-0 text-left">
                                                                    <p className="text-xs font-semibold text-neutral-900 truncate">{unboxingVideoFile.name}</p>
                                                                    <p className="text-[10px] text-neutral-400">{unboxingVideoFile.size}</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setUnboxingVideoFile(null);
                                                                }}
                                                                className="p-1 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-red-600 transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center text-center space-y-1 py-1">
                                                            <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mb-1">
                                                                <Video className="w-4 h-4" />
                                                            </div>
                                                            <p className="text-xs font-semibold text-amber-950">Upload Unboxing Video <span className="text-red-500">*</span></p>
                                                            <p className="text-[11px] text-amber-700 font-normal">Click to select video file from your device (MP4, MOV, AVI)</p>
                                                        </div>
                                                    )}
                                                </label>
                                            </div>
                                        )}

                                        {/* Notice if 48h reporting limit passed for damaged / wrong item */}
                                        {orderEligibility?.isWithin48Hours === false && (selectedReason.toLowerCase().includes("damaged") || selectedReason.toLowerCase().includes("defective") || selectedReason.toLowerCase().includes("wrong")) && (
                                            <div className="bg-red-50 border border-red-200 p-4 rounded-2xl space-y-1 text-xs text-red-900">
                                                <span className="font-bold text-red-950 uppercase tracking-wider block text-[11px]">48-Hour Deadline Passed</span>
                                                <p>Damaged, defective, or incorrect products must be reported within 48 hours of delivery. The 48-hour reporting limit for this order has passed, so this request cannot be submitted.</p>
                                            </div>
                                        )}

                                        {/* Add Product Images Grid */}
                                        <div className="space-y-3 pt-2">
                                            <label className="block text-xs font-semibold text-black font-sans">
                                                Add Clear Product Photos <span className="text-red-500">*</span>
                                            </label>

                                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                                                {/* Upload Trigger Button */}
                                                <label className="w-full aspect-square rounded-xl border-2 border-dashed border-neutral-300 bg-[#F8F8F8] flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-neutral-100/80 transition-all text-neutral-400 hover:text-black">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleMockUpload}
                                                    />
                                                    <Upload className="w-4 h-4 mb-1" />
                                                    <span className="text-[10px] font-medium text-center leading-tight">
                                                        Upload Images
                                                    </span>
                                                </label>

                                                {/* Thumbnails */}
                                                {uploadedImages.map((imgSrc, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="relative w-full aspect-square bg-neutral-100 rounded-xl overflow-hidden border border-neutral-200/80 group"
                                                    >
                                                        <Image
                                                            src={getImageUrl(imgSrc)}
                                                            alt={`Product photo ${idx + 1}`}
                                                            fill
                                                            className="object-cover object-center"
                                                            unoptimized
                                                        />
                                                        <button
                                                            onClick={() => removeImage(idx)}
                                                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black cursor-pointer"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {stepError && (
                                        <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm p-4 rounded-2xl font-medium">
                                            {stepError}
                                        </div>
                                    )}

                                    {(() => {
                                        const isDamagedSelected = selectedReason.toLowerCase().includes("damaged") || selectedReason.toLowerCase().includes("defective") || selectedReason.toLowerCase().includes("wrong");
                                        const isBlockedBy48h = orderEligibility?.isWithin48Hours === false && isDamagedSelected;

                                        const handleStep3Continue = () => {
                                            setStepError("");
                                            if (isBlockedBy48h) {
                                                setStepError("Damaged, defective, or wrong items must be reported within 48 hours of delivery.");
                                                return;
                                            }
                                            if (selectedReason === "Other" && !additionalNotes.trim()) {
                                                setStepError("Please fill in the Additional Notes field to specify your reason.");
                                                return;
                                            }
                                            if (isDamagedSelected && !unboxingVideoFile) {
                                                setStepError("Please upload or record an unboxing video to proceed.");
                                                return;
                                            }
                                            if (uploadedImages.length === 0) {
                                                setStepError("Please upload at least 1 product photo.");
                                                return;
                                            }
                                            nextStep();
                                        };

                                        return (
                                            <button
                                                onClick={handleStep3Continue}
                                                disabled={isBlockedBy48h}
                                                className={`w-full py-4 rounded-full font-medium text-sm transition-all shadow-sm ${isBlockedBy48h
                                                    ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                                                    : "bg-[#101820] text-white hover:bg-black cursor-pointer"
                                                    }`}
                                            >
                                                {isBlockedBy48h ? "Reporting Window Expired (Past 48 Hours)" : "Review Request"}
                                            </button>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* STEP 4: REVIEW DETAILS */}
                            {currentStep === 4 && (
                                <div className="space-y-6 pt-2">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl sm:text-3xl font-semibold font-clashDisplay text-black tracking-tight">
                                            Review your details
                                        </h2>
                                    </div>

                                    {/* Item Overview Card */}
                                    <div className="border border-neutral-200/90 rounded-2xl p-6 bg-white space-y-5">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-16 h-20 bg-neutral-100 rounded-xl overflow-hidden shrink-0 border border-neutral-200/60">
                                                    <img
                                                        src={getImageUrl(selectedItem.image)}
                                                        alt={selectedItem.title || "Product image"}
                                                        className="w-full h-full object-cover object-center"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "/images/landing-page/coding-tshirt.png";
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="font-semibold text-base text-black">
                                                        {selectedItem.title}
                                                    </h3>
                                                    <p className="text-xs text-neutral-400">{selectedItem.subtitle}</p>
                                                    <div className="flex items-center gap-2 text-[11px] text-neutral-600 font-medium pt-1">
                                                        <span className="bg-neutral-100 px-2 py-0.5 rounded-md">
                                                            {selectedItem.size}
                                                        </span>
                                                        <span className="flex items-center gap-1 bg-neutral-100 px-2 py-0.5 rounded-md">
                                                            <span
                                                                className="w-2 h-2 rounded-full inline-block"
                                                                style={{ backgroundColor: selectedItem.colorDot }}
                                                            />
                                                            {selectedItem.color}
                                                        </span>
                                                        <span className="bg-neutral-100 px-2 py-0.5 rounded-md font-semibold text-neutral-900">
                                                            Qty to {requestType}: {selectedQuantities[selectedItem.id] || selectedItem.quantity || 1}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setCurrentStep(3)}
                                                className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-black border border-neutral-200 rounded-full px-3 py-1 bg-white hover:bg-neutral-50 transition-colors cursor-pointer"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                                <span>Edit</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-100 text-xs sm:text-sm">
                                            <div>
                                                <span className="text-neutral-400 block text-[11px] uppercase tracking-wider mb-0.5">
                                                    Reason
                                                </span>
                                                <span className="font-medium text-neutral-800">
                                                    {selectedReason}
                                                </span>
                                            </div>

                                            <div>
                                                <span className="text-neutral-400 block text-[11px] uppercase tracking-wider mb-0.5">
                                                    Type
                                                </span>
                                                <span className="font-medium text-neutral-800 capitalize">
                                                    {requestType}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Refund & Payment Mode Card */}
                                    <div className="border border-neutral-200/90 rounded-2xl p-6 bg-white space-y-6">
                                        <div className="space-y-2 pb-4 border-b border-neutral-100">
                                            <div className="flex items-center justify-between text-xs text-neutral-500">
                                                <span>Item Subtotal</span>
                                                <span className="font-semibold text-neutral-800">Rs {itemSubtotal.toLocaleString()}</span>
                                            </div>
                                            {requestType === "return" && (
                                                <div className="flex items-center justify-between text-xs text-neutral-500">
                                                    <span>Return Shipping Fee</span>
                                                    <span className={returnShippingFee === 0 ? "font-bold text-emerald-600" : "font-semibold text-neutral-800"}>
                                                        {returnShippingFee === 0 ? "FREE (Bacstory Cover)" : `- Rs ${returnShippingFee}`}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                                                <div>
                                                    <h4 className="font-semibold text-base text-black">You&apos;ll receive</h4>
                                                    <p className="text-xs text-neutral-400">
                                                        {requestType === "return" ? "Estimated Refund" : "Exchange Replacement Item"}
                                                    </p>
                                                </div>
                                                <span className="font-semibold text-base text-black">
                                                    {requestType === "return"
                                                        ? `Rs ${totalRefund.toLocaleString()}`
                                                        : `Size: ${requestedSize}${requestedColor ? ` | Color: ${requestedColor}` : ""}`
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        {requestType === "return" && (
                                            <div className="space-y-3">
                                                <label className="block text-xs font-semibold text-black uppercase tracking-wider">
                                                    Select Refund Payout Mode (Initiated within 2 business days after inspection)
                                                </label>

                                                {/* Option 1: Original Payment Method (Only for Prepaid Orders) */}
                                                {!(foundOrder?.paymentMethod === "COD" || foundOrder?.paymentStatus === "COD") && (
                                                    <div
                                                        onClick={() => setPaymentMode("original")}
                                                        className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${paymentMode === "original"
                                                            ? "border-black bg-white shadow-sm"
                                                            : "border-neutral-200/90 bg-[#F9F9F9] hover:border-neutral-300"
                                                            }`}
                                                    >
                                                        <span className="text-sm font-medium text-black">
                                                            {foundOrder?.paymentMethod?.toLowerCase().includes("wallet") || (foundOrder?.walletDeduction && foundOrder?.walletDeduction > 0)
                                                                ? "Original Payment Method (BacStory Wallet - Instant Credit)"
                                                                : "Original Payment Method (Prepaid Orders)"}
                                                        </span>
                                                        <div
                                                            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${paymentMode === "original"
                                                                ? "bg-[#101820] text-white"
                                                                : "border-2 border-neutral-300"
                                                                }`}
                                                        >
                                                            {paymentMode === "original" && (
                                                                <Check className="w-3 h-3 stroke-[3]" />
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Option 2 & 3: Bank Transfer & UPI (Only for COD Orders) */}
                                                {(foundOrder?.paymentMethod === "COD" || foundOrder?.paymentStatus === "COD") && (
                                                    <>
                                                        {/* Option 2: Bank Transfer (COD Orders) */}
                                                        <div
                                                            onClick={() => setPaymentMode("bank")}
                                                            className={`p-4 rounded-2xl border flex flex-col gap-3 cursor-pointer transition-all ${paymentMode === "bank"
                                                                ? "border-black bg-white shadow-sm"
                                                                : "border-neutral-200/90 bg-[#F9F9F9] hover:border-neutral-300"
                                                                }`}
                                                        >
                                                            <div className="flex items-center justify-between w-full">
                                                                <span className="text-sm font-medium text-black">
                                                                    Bank Transfer (COD Refund)
                                                                </span>
                                                                <div
                                                                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${paymentMode === "bank"
                                                                        ? "bg-[#101820] text-white"
                                                                        : "border-2 border-neutral-300"
                                                                        }`}
                                                                >
                                                                    {paymentMode === "bank" && (
                                                                        <Check className="w-3 h-3 stroke-[3]" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {paymentMode === "bank" && (
                                                                <div className="space-y-2 pt-2 border-t border-neutral-100" onClick={(e) => e.stopPropagation()}>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Account Holder Name *"
                                                                        value={bankHolderName}
                                                                        onChange={(e) => setBankHolderName(e.target.value)}
                                                                        className="w-full bg-[#F4F4F4] border border-transparent rounded-xl px-4 py-2.5 text-xs text-black focus:bg-white focus:border-black"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Account Number *"
                                                                        value={accountNumber}
                                                                        onChange={(e) => setAccountNumber(e.target.value)}
                                                                        className="w-full bg-[#F4F4F4] border border-transparent rounded-xl px-4 py-2.5 text-xs text-black focus:bg-white focus:border-black"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        placeholder="IFSC Code *"
                                                                        value={ifscCode}
                                                                        onChange={(e) => setIfscCode(e.target.value)}
                                                                        className="w-full bg-[#F4F4F4] border border-transparent rounded-xl px-4 py-2.5 text-xs text-black focus:bg-white focus:border-black"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Option 3: UPI (COD Refund) */}
                                                        <div
                                                            onClick={() => setPaymentMode("upi")}
                                                            className={`p-4 rounded-2xl border flex flex-col gap-3 cursor-pointer transition-all ${paymentMode === "upi"
                                                                ? "border-black bg-white shadow-sm"
                                                                : "border-neutral-200/90 bg-[#F9F9F9] hover:border-neutral-300"
                                                                }`}
                                                        >
                                                            <div className="flex items-center justify-between w-full">
                                                                <span className="text-sm font-medium text-black">
                                                                    UPI ID (COD Refund)
                                                                </span>
                                                                <div
                                                                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${paymentMode === "upi"
                                                                        ? "bg-[#101820] text-white"
                                                                        : "border-2 border-neutral-300"
                                                                        }`}
                                                                >
                                                                    {paymentMode === "upi" && (
                                                                        <Check className="w-3 h-3 stroke-[3]" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {paymentMode === "upi" && (
                                                                <div className="pt-2 border-t border-neutral-100" onClick={(e) => e.stopPropagation()}>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Enter UPI ID (e.g. name@upi) *"
                                                                        value={upiId}
                                                                        onChange={(e) => setUpiId(e.target.value)}
                                                                        className="w-full bg-[#F4F4F4] border border-transparent rounded-xl px-4 py-2.5 text-xs text-black focus:bg-white focus:border-black"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </>
                                                )}

                                                {/* Option 4: BacStory Wallet */}
                                                <div
                                                    onClick={() => setPaymentMode("wallet")}
                                                    className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${paymentMode === "wallet"
                                                        ? "border-black bg-white shadow-sm"
                                                        : "border-neutral-200/90 bg-[#F9F9F9] hover:border-neutral-300"
                                                        }`}
                                                >
                                                    <span className="text-sm font-medium text-black">
                                                        BacStory Wallet / Store Credit
                                                    </span>
                                                    <div
                                                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${paymentMode === "wallet"
                                                            ? "bg-[#101820] text-white"
                                                            : "border-2 border-neutral-300"
                                                            }`}
                                                    >
                                                        {paymentMode === "wallet" && (
                                                            <Check className="w-3 h-3 stroke-[3]" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <p className="text-xs text-neutral-400 text-center font-light pt-1">
                                            {requestType === "return"
                                                ? "Refunds are initiated within 2 business days after quality inspection, credited in 5–7 business days."
                                                : "Exchanges are processed within 2 business days after quality inspection, dispatched in 5–7 business days."
                                            }
                                        </p>
                                    </div>

                                    {submitError && (
                                        <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm p-4 rounded-2xl">
                                            {submitError}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleSubmitReturnExchange}
                                        disabled={submitLoading}
                                        className="w-full py-4 rounded-full bg-[#101820] text-white font-medium text-sm hover:bg-black transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                                    >
                                        {submitLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <span>Submit {requestType === "return" ? "Return" : "Exchange"} Request</span>
                                        )}
                                    </button>

                                    <p className="text-center text-xs text-neutral-400 pt-2">
                                        Need help? Email{" "}
                                        <a
                                            href="mailto:support@bacstory.com"
                                            className="text-neutral-700 underline underline-offset-2 font-medium hover:text-black"
                                        >
                                            support@bacstory.com
                                        </a>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 5: REQUEST SUBMITTED SUCCESS SCREEN */}
                    {currentStep === "submitted" && (
                        <div className="max-w-xl mx-auto text-center space-y-8 py-0">
                            {/* Animated Checkmark Badge */}
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                                <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 stroke-[1.75]" />
                            </div>

                            <div className="space-y-3">
                                <span className="inline-block bg-neutral-100 text-neutral-700 text-xs font-mono px-4 py-1.5 rounded-full border border-neutral-200">
                                    Request ID: {returnRequestId}
                                </span>
                                <h2 className="text-3xl sm:text-4xl font-semibold font-clashDisplay text-black tracking-tight">
                                    Request Submitted!
                                </h2>
                                <p className="text-neutral-500 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
                                    {requestType === "return"
                                        ? "We've received your return request. A prepaid return shipping label and drop-off instructions have been sent to your email."
                                        : "We've received your exchange request. Instructions for pickup and replacement delivery have been sent to your email."
                                    }
                                </p>
                            </div>

                            {/* Summary Box */}
                            <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 text-left space-y-4 shadow-sm">
                                <h3 className="font-semibold text-sm uppercase tracking-wider text-neutral-400 border-b border-neutral-100 pb-3">
                                    Summary Details
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-neutral-500">Item:</span>
                                        <span className="font-semibold text-black">
                                            {selectedItem.title} ({selectedItem.size} / {selectedItem.color})
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutral-500">Request Type:</span>
                                        <span className="font-semibold text-black capitalize">
                                            {requestType}
                                        </span>
                                    </div>
                                    {requestType === "return" ? (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-neutral-500">Refund Method:</span>
                                                <span className="font-semibold text-black">
                                                    {paymentMode === "original"
                                                        ? "Original Payment Method"
                                                        : paymentMode === "bank"
                                                        ? "Bank Transfer"
                                                        : paymentMode === "upi"
                                                        ? "UPI"
                                                        : "BacStory Wallet"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-neutral-500">Est. Refund:</span>
                                                <span className="font-bold text-black">
                                                    Rs {totalRefund.toLocaleString()}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex justify-between">
                                            <span className="text-neutral-500">Replacement Item:</span>
                                            <span className="font-bold text-black">
                                                Size: {requestedSize}{requestedColor ? ` | Color: ${requestedColor}` : ""}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CTAs */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                <Link
                                    href="/product-list"
                                    className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#101820] text-white text-sm font-medium hover:bg-black transition-colors"
                                >
                                    Continue Shopping
                                </Link>
                                <button
                                    onClick={() => setCurrentStep("landing")}
                                    className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-100 transition-colors cursor-pointer"
                                >
                                    Return & Exchange Policy
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
