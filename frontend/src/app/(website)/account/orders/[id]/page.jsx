"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Package,
    RotateCcw,
    HelpCircle,
    X,
    Loader2,
    CheckCircle2,
    Clock,
    Truck,
    MapPin,
    CreditCard,
    Tag,
    Copy,
    Check,
    ExternalLink,
    AlertCircle,
    ShieldCheck,
    Phone,
    Mail,
    Info,
    Calendar
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { getImageUrl, API_BASE_URL } from "@/lib/api";
import TrackOrderModal from "@/components/ui/TrackOrderModal";

const ORDER_STEPS = [
    {
        title: "Order Confirmed",
        desc: "Order has been placed and confirmed"
    },
    {
        title: "Ready to Pack & Ship",
        desc: "Items are being prepared and packed"
    },
    {
        title: "Dispatched & In Transit",
        desc: "Package has been dispatched and is in transit"
    },
    {
        title: "Out for Delivery",
        desc: "Package is out for delivery to your address"
    },
    {
        title: "Delivered",
        desc: "Package has been delivered successfully"
    }
];

const getStepIndex = (statusStr) => {
    const s = (statusStr || "").toLowerCase();
    if (s.includes("delivered")) return 4;
    if (s.includes("out")) return 3;
    if (s.includes("transit") || s.includes("dispatched")) return 2;
    if (s.includes("pack") || s.includes("ready")) return 1;
    return 0; // Default: Order Confirmed
};

const formatFullDate = (dateVal) => {
    if (!dateVal) return "N/A";
    try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return "N/A";
        return d.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    } catch {
        return "N/A";
    }
};

const getStepTimelineDate = (stepTitle, stepIdx, order, activeStepIdx) => {
    if (!order) return null;
    const timeline = Array.isArray(order.statusTimeline) ? order.statusTimeline : [];

    const titleNorm = (stepTitle || "").toLowerCase().trim();
    const foundEntry = timeline.find((item) => {
        const s = (item.status || "").toLowerCase().trim();
        if (s === titleNorm) return true;
        if (titleNorm.includes("confirmed") && (s.includes("confirmed") || s === "placed")) return true;
        if (titleNorm.includes("pack") && (s.includes("pack") || s.includes("ready"))) return true;
        if (titleNorm.includes("transit") && (s.includes("transit") || s.includes("dispatched"))) return true;
        if (titleNorm.includes("out") && s.includes("out")) return true;
        if (titleNorm.includes("delivered") && s.includes("delivered")) return true;
        return false;
    });

    if (foundEntry && foundEntry.timestamp) {
        return formatFullDate(foundEntry.timestamp);
    }

    if (stepIdx <= activeStepIdx) {
        if (stepIdx === 0 && order.createdAt) {
            return formatFullDate(order.createdAt);
        }
        if (stepIdx === activeStepIdx && order.updatedAt) {
            return formatFullDate(order.updatedAt);
        }
    }

    return null;
};

