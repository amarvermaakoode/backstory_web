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
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CustomSelect from "@/components/ui/CustomSelect";
import { getImageUrl } from "@/lib/api";

// Policy summary data for landing state
const policyItems = [
    {
        number: "01",
        title: "30-day window",
        description:
            "Items can be returned or exchanged within 30 days of delivery. The item must be unworn, unwashed, and returned with all original tags attached.",
    },
    {
        number: "02",
        title: "Free returns",
        description:
            "We cover the return shipping. A prepaid label is emailed to you within 1–2 business days of submitting your request.",
    },
    {
        number: "03",
        title: "Exceptions",
        description:
            "Sale items marked final sale, intimates, and personalised pieces cannot be returned or exchanged. Damaged or washed items will be rejected on arrival.",
    },
    {
        number: "04",
        title: "Refunds",
        description:
            "Once we receive and inspect your item, refunds are issued to your original payment method within 5–7 business days. You'll receive an email confirmation.",
    },
    {
        number: "05",
        title: "Exchanges",
        description:
            "Select 'Exchange' when starting your request to swap for a different size or colour. Your new item ships as soon as your return is received.",
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
            "We email you a free prepaid label within 1–2 business days. Drop it off at any post office.",
        icon: Truck,
    },
    {
        step: "STEP 03",
        title: "Refund or new item",
        description:
            "Refunds land in 5–7 business days. Exchanges ship as soon as we receive your return.",
        icon: RotateCcw,
    },
];

// Mock Order Items for selection step
const mockOrderItems = [
    {
        id: "item-1",
        title: "Miles Over Words",
        subtitle: "Biker Series",
        size: "XL",
        color: "Black",
        colorDot: "#000000",
        price: 1100,
        orderId: "BS-0421",
        image: "/images/landing-page/coding-tshirt.png",
    },
    {
        id: "item-2",
        title: "Built In Public",
        subtitle: "Original Series",
        size: "M",
        color: "Raw Cream",
        colorDot: "#EFE8D8",
        price: 1499,
        orderId: "BS-0421",
        image: "/images/landing-page/biker-tshirt.png",
    },
    {
        id: "item-3",
        title: "Miles Over Words",
        subtitle: "Biker Series",
        size: "XXL",
        color: "Off White",
        colorDot: "#FAFAFA",
        price: 1200,
        orderId: "BS-0421",
        image: "/images/landing-page/ai-and-tech.png",
    },
];

const reasonOptions = [
    "Product is too small/large",
    "Received wrong item",
    "Item defective or damaged",
    "Quality not as expected",
    "Changed my mind",
];

export default function ReturnAndExchangePage() {
    // Flow state: "landing" | 1 | 2 | 3 | 4 | "submitted"
    const [currentStep, setCurrentStep] = useState("landing");

    // Form inputs state
    const [orderNumber, setOrderNumber] = useState("");
    const [emailAddress, setEmailAddress] = useState("");

    // Step 2: Selected items IDs
    const [selectedItemIds, setSelectedItemIds] = useState(["item-1"]);

    // Step 3: Reason & Request details
    const [requestType, setRequestType] = useState("return"); // "return" | "exchange"
    const [selectedReason, setSelectedReason] = useState("Product is too small/large");
    const [additionalNotes, setAdditionalNotes] = useState("The product is extremely oversized.");
    const [uploadedImages, setUploadedImages] = useState([
        "/images/landing-page/biker-tshirt.png",
        "/images/landing-page/coding-tshirt.png",
        "/images/landing-page/ai-and-tech.png",
        "/images/landing-page/first.png",
    ]);

    // Step 4: Payment mode
    const [paymentMode, setPaymentMode] = useState("original"); // "original" | "wallet"

    // Generated Return ID
    const [returnRequestId, setReturnRequestId] = useState("RET-84920");

    // Stepper navigation helpers
    const nextStep = () => {
        if (currentStep === "landing") setCurrentStep(1);
        else if (currentStep === 1) setCurrentStep(2);
        else if (currentStep === 2) setCurrentStep(3);
        else if (currentStep === 3) setCurrentStep(4);
        else if (currentStep === 4) {
            setReturnRequestId(`RET-${Math.floor(10000 + Math.random() * 90000)}`);
            setCurrentStep("submitted");
        }
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
    const selectedItem = mockOrderItems.find((i) => selectedItemIds.includes(i.id)) || mockOrderItems[0];
    const totalRefund = selectedItemIds.reduce((sum, id) => {
        const item = mockOrderItems.find((i) => i.id === id);
        return sum + (item ? item.price : 0);
    }, 0);

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

                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            placeholder="Order Number"
                                            value={orderNumber}
                                            onChange={(e) => setOrderNumber(e.target.value)}
                                            className="w-full bg-[#F4F4F4] border border-transparent rounded-2xl px-6 py-4 text-sm text-black placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-black transition-all"
                                        />

                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            value={emailAddress}
                                            onChange={(e) => setEmailAddress(e.target.value)}
                                            className="w-full bg-[#F4F4F4] border border-transparent rounded-2xl px-6 py-4 text-sm text-black placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-black transition-all"
                                        />

                                        <button
                                            onClick={nextStep}
                                            disabled={!orderNumber.trim() && !emailAddress.trim()}
                                            className={`w-full py-4 rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-sm ${orderNumber.trim() || emailAddress.trim()
                                                ? "bg-[#101820] text-white hover:bg-black cursor-pointer"
                                                : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                                                }`}
                                        >
                                            <span>Find my order</span>
                                            <ArrowRight className="w-4 h-4" />
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
                                            Select items to return
                                        </h2>
                                    </div>

                                    <div className="space-y-4">
                                        {mockOrderItems.map((item) => {
                                            const isSelected = selectedItemIds.includes(item.id);
                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={() => toggleSelectItem(item.id)}
                                                    className={`border rounded-2xl p-4 sm:p-5 flex items-center justify-between cursor-pointer transition-all ${isSelected
                                                        ? "border-black bg-white shadow-sm"
                                                        : "border-neutral-200/90 bg-white/70 hover:border-neutral-300"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-4 sm:gap-5">
                                                        <div className="relative w-16 h-20 sm:w-20 sm:h-24 bg-neutral-100 rounded-xl overflow-hidden shrink-0 border border-neutral-200/60">
                                                            <Image
                                                                src={getImageUrl(item.image)}
                                                                alt={item.title}
                                                                fill
                                                                className="object-cover object-center"
                                                            />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <h3 className="font-semibold text-base sm:text-lg text-black">
                                                                {item.title}
                                                            </h3>
                                                            <p className="text-xs text-neutral-400 font-normal">
                                                                {item.subtitle}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-[11px] text-neutral-600 font-medium">
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
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-right space-y-2 shrink-0">
                                                        <p className="font-semibold text-base sm:text-lg text-black">
                                                            Rs {item.price.toLocaleString()}
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
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={nextStep}
                                        className="w-full py-4 rounded-full bg-[#101820] text-white font-medium text-sm hover:bg-black transition-all cursor-pointer shadow-sm"
                                    >
                                        Continue with {selectedItemIds.length} item{selectedItemIds.length > 1 ? "s" : ""}
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
                                                <Image
                                                    src={selectedItem.image}
                                                    alt={selectedItem.title}
                                                    fill
                                                    className="object-cover object-center"
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
                                                onClick={() => setRequestType("return")}
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
                                                onClick={() => setRequestType("exchange")}
                                                className={`py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${requestType === "exchange"
                                                    ? "bg-[#101820] text-white shadow-sm"
                                                    : "bg-transparent text-neutral-600 hover:text-black"
                                                    }`}
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                <span>Exchange</span>
                                            </button>
                                        </div>

                                        {/* Reason Select Dropdown */}
                                        <CustomSelect
                                            options={reasonOptions}
                                            value={selectedReason}
                                            placeholder="Select a reason"
                                            showPlaceholderInMenu={false}
                                            onChange={(e) => setSelectedReason(e.target.value)}
                                            className="!bg-[#F4F4F4] !border-transparent !rounded-2xl !py-4 !px-6 !text-sm !font-normal text-black hover:!border-neutral-300"
                                        />

                                        {/* Additional Notes Textarea */}
                                        <textarea
                                            rows={3}
                                            placeholder="Tell us more..."
                                            value={additionalNotes}
                                            onChange={(e) => setAdditionalNotes(e.target.value)}
                                            className="w-full bg-[#F4F4F4] border border-transparent rounded-2xl p-5 text-sm text-black placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-black transition-all resize-none"
                                        />

                                        {/* Add Product Images Grid */}
                                        <div className="space-y-3 pt-2">
                                            <label className="block text-xs font-semibold text-black font-sans">
                                                Add Product Images
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
                                                            src={imgSrc}
                                                            alt={`Product photo ${idx + 1}`}
                                                            fill
                                                            className="object-cover object-center"
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

                                    <button
                                        onClick={nextStep}
                                        className="w-full py-4 rounded-full bg-[#101820] text-white font-medium text-sm hover:bg-black transition-all cursor-pointer shadow-sm"
                                    >
                                        Review Request
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
                                                    <Image
                                                        src={selectedItem.image}
                                                        alt={selectedItem.title}
                                                        fill
                                                        className="object-cover object-center"
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
                                        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                                            <div>
                                                <h4 className="font-semibold text-base text-black">You&apos;ll receive</h4>
                                                <p className="text-xs text-neutral-400">Estimated refund</p>
                                            </div>
                                            <span className="font-bold text-xl sm:text-2xl text-black">
                                                Rs {totalRefund.toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="block text-xs font-semibold text-black uppercase tracking-wider">
                                                Select Payment mode
                                            </label>

                                            {/* Option 1: Original Payment Method */}
                                            <div
                                                onClick={() => setPaymentMode("original")}
                                                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${paymentMode === "original"
                                                    ? "border-black bg-white shadow-sm"
                                                    : "border-neutral-200/90 bg-[#F9F9F9] hover:border-neutral-300"
                                                    }`}
                                            >
                                                <span className="text-sm font-medium text-black">
                                                    Original Payment Method
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

                                            {/* Option 2: BacStory Wallet */}
                                            <div
                                                onClick={() => setPaymentMode("wallet")}
                                                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${paymentMode === "wallet"
                                                    ? "border-black bg-white shadow-sm"
                                                    : "border-neutral-200/90 bg-[#F9F9F9] hover:border-neutral-300"
                                                    }`}
                                            >
                                                <span className="text-sm font-medium text-black">
                                                    BacStory Wallet
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

                                        <p className="text-xs text-neutral-400 text-center font-light pt-1">
                                            We will send your refund after item inspection, within 5–7 business days.
                                        </p>
                                    </div>

                                    <button
                                        onClick={nextStep}
                                        className="w-full py-4 rounded-full bg-[#101820] text-white font-medium text-sm hover:bg-black transition-all cursor-pointer shadow-sm"
                                    >
                                        Review Request
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
                                    We&apos;ve received your return request. A prepaid return shipping label and drop-off instructions have been sent to your email.
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
                                            {selectedItem.title} ({selectedItem.size})
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutral-500">Request Type:</span>
                                        <span className="font-semibold text-black capitalize">
                                            {requestType}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutral-500">Refund Method:</span>
                                        <span className="font-semibold text-black">
                                            {paymentMode === "original" ? "Original Payment Method" : "BacStory Wallet"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutral-500">Est. Refund:</span>
                                        <span className="font-bold text-black">
                                            Rs {totalRefund.toLocaleString()}
                                        </span>
                                    </div>
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