const getStatusBadgeStyle = (status) => {
    const s = (status || "").toLowerCase();
    if (s.includes("delivered")) {
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
    if (s.includes("cancel")) {
        return "bg-rose-50 text-rose-800 border-rose-200";
    }
    if (s.includes("return") || s.includes("exchange")) {
        return "bg-purple-50 text-purple-800 border-purple-200";
    }
    if (s.includes("pack") || s.includes("ready")) {
        return "bg-amber-50 text-amber-900 border-amber-200";
    }
    if (s.includes("transit") || s.includes("dispatched") || s.includes("out")) {
        return "bg-sky-50 text-sky-900 border-sky-200";
    }
    return "bg-neutral-100 text-neutral-800 border-neutral-200";
};

export default function OrderDetailPage({ params }) {
    const resolvedParams = params && typeof params.then === "function" ? use(params) : (params || {});
    const orderIdParam = decodeURIComponent(resolvedParams?.id || "");

    const router = useRouter();
    const { showToast } = useToast();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    // Modals
    const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [cancelLoading, setCancelLoading] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderIdParam) {
                setError("Order ID is missing.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const token = typeof window !== "undefined" ? localStorage.getItem("userToken") : null;
                const res = await fetch(`${API_BASE_URL}/frontend/orders/${encodeURIComponent(orderIdParam)}`, {
                    headers: {
                        ...(token && { Authorization: `Bearer ${token}` })
                    }
                });

                const data = await res.json();
                if (res.ok && data.success && data.data) {
                    setOrder(data.data);
                } else {
                    // Fallback to tracking endpoint if main details endpoint is unavailable
                    const trackRes = await fetch(`${API_BASE_URL}/frontend/orders/track/${encodeURIComponent(orderIdParam)}`);
                    const trackData = await trackRes.json();
                    if (trackRes.ok && trackData.success && trackData.data) {
                        setOrder(trackData.data);
                    } else {
                        setError(data.message || trackData.message || "Order not found");
                    }
                }
            } catch (err) {
                console.error("Error fetching order details:", err);
                setError("Failed to load order details. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderIdParam]);

    const handleCopyOrderId = () => {
        if (!order?.orderId && !order?.id) return;
        const idToCopy = order.orderId || order.id;
        navigator.clipboard.writeText(idToCopy);
        setCopied(true);
        showToast("Order ID copied to clipboard!", "success");
        setTimeout(() => setCopied(false), 2500);
    };

    const handleCancelOrderSubmit = async (e) => {
        e.preventDefault();
        if (!order) return;

        if (!cancelReason.trim()) {
            showToast("Please enter a reason for cancellation.", "error");
            return;
        }

        setCancelLoading(true);

        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("userToken") : null;
            const targetId = order.orderId || order._id || order.id;
            const res = await fetch(`${API_BASE_URL}/frontend/orders/${encodeURIComponent(targetId)}/cancel`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` })
                },
                body: JSON.stringify({ reason: cancelReason.trim() })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast("Order cancelled successfully. Refund initiated.", "success");
                const updated = data.data || {};
                setOrder(prev => ({
                    ...prev,
                    orderStatus: updated.orderStatus || "Cancelled",
                    paymentStatus: updated.paymentStatus || "Refund Pending",
                    cancellation: updated.cancellation || {
                        isCancelled: true,
                        cancellationReason: cancelReason,
                        refundAmount: prev?.totalAmount || 0
                    },
                    refundDetails: updated.refundDetails || prev?.refundDetails
                }));
                setIsCancelModalOpen(false);
                setCancelReason("");
            } else {
                showToast(data.message || "Failed to cancel order.", "error");
            }
        } catch (err) {
            console.error("Error cancelling order:", err);
            showToast("An error occurred while cancelling order.", "error");
        } finally {
            setCancelLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-neutral-400 space-y-3">
                <Loader2 className="w-7 h-7 animate-spin text-black" />
                <p className="text-xs font-medium text-neutral-500">Loading order details & summary...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-neutral-100 space-y-4">
                <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6 stroke-[1.8]" />
                </div>
                <h3 className="text-lg font-semibold font-clashDisplay text-neutral-900">
                    {error || "Order Not Found"}
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    We could not find the order #{orderIdParam}. Please make sure you have the correct Order ID or check your order history.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                    <Link
                        href="/account/orders"
                        className="bg-black text-white rounded-full px-5 py-2 text-xs font-semibold hover:bg-neutral-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Order History
                    </Link>
                </div>
            </div>
        );
    }

    const currentStatus = order.orderStatus || "Order Confirmed";
    const activeStepIdx = getStepIndex(currentStatus);
    const isCancelled = currentStatus === "Cancelled";
    const isDelivered = currentStatus === "Delivered";
    const isCancellable = currentStatus === "Order Confirmed" || currentStatus === "Placed" || currentStatus === "Processing";

    const items = Array.isArray(order.items) ? order.items : [];
    const addr = order.shippingAddress || {};
    const recipientName = `${addr.firstName || ""} ${addr.lastName || ""}`.trim() || "Customer";
    const fullStreetAddress = addr.streetAddress || "";
    const cityStatePin = [addr.city, addr.state, addr.pinCode].filter(Boolean).join(", ");

    // Calculations
    const subtotal = Number(order.subtotal) || items.reduce((sum, it) => {
        const p = Number(it.priceNum) || Number(String(it.price || "").replace(/[^0-9.]/g, "")) || 0;
        return sum + p * (it.quantity || 1);
    }, 0);
    const rawDiscountAmount = Number(order.discountAmount) || 0;
    const prepaidDiscount = Number(order.prepaidDiscount) || 0;
    const shippingCost = Number(order.shippingCost) || 0;
    const taxAmount = Number(order.taxAmount) || 0;
    const walletDeduction = Number(order.walletDeduction) || 0;
    const totalAmount = Number(order.totalAmount) || Math.max(0, subtotal - rawDiscountAmount - walletDeduction + shippingCost + taxAmount);

    // Differentiate between standalone promo code discount and prepaid offer discount
    const totalDiscountGiven = Math.max(0, subtotal + shippingCost + taxAmount - totalAmount);
    const promoDiscountAmount = prepaidDiscount > 0
        ? Math.max(0, totalDiscountGiven - prepaidDiscount)
        : rawDiscountAmount;

    return (
        <div className="space-y-8">
            {/* Top Navigation & Back Link */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 pb-5">
                <Link
                    href="/account/orders"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer group"
                >
                    <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                    <span>Back to Order History</span>
                </Link>

                <div className="flex items-center gap-2">
                    <Link
                        href="/account/support"
                        className="inline-flex items-center gap-1.5 border border-neutral-200 hover:border-neutral-300 rounded-full px-3.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer bg-white"
                    >
                        <HelpCircle className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Need Help?</span>
                    </Link>
                </div>
            </div>

            {/* Order Header Card */}
            <div className="bg-neutral-50/60 border border-neutral-200/80 rounded-3xl p-6 sm:p-7 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                Order ID:
                            </span>
                            <span className="text-base sm:text-lg font-bold font-mono text-neutral-900">
                                {order.orderId || order.id}
                            </span>
                            <button
                                onClick={handleCopyOrderId}
                                className="p-1 text-neutral-400 hover:text-neutral-900 transition-colors rounded-md hover:bg-neutral-200/60 cursor-pointer inline-flex items-center justify-center shrink-0"
                                title="Copy Order ID"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                        <p className="text-xs text-neutral-500 font-normal">
                            Placed on {formatFullDate(order.createdAt)}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${getStatusBadgeStyle(currentStatus)}`}>
                            {currentStatus}
                        </span>

                        {order.paymentMethod && (
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white text-neutral-700 border border-neutral-200 uppercase tracking-wider">
                                {order.paymentMethod}
                            </span>
                        )}
                    </div>
                </div>

                {isCancelled && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 space-y-1">
                        <div className="font-semibold flex items-center gap-1.5">
                            <X className="w-4 h-4 text-rose-600" />
                            This order was cancelled on {formatFullDate(order.cancellation?.cancelledAt || order.updatedAt)}
                        </div>
                        {order.cancellation?.cancellationReason && (
                            <p className="text-rose-700 pl-5">
                                Reason: {order.cancellation.cancellationReason}
                            </p>
                        )}
                        <p className="text-rose-700 pl-5">
                            Refund status: {order.paymentStatus || "Refund Initiated"} {order.cancellation?.refundAmount ? `(₹${order.cancellation.refundAmount})` : ""}
                        </p>
                    </div>
                )}
            </div>


            {/* Ordered Items List */}
            <div className="border border-neutral-200/80 rounded-3xl p-6 sm:p-7 bg-white space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                    <h3 className="text-sm font-semibold font-clashDisplay text-neutral-900 uppercase tracking-wider">
                        Items in This Order ({items.length})
                    </h3>
                    <span className="text-xs text-neutral-400">
                        Click product title or image to open details
                    </span>
                </div>

                <div className="divide-y divide-neutral-100">
                    {items.map((item, idx) => {
                        const productSlugOrId =
                            item.slug ||
                            (item.product && typeof item.product === "object" ? item.product.slug || item.product._id : null) ||
                            item.product ||
                            item.productId ||
                            (item.name ? item.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-") : "");

                        const productDetailUrl = `/products/${productSlugOrId}`;
                        const itemPrice = item.price || (item.priceNum ? `Rs ${item.priceNum}` : "Rs 0");

                        return (
                            <div
                                key={item._id || item.id || idx}
                                className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                            >
                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                    {/* Product Image Link */}
                                    <Link
                                        href={productDetailUrl}
                                        className="relative w-20 h-20 sm:w-24 sm:h-24 bg-neutral-100 rounded-2xl overflow-hidden shrink-0 group/img block cursor-pointer border border-neutral-200/60"
                                        title={`View ${item.name} product page`}
                                    >
                                        <img
                                            src={getImageUrl(item.image)}
                                            alt={item.name || "Product"}
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = "/images/landing-page/coding-tshirt.png";
                                            }}
                                            className="w-full h-full object-cover object-center group-hover/img:scale-105 transition-transform duration-300"
                                        />
                                    </Link>

                                    {/* Product Meta */}
                                    <div className="space-y-1.5 min-w-0 flex-1">
                                        <Link
                                            href={productDetailUrl}
                                            className="group/title inline-block cursor-pointer"
                                            title={`View ${item.name} product page`}
                                        >
                                            <h4 className="font-semibold text-neutral-900 text-sm sm:text-base group-hover/title:underline transition-colors">
                                                {item.name}
                                            </h4>
                                        </Link>

                                        {item.category && (
                                            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                                                {item.category}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                            {item.size && (
                                                <span className="border border-neutral-200 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-neutral-700 bg-neutral-50">
                                                    Size: {item.size}
                                                </span>
                                            )}
                                            {item.color && (
                                                <span className="border border-neutral-200 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-neutral-700 bg-neutral-50 flex items-center gap-1.5">
                                                    <span
                                                        className="w-2 h-2 rounded-full border border-neutral-300"
                                                        style={{ backgroundColor: item.colorHex || "#333" }}
                                                    />
                                                    {item.color}
                                                </span>
                                            )}
                                            <span className="text-[11px] font-medium text-neutral-500">
                                                Qty: {item.quantity || 1}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Price and Delivery */}
                                <div className="text-left sm:text-right self-start sm:self-center shrink-0 space-y-1">
                                    <p className="font-bold text-neutral-900 text-base sm:text-lg">
                                        {itemPrice}
                                    </p>
                                    <p className="text-xs text-neutral-400 font-medium">
                                        Qty: {item.quantity || 1}
                                    </p>
                                    {!isCancelled && !isDelivered && (
                                        <p className="text-[11px] text-neutral-500 font-normal">
                                            {item.deliveryDate || "Estimated Delivery: 3-5 Business Days"}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Two Column Grid: Shipping Info + Order Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Shipping & Payment Info (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Delivery Address Card */}
                    <div className="border border-neutral-200/80 rounded-3xl p-6 bg-white space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                            <MapPin className="w-4 h-4 text-neutral-700" />
                            <h3 className="text-sm font-semibold font-clashDisplay text-neutral-900 uppercase tracking-wider">
                                Shipping & Delivery Address
                            </h3>
                        </div>

                        <div className="space-y-2 text-xs text-neutral-600">
                            <p className="text-sm font-bold text-neutral-900">
                                {recipientName}
                            </p>
                            {fullStreetAddress && (
                                <p className="leading-relaxed">
                                    {fullStreetAddress}
                                </p>
                            )}
                            {cityStatePin && (
                                <p className="leading-relaxed font-medium text-neutral-800">
                                    {cityStatePin}
                                </p>
                            )}
                            {addr.country && (
                                <p className="text-neutral-500">
                                    {addr.country}
                                </p>
                            )}

                            <div className="pt-2 border-t border-neutral-100 space-y-1.5 text-neutral-500">
                                {addr.phoneNumber && (
                                    <p className="flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5 text-neutral-400" />
                                        <span>{addr.phoneNumber}</span>
                                    </p>
                                )}
                                {addr.email && (
                                    <p className="flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5 text-neutral-400" />
                                        <span>{addr.email}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Payment Details Card */}
                    <div className="border border-neutral-200/80 rounded-3xl p-6 bg-white space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                            <CreditCard className="w-4 h-4 text-neutral-700" />
                            <h3 className="text-sm font-semibold font-clashDisplay text-neutral-900 uppercase tracking-wider">
                                Payment Details
                            </h3>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-neutral-500">Payment Method:</span>
                                <span className="font-semibold text-neutral-900">
                                    {order.paymentMethod || "Razorpay / Prepaid"}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-neutral-500">Payment Status:</span>
                                <span className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] border ${
                                    order.paymentStatus === "Paid" || order.paymentStatus === "Confirmed"
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                        : order.paymentStatus === "COD"
                                        ? "bg-neutral-100 text-neutral-800 border-neutral-200"
                                        : "bg-amber-50 text-amber-800 border-amber-200"
                                }`}>
                                    {order.paymentStatus || "Confirmed"}
                                </span>
                            </div>

                            {walletDeduction > 0 && (
                                <div className="flex items-center justify-between text-emerald-700 bg-emerald-50/60 p-2.5 rounded-xl">
                                    <span>Wallet Applied:</span>
                                    <span className="font-bold">-₹{walletDeduction}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Order Summary & Price Breakdown (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="border border-neutral-200/80 rounded-3xl p-6 bg-white space-y-5">
                        <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                            <Tag className="w-4 h-4 text-neutral-700" />
                            <h3 className="text-sm font-semibold font-clashDisplay text-neutral-900 uppercase tracking-wider">
                                Order Summary
                            </h3>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="flex items-center justify-between text-neutral-600">
                                <span>Items Subtotal</span>
                                <span className="font-semibold text-neutral-900">₹{subtotal.toLocaleString("en-IN")}</span>
                            </div>

                            {promoDiscountAmount > 0 && (
                                <div className="flex items-center justify-between text-emerald-700">
                                    <span className="flex items-center gap-1">
                                        <span>Promo Discount</span>
                                        {order.appliedPromoCode && (
                                            <span className="text-[10px] font-mono font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                                                {order.appliedPromoCode}
                                            </span>
                                        )}
                                    </span>
                                    <span className="font-bold">-₹{promoDiscountAmount.toLocaleString("en-IN")}</span>
                                </div>
                            )}

                            {prepaidDiscount > 0 && (
                                <div className="flex items-center justify-between text-emerald-700">
                                    <span>Prepaid Offer Discount</span>
                                    <span className="font-bold">-₹{prepaidDiscount.toLocaleString("en-IN")}</span>
                                </div>
                            )}

                            {walletDeduction > 0 && (
                                <div className="flex items-center justify-between text-emerald-700">
                                    <span>Wallet Balance Used</span>
                                    <span className="font-bold">-₹{walletDeduction.toLocaleString("en-IN")}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between text-neutral-600">
                                <span>Shipping Fee</span>
                                <span className="font-semibold text-neutral-900">
                                    {shippingCost > 0 ? `₹${shippingCost.toLocaleString("en-IN")}` : "FREE"}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-neutral-600">
                                <span>Estimated GST / Taxes</span>
                                <span className="font-semibold text-neutral-900">
                                    {taxAmount > 0 ? `₹${taxAmount.toLocaleString("en-IN")}` : "Included"}
                                </span>
                            </div>

                            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold font-clashDisplay text-neutral-900">
                                        Total Paid
                                    </p>
                                    <p className="text-[10px] text-neutral-400">
                                        Includes all applicable taxes
                                    </p>
                                </div>
                                <span className="text-xl font-bold font-clashDisplay text-neutral-900">
                                    ₹{totalAmount.toLocaleString("en-IN")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Open Actions Bar (Matching Main Order History Card) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-neutral-100">
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={() => setIsTrackModalOpen(true)}
                        className="border border-neutral-300 rounded-full px-4 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 flex items-center gap-1.5 transition-colors cursor-pointer bg-white"
                    >
                        <Package className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Track Order</span>
                    </button>

                    {isCancellable && (
                        <button
                            onClick={() => setIsCancelModalOpen(true)}
                            className="border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded-full px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5 text-red-600" />
                            <span>Cancel Order</span>
                        </button>
                    )}

                    {(() => {
                        const allReturnReqs = (Array.isArray(order.returnRequestsHistory) && order.returnRequestsHistory.length > 0)
                            ? order.returnRequestsHistory
                            : (order.returnExchange?.isRequested ? [order.returnExchange] : []);

                        if (allReturnReqs.length > 0) {
                            const latestReq = allReturnReqs[allReturnReqs.length - 1];
                            const isExchange = latestReq.requestType === "exchange";
                            const status = (latestReq.status || (isExchange ? "Exchange Requested" : "Return Requested")).trim();
                            return (
                                <Link
                                    href="/account/orders"
                                    className="border border-amber-300 bg-amber-50 text-amber-900 rounded-full px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer hover:bg-amber-100/80"
                                    title="View full tracking timeline in Order History"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                                    <span>{status}</span>
                                </Link>
                            );
                        }

                        if (isDelivered) {
                            return (
                                <Link
                                    href={`/return-and-exchange?orderId=${encodeURIComponent(order.orderId || order.id)}`}
                                    className="border border-neutral-300 rounded-full px-4 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 flex items-center gap-1.5 transition-colors cursor-pointer bg-white"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 text-neutral-600" />
                                    <span>Return or Exchange</span>
                                </Link>
                            );
                        }

                        return null;
                    })()}
                </div>

                <Link
                    href="/account/support"
                    className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors cursor-pointer"
                >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Need Help?</span>
                </Link>
            </div>

            {/* Track Order Modal (Shared Reusable Component) */}
            {isTrackModalOpen && (
                <TrackOrderModal
                    order={order}
                    onClose={() => setIsTrackModalOpen(false)}
                />
            )}

            {/* Cancel Order Modal */}
            {isCancelModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
                    onClick={() => !cancelLoading && setIsCancelModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                            <h3 className="text-base font-semibold font-clashDisplay text-neutral-900">
                                Cancel Order #{order.orderId || order.id}
                            </h3>
                            <button
                                onClick={() => !cancelLoading && setIsCancelModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 leading-relaxed">
                            <p className="font-semibold mb-1">Cancellation Policy:</p>
                            <p>
                                You can cancel your order free of charge before it has been packed for dispatch.
                                100% refund will be credited to your original payment method.
                            </p>
                        </div>

                        <form onSubmit={handleCancelOrderSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-neutral-700">
                                    Reason for Cancellation <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Please tell us why you want to cancel (e.g. ordered by mistake, wrong size, changed mind)..."
                                    rows={3}
                                    required
                                    className="w-full text-xs p-3 rounded-2xl border border-neutral-200 focus:outline-none focus:border-black transition-colors resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    disabled={cancelLoading}
                                    onClick={() => setIsCancelModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
                                >
                                    Keep Order
                                </button>
                                <button
                                    type="submit"
                                    disabled={cancelLoading}
                                    className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    {cancelLoading ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Cancelling...</span>
                                        </>
                                    ) : (
                                        <span>Confirm Cancellation</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
