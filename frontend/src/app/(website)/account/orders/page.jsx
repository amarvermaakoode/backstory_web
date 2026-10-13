"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, RotateCcw, HelpCircle, X, Loader2, SlidersHorizontal, Tag, Info, ChevronLeft, ChevronRight, Clock, Video, ExternalLink, CheckCircle2, Check } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { getImageUrl, API_BASE_URL } from "@/lib/api";
import TrackOrderModal from "@/components/ui/TrackOrderModal";

const STATUS_FILTER_OPTIONS = [
    { label: "All", value: "All" },
    { label: "Order Confirmed", value: "Order Confirmed" },
    { label: "Ready to Pack & Ship", value: "Ready to Pack & Ship" },
    { label: "Dispatched & In Transit", value: "Dispatched & In Transit" },
    { label: "Out for Delivery", value: "Out for Delivery" },
    { label: "Delivered", value: "Delivered" },
    { label: "Cancelled", value: "Cancelled" },
    { label: "Returned", value: "Returned" },
];

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

const formatTimelineDate = (dateVal) => {
    if (!dateVal) return null;
    try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return null;
        return d.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    } catch {
        return null;
    }
};

const resolveDeliveryEstimate = (itemDelivery, orderEstimate, shippingMethod) => {
    const normMethod = (shippingMethod || "").toLowerCase();
    let defaultDays = "3–5 business days";
    if (normMethod.includes("express")) {
        defaultDays = "1–2 business days";
    } else if (normMethod.includes("international") || normMethod.includes("intl")) {
        defaultDays = "7–14 business days";
    }

    if (
        itemDelivery &&
        !((normMethod.includes("express") || normMethod.includes("international")) && itemDelivery.includes("3-5"))
    ) {
        return itemDelivery.toLowerCase().includes("estimated") ? itemDelivery : `Estimated Delivery: ${itemDelivery}`;
    }

    if (
        orderEstimate &&
        !((normMethod.includes("express") || normMethod.includes("international")) && orderEstimate.includes("3-5"))
    ) {
        return orderEstimate.toLowerCase().includes("estimated") ? orderEstimate : `Estimated Delivery: ${orderEstimate}`;
    }

    return `Estimated Delivery: ${defaultDays}`;
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
        return formatTimelineDate(foundEntry.timestamp);
    }

    // Fallbacks for completed steps when explicit statusTimeline entry is not yet recorded:
    if (stepIdx <= activeStepIdx) {
        if (stepIdx === 0 && order.createdAt) {
            return formatTimelineDate(order.createdAt);
        }
        if (stepIdx === activeStepIdx && order.updatedAt) {
            return formatTimelineDate(order.updatedAt);
        }
    }

    return null;
};

const getReturnProcessBadge = (req, order, onTrackClick) => {
    if (!req) return null;
    const isExchange = req.requestType === "exchange";
    const isOrderAlreadyRefunded = order?.paymentStatus === "Refunded" || order?.refundDetails?.refundStatus === "Refunded" || order?.refundDetails?.refundStatus === "Processed / Credited" || order?.returnExchange?.status === "Refunded" || order?.orderStatus === "Returned";
    const status = ((req.status === "Product Received" && isOrderAlreadyRefunded) ? "Refunded" : (req.status || (isExchange ? "Exchange Requested" : "Return Requested"))).trim();

    let label = status;
    let badgeClass = "border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100/80";
    let icon = <RotateCcw className="w-3.5 h-3.5 text-purple-700" />;

    switch (status) {
        case "Return Requested":
            label = "Return Requested";
            badgeClass = "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100/80";
            icon = <RotateCcw className="w-3.5 h-3.5 text-amber-700" />;
            break;
        case "Return Approved":
            label = "Return Approved";
            badgeClass = "border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100/80";
            icon = <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />;
            break;
        case "Product Received":
        case "Product Picked Up":
            label = isExchange ? "Product Picked Up" : "Product Received";
            badgeClass = "border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100/80";
            icon = <Package className="w-3.5 h-3.5 text-indigo-700" />;
            break;
        case "Refund Initiated":
            label = "Refund Initiated";
            badgeClass = "border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100/80";
            icon = <Clock className="w-3.5 h-3.5 text-purple-700" />;
            break;
        case "Refunded":
        case "Completed":
        case "Returned":
            label = "Refunded";
            badgeClass = "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100/80";
            icon = <Check className="w-3.5 h-3.5 text-emerald-700" />;
            break;
        case "Exchange Requested":
            label = "Exchange Requested";
            badgeClass = "border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100/80";
            icon = <RotateCcw className="w-3.5 h-3.5 text-purple-700" />;
            break;
        case "Exchange Approved":
            label = "Exchange Approved";
            badgeClass = "border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100/80";
            icon = <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />;
            break;
        case "Replacement Ready to Pack & Ship":
            label = "Replacement Packing";
            badgeClass = "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100/80";
            icon = <Package className="w-3.5 h-3.5 text-amber-700" />;
            break;
        case "Replacement Dispatched":
            label = "Replacement In Transit";
            badgeClass = "border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100/80";
            icon = <Package className="w-3.5 h-3.5 text-indigo-700" />;
            break;
        case "Exchange Completed":
            label = "Exchange Completed";
            badgeClass = "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100/80";
            icon = <Check className="w-3.5 h-3.5 text-emerald-700" />;
            break;
        case "Rejected":
            label = isExchange ? "Exchange Rejected" : "Return Rejected";
            badgeClass = "border-red-200 bg-red-50 text-red-900 hover:bg-red-100/80";
            icon = <X className="w-3.5 h-3.5 text-red-700" />;
            break;
        default:
            label = status;
            badgeClass = "border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100/80";
            icon = <RotateCcw className="w-3.5 h-3.5 text-purple-700" />;
    }

    return (
        <button
            key={req._id || req.requestId || label}
            onClick={(e) => {
                e.stopPropagation();
                if (onTrackClick) onTrackClick(order);
            }}
            className={`border rounded-full px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${badgeClass}`}
            title="Click to track detailed return & refund progress"
        >
            {icon}
            <span>{label}</span>
        </button>
    );
};

const getOrderStatusBadge = (order) => {
    const isCancelled = order?.cancellation?.isCancelled || (order?.orderStatus || "").toLowerCase() === "cancelled";
    if (isCancelled) {
        return {
            label: "Cancelled",
            className: "border-rose-200 bg-rose-50 text-rose-700",
            icon: <X className="w-3 h-3 text-rose-600 stroke-[2.5]" />
        };
    }

    const allReturnReqs = (Array.isArray(order?.returnRequestsHistory) && order?.returnRequestsHistory.length > 0)
        ? order.returnRequestsHistory
        : (order?.returnExchange?.isRequested ? [order.returnExchange] : []);
    const isReturned = (order?.orderStatus || "").toLowerCase() === "returned" ||
        order?.returnExchange?.status === "Returned" ||
        order?.returnExchange?.status === "Refunded" ||
        (allReturnReqs.length > 0 && allReturnReqs.some(r => r.status === "Refunded" || r.status === "Product Received" || r.status === "Returned"));

    if (isReturned) {
        return {
            label: "Returned",
            className: "border-purple-200 bg-purple-50 text-purple-700",
            icon: <RotateCcw className="w-3 h-3 text-purple-600 stroke-[2.5]" />
        };
    }

    const hasReturnRequested = allReturnReqs.length > 0 && allReturnReqs.some(r => (r.status || "").toLowerCase().includes("request"));
    if (hasReturnRequested) {
        const isExchange = allReturnReqs.some(r => r.requestType === "exchange");
        return {
            label: isExchange ? "Exchange Requested" : "Return Requested",
            className: "border-amber-200 bg-amber-50 text-amber-900",
            icon: <RotateCcw className="w-3 h-3 text-amber-600 stroke-[2.5]" />
        };
    }

    const s = (order?.orderStatus || "").toLowerCase().trim();
    if (s.includes("delivered")) {
        return {
            label: "Delivered",
            className: "border-emerald-200 bg-emerald-50 text-emerald-700",
            icon: <CheckCircle2 className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
        };
    }
    if (s.includes("out")) {
        return {
            label: "Out for Delivery",
            className: "border-sky-200 bg-sky-50 text-sky-800",
            icon: <Package className="w-3 h-3 text-sky-600 stroke-[2.5]" />
        };
    }
    if (s.includes("transit") || s.includes("dispatched")) {
        return {
            label: "In Transit",
            className: "border-sky-200 bg-sky-50 text-sky-800",
            icon: <Package className="w-3 h-3 text-sky-600 stroke-[2.5]" />
        };
    }
    if (s.includes("pack") || s.includes("ready")) {
        return {
            label: "Preparing",
            className: "border-amber-200 bg-amber-50 text-amber-900",
            icon: <Clock className="w-3 h-3 text-amber-600 stroke-[2.5]" />
        };
    }
    return {
        label: "Order Confirmed",
        className: "border-neutral-200 bg-neutral-100 text-neutral-800",
        icon: <Check className="w-3 h-3 text-neutral-600 stroke-[2.5]" />
    };
};

export default function AccountOrdersPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [selectedTrackOrder, setSelectedTrackOrder] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [selectedStatusFilter, setSelectedStatusFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    // Reset pagination to page 1 whenever filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedStatusFilter]);

    const [cancellingOrder, setCancellingOrder] = useState(null);
    const [cancelReason, setCancelReason] = useState("");
    const [cancelLoading, setCancelLoading] = useState(false);
    const [showPolicyTooltip, setShowPolicyTooltip] = useState(false);

    const handleCancelOrderSubmit = async (e) => {
        e.preventDefault();
        if (!cancellingOrder) return;

        if (!cancelReason.trim()) {
            showToast("Please enter a reason for cancellation.", "error");
            return;
        }

        setCancelLoading(true);

        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("userToken") : null;
            const res = await fetch(`${API_BASE_URL}/frontend/orders/${cancellingOrder.id}/cancel`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` })
                },
                body: JSON.stringify({ reason: cancelReason.trim() })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast(data.message || "Order cancelled successfully! 100% refund initiated for prepaid orders (no cancellation fee).", "success");
                setOrders(prev => prev.map(o => {
                    const matches = o.id === cancellingOrder.id || o._id === cancellingOrder.id || o.orderId === cancellingOrder.id || o.id === cancellingOrder._id;
                    if (matches) {
                        const updatedData = data.data || {};
                        return {
                            ...o,
                            orderStatus: updatedData.orderStatus || "Cancelled",
                            paymentStatus: updatedData.paymentStatus || "Refund Pending",
                            cancellation: updatedData.cancellation || {
                                isCancelled: true,
                                cancellationReason: cancelReason || "Cancelled by customer before dispatch",
                                refundAmount: o.totalAmount || 0
                            },
                            refundDetails: updatedData.refundDetails || o.refundDetails
                        };
                    }
                    return o;
                }));
                setCancellingOrder(null);
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

    useEffect(() => {
        const fetchOrders = async () => {
            let dbOrders = [];
            try {
                const token = typeof window !== "undefined" ? localStorage.getItem("userToken") : null;
                const savedAddr = typeof window !== "undefined" ? localStorage.getItem("savedShippingAddress") : null;
                let email = "";
                if (savedAddr) {
                    try {
                        const parsedAddr = JSON.parse(savedAddr);
                        email = parsedAddr.contactEmail || parsedAddr.deliveryEmail || "";
                    } catch (e) { }
                }

                const url = token
                    ? `${API_BASE_URL}/frontend/orders/my-orders`
                    : (email ? `${API_BASE_URL}/frontend/orders/my-orders?email=${encodeURIComponent(email)}` : null);

                if (url) {
                    const res = await fetch(url, {
                        headers: {
                            ...(token && { Authorization: `Bearer ${token}` })
                        }
                    });
                    const data = await res.json();
                    if (res.ok && data.success && Array.isArray(data.data)) {
                        dbOrders = data.data.map(o => ({
                            _id: o._id,
                            id: o.orderId || o._id,
                            orderId: o.orderId || o._id,
                            createdAt: o.createdAt,
                            updatedAt: o.updatedAt,
                            statusTimeline: Array.isArray(o.statusTimeline) ? o.statusTimeline : [],
                            paymentMethod: o.paymentMethod || "Razorpay / Prepaid",
                            walletDeduction: o.walletDeduction || 0,
                            shippingMethod: o.shippingMethod || "Standard Delivery",
                            estimatedDelivery: o.estimatedDelivery || "",
                            orderStatus: (o.cancellation?.isCancelled ? "Cancelled" : (o.orderStatus || "Order Confirmed")),
                            paymentStatus: o.paymentStatus || "Confirmed",
                            totalAmount: o.totalAmount || 0,
                            shippingAddress: o.shippingAddress || {},
                            cancellation: o.cancellation || {},
                            returnExchange: o.returnExchange || {},
                            returnRequestsHistory: o.returnRequestsHistory || [],
                            refundDetails: o.refundDetails || {},
                            items: (o.items || []).map(i => ({
                                id: i._id || i.productId,
                                productId: (i.product && typeof i.product === "object" ? i.product._id : i.product) || i.productId,
                                slug: (i.product && typeof i.product === "object" ? i.product.slug : null) || i.slug,
                                name: i.name,
                                category: i.category,
                                size: i.size,
                                color: i.color,
                                colorHex: i.colorHex,
                                price: i.price,
                                quantity: i.quantity,
                                orderStatus: (o.cancellation?.isCancelled ? "Cancelled" : (o.orderStatus || i.orderStatus || "Order Confirmed")),
                                paymentStatus: i.paymentStatus || o.paymentStatus || "Confirmed",
                                deliveryDate: resolveDeliveryEstimate(i.deliveryDate, o.estimatedDelivery, o.shippingMethod),
                                image: i.image
                            }))
                        }));
                    }
                }
            } catch (err) {
                console.error("Error fetching orders from DB:", err);
            }

            // Clear any legacy local storage order cache
            if (typeof window !== "undefined") {
                localStorage.removeItem("userOrders");
            }

            setOrders(dbOrders);
            setLoading(false);
        };

        fetchOrders();
    }, []);

    // Filter orders based on status filter
    const filteredOrders = orders.filter(order => {
        if (selectedStatusFilter === "All") return true;

        const mainStatus = (order.orderStatus || "").toLowerCase();
        const filterVal = selectedStatusFilter.toLowerCase();
        const isCancelled = order.cancellation?.isCancelled || mainStatus === "cancelled";

        if (filterVal === "cancelled") {
            return isCancelled;
        }

        if (filterVal === "returned") {
            const allReturnReqs = (Array.isArray(order?.returnRequestsHistory) && order?.returnRequestsHistory.length > 0)
                ? order.returnRequestsHistory
                : (order?.returnExchange?.isRequested ? [order.returnExchange] : []);
            return mainStatus === "returned" ||
                order.returnExchange?.status === "Returned" ||
                order.returnExchange?.status === "Refunded" ||
                (allReturnReqs.length > 0 && allReturnReqs.some(r => r.status === "Refunded" || r.status === "Product Received" || r.status === "Returned"));
        }

        if (filterVal === "delivered") {
            return mainStatus === "delivered" || (order.items || []).some(item => (item.orderStatus || "").toLowerCase() === "delivered");
        }

        if (filterVal.includes("confirmed")) {
            return (mainStatus.includes("confirmed") || mainStatus === "placed") && !isCancelled;
        }

        if (mainStatus === filterVal || mainStatus.includes(filterVal)) return true;

        return order.items.some(item => {
            const status = (item.orderStatus || "").toLowerCase();
            return status === filterVal || status.includes(filterVal);
        });
    });

    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const activePage = currentPage > totalPages && totalPages > 0 ? totalPages : (currentPage < 1 ? 1 : currentPage);
    const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
    const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24 text-neutral-400">
                <Loader2 className="w-6 h-6 animate-spin text-black" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header and Filter trigger */}
            <div className="flex items-center justify-between gap-4 border-b border-neutral-100 pb-4">
                <h2 className="text-xl sm:text-2xl font-semibold font-clashDisplay text-neutral-900 tracking-tight">
                    Order History
                </h2>
                <button
                    onClick={() => setIsFilterModalOpen(true)}
                    className="flex items-center gap-2 border border-neutral-300 rounded-full px-4 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer bg-white shadow-2xs"
                >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Filter</span>
                    {selectedStatusFilter !== "All" && (
                        <span className="bg-black text-white text-[10px] font-semibold px-1.5 py-0.2 rounded-full">
                            {selectedStatusFilter}
                        </span>
                    )}
                </button>
            </div>


            {/* Selected Filter Bar */}
            {selectedStatusFilter !== "All" && (
                <div className="flex items-center justify-between bg-neutral-100/70 px-4 py-2.5 rounded-xl text-xs">
                    <span className="text-neutral-600">
                        Showing status: <strong className="text-neutral-900 font-semibold">{selectedStatusFilter}</strong>
                    </span>
                    <button
                        onClick={() => setSelectedStatusFilter("All")}
                        className="text-red-500 font-semibold hover:underline cursor-pointer"
                    >
                        Clear Filter
                    </button>
                </div>
            )}

            {orders.length === 0 ? (
                <div className="text-center max-w-md mx-auto my-8 py-8">
                    <div className="w-16 h-16 bg-[#F4F0EA] rounded-full flex items-center justify-center text-neutral-400 mx-auto mb-4 select-none">
                        <Package className="w-7 h-7 stroke-[1.25]" />
                    </div>
                    <h3 className="text-xl font-semibold font-clashDisplay text-neutral-900 mb-2">No Orders Yet</h3>
                    <p className="text-xs sm:text-sm text-neutral-500 max-w-xs mx-auto mb-6 leading-relaxed">
                        You haven&apos;t placed any orders yet. When you place an order, it will appear here.
                    </p>
                    <Link
                        href="/product-list"
                        className="bg-black text-white rounded-full px-6 py-2.5 text-xs font-semibold hover:bg-neutral-800 transition-colors inline-block cursor-pointer"
                    >
                        Explore Collection
                    </Link>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-neutral-100 p-6">
                    <p className="text-sm font-semibold text-neutral-800 mb-1">No orders found</p>
                    <p className="text-xs text-neutral-400 mb-4">No orders matching status &quot;{selectedStatusFilter}&quot;.</p>
                    <button
                        onClick={() => setSelectedStatusFilter("All")}
                        className="text-xs font-semibold text-neutral-900 underline cursor-pointer"
                    >
                        Reset Filter
                    </button>
                </div>
            ) : (
                <div className="space-y-10">
                    <div className="space-y-10">
                        {paginatedOrders.map((order) => {
                            const isOrderCancelled = order.cancellation?.isCancelled || (order.orderStatus || "").toLowerCase() === "cancelled";
                            const currentOrderStatus = isOrderCancelled ? "Cancelled" : (order.orderStatus || "Order Confirmed");
                            return (
                                <div
                                    key={order.id}
                                    onClick={() => router.push(`/account/orders/${encodeURIComponent(order.id)}`)}
                                    className="border border-neutral-200/80 hover:border-neutral-300 rounded-3xl p-5 sm:p-6 transition-all duration-200 hover:shadow-xs cursor-pointer bg-white group/card space-y-5"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <p className="text-xs font-normal text-neutral-400">
                                                Order ID: <span className="text-neutral-900 font-bold font-mono">{order.id}</span>
                                            </p>
                                            {/* {(() => {
                                                const badge = getOrderStatusBadge(order);
                                                return (
                                                    <span className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider inline-flex items-center gap-1 shadow-2xs ${badge.className}`}>
                                                        {badge.icon}
                                                        <span>{badge.label}</span>
                                                    </span>
                                                );
                                            })()} */}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {order.paymentMethod && (
                                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200 uppercase tracking-wider">
                                                    {order.paymentMethod}
                                                </span>
                                            )}
                                            <span className="text-[11px] font-semibold text-neutral-400 group-hover/card:text-neutral-900 transition-colors flex items-center gap-0.5">
                                                <span>View Summary</span>
                                                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/card:translate-x-0.5" />
                                            </span>
                                        </div>
                                    </div>

                                    {/* Items inside this order */}
                                    <div className="space-y-6">
                                        {order.items.map((item) => {
                                            const productSlugOrId =
                                                item.slug ||
                                                (item.product && typeof item.product === "object" ? item.product.slug || item.product._id : null) ||
                                                item.productId ||
                                                (item.name ? item.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-") : "");

                                            const productUrl = item.link || `/products/${productSlugOrId}`;
                                            const itemStatus = order.orderStatus || item.orderStatus || "Order Confirmed";

                                            return (
                                                <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                    <div className="flex items-start gap-4">
                                                        <Link
                                                            href={productUrl}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="relative w-20 h-20 sm:w-24 sm:h-24 bg-neutral-100 rounded-2xl overflow-hidden shrink-0 group/img block cursor-pointer border border-neutral-200/60"
                                                            title={`View ${item.name} product details`}
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
                                                        <div className="space-y-1">
                                                            <Link
                                                                href={productUrl}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="group/title block cursor-pointer"
                                                                title={`View ${item.name} product details`}
                                                            >
                                                                <h4 className="font-semibold text-neutral-900 text-sm sm:text-base group-hover/title:underline transition-colors">
                                                                    {item.name}
                                                                </h4>
                                                            </Link>
                                                            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{item.category}</p>
                                                            <div className="flex items-center gap-2 pt-1">
                                                                <span className="border border-neutral-200/80 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-neutral-700 bg-white">
                                                                    {item.size}
                                                                </span>
                                                                <span className="border border-neutral-200/80 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-neutral-700 bg-white flex items-center gap-1.5">
                                                                    <span className="w-2 h-2 rounded-full border border-neutral-300" style={{ backgroundColor: item.colorHex || '#ddd' }} />
                                                                    {item.color}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-right self-end sm:self-start shrink-0 space-y-1">
                                                        <p className="font-semibold text-neutral-900 text-base sm:text-lg">{item.price}</p>
                                                        <p className="text-xs text-neutral-400 font-medium">Qty: {item.quantity}</p>
                                                        {currentOrderStatus !== "Delivered" && itemStatus !== "Delivered" && currentOrderStatus !== "Cancelled" && currentOrderStatus !== "Returned" && (
                                                            <p className="text-xs text-neutral-400 font-normal pt-4">{item.deliveryDate}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>



                                    {/* Footer Action Buttons */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100">
                                        <div className="flex items-center gap-2.5">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedTrackOrder(order);
                                                }}
                                                className="border border-neutral-300 rounded-full px-4 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                                            >
                                                <Package className="w-3.5 h-3.5 text-neutral-600" />
                                                Track Order
                                            </button>

                                            {(() => {
                                                // If order is cancelled: show Cancelled badge just like Cancel Order was shown
                                                if (isOrderCancelled) {
                                                    return (
                                                        <span className="border border-red-200 text-red-700 bg-red-50 rounded-full px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 select-none shadow-2xs">
                                                            <X className="w-3.5 h-3.5 text-red-600 stroke-[2.5]" />
                                                            <span>Cancelled</span>
                                                        </span>
                                                    );
                                                }

                                                const allReturnReqs = (Array.isArray(order.returnRequestsHistory) && order.returnRequestsHistory.length > 0)
                                                    ? order.returnRequestsHistory
                                                    : (order.returnExchange?.isRequested ? [order.returnExchange] : []);

                                                const totalOrderedQty = (order.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);

                                                let totalReturnedQty = 0;
                                                allReturnReqs.forEach(req => {
                                                    if (req.status !== "Rejected") {
                                                        if (req.requestedItems && Array.isArray(req.requestedItems) && req.requestedItems.length > 0) {
                                                            req.requestedItems.forEach(ri => {
                                                                totalReturnedQty += (ri.returnQuantity || 1);
                                                            });
                                                        } else {
                                                            totalReturnedQty += (order.items?.length || 1);
                                                        }
                                                    }
                                                });

                                                const remainingReturnableQty = Math.max(0, totalOrderedQty - totalReturnedQty);
                                                // Calculate delivery date & elapsed days:
                                                const deliveredEntry = (order.statusTimeline || []).find(e => (e.status || "").toLowerCase().includes("delivered"));
                                                const deliveryTimestamp = deliveredEntry?.timestamp || order.updatedAt || order.createdAt;
                                                const daysSinceDelivery = Math.floor((Date.now() - new Date(deliveryTimestamp).getTime()) / (1000 * 60 * 60 * 24));
                                                const isDelivered = (currentOrderStatus || "").toLowerCase().trim() === "delivered" ||
                                                    (order.orderStatus || "").toLowerCase().trim() === "delivered" ||
                                                    (Array.isArray(order.items) && order.items.some(i => (i.orderStatus || "").toLowerCase().trim() === "delivered"));
                                                const isReturnWindowExpired = isDelivered && daysSinceDelivery > 7;

                                                // 1. If all items were already requested/returned
                                                if (allReturnReqs.length > 0 && remainingReturnableQty === 0) {
                                                    const latestReq = allReturnReqs[allReturnReqs.length - 1];
                                                    return getReturnProcessBadge(latestReq, order, setSelectedTrackOrder);
                                                }

                                                // Direct Returned status without return request
                                                if (currentOrderStatus === "Returned") {
                                                    return (
                                                        <span className="border border-purple-200 text-purple-700 bg-purple-50 rounded-full px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 select-none shadow-2xs">
                                                            <RotateCcw className="w-3.5 h-3.5 text-purple-600 stroke-[2.5]" />
                                                            <span>Returned</span>
                                                        </span>
                                                    );
                                                }

                                                // 2. If order has active return requests but also some returnable items remaining (partial return)
                                                if (allReturnReqs.length > 0 && remainingReturnableQty > 0) {
                                                    const latestReq = allReturnReqs[allReturnReqs.length - 1];
                                                    return (
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {getReturnProcessBadge(latestReq, order, setSelectedTrackOrder)}
                                                            {isDelivered && !isReturnWindowExpired && (
                                                                <Link
                                                                    href={`/return-and-exchange?orderId=${encodeURIComponent(order.id)}`}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="border border-neutral-300 rounded-full px-4 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                                                                >
                                                                    <RotateCcw className="w-3.5 h-3.5 text-neutral-600" />
                                                                    <span>Return Remaining Items ({remainingReturnableQty})</span>
                                                                </Link>
                                                            )}
                                                        </div>
                                                    );
                                                }

                                                // 3. If order is delivered and 7-day window has expired, show Return Window Closed badge
                                                if (isDelivered && isReturnWindowExpired) {
                                                    return (
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="border border-emerald-200 bg-emerald-50 text-emerald-800 rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 select-none shadow-2xs">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                                                                <span>Delivered</span>
                                                            </span>
                                                            <span
                                                                className="border border-neutral-200 bg-neutral-50 text-neutral-400 rounded-full px-3.5 py-1 text-xs font-medium cursor-default select-none flex items-center gap-1.5"
                                                                title={`The 7-day return and exchange policy window has expired for this order (${daysSinceDelivery} days since delivery)`}
                                                            >
                                                                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                                                                <span>Return Window Closed</span>
                                                            </span>
                                                        </div>
                                                    );
                                                }

                                                // 4. If delivered, within 7-day window, and has returnable items
                                                if (isDelivered && remainingReturnableQty > 0 && !isReturnWindowExpired) {
                                                    return (
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="border border-emerald-200 bg-emerald-50 text-emerald-800 rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 select-none shadow-2xs">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                                                                <span>Delivered</span>
                                                            </span>
                                                            <Link
                                                                href={`/return-and-exchange?orderId=${encodeURIComponent(order.id)}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="border border-neutral-300 rounded-full px-4 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                                                            >
                                                                <RotateCcw className="w-3.5 h-3.5 text-neutral-600" />
                                                                <span>Return or Exchange</span>
                                                            </Link>
                                                        </div>
                                                    );
                                                }

                                                // 5. Cancellation Action according to Bacstory policy
                                                if (currentOrderStatus === "Order Confirmed" || currentOrderStatus === "Processing" || currentOrderStatus === "Placed") {
                                                    return (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setCancellingOrder(order);
                                                            }}
                                                            className="border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded-full px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                                        >
                                                            <X className="w-3.5 h-3.5 text-red-600" />
                                                            Cancel Order
                                                        </button>
                                                    );
                                                }

                                                const stepIdx = getStepIndex(currentOrderStatus);
                                                const isNonCancellableInTransit = stepIdx >= 1 && stepIdx <= 3;
                                                if (isNonCancellableInTransit) {
                                                    return (
                                                        <span
                                                            className="text-[11px] text-neutral-400 font-light border border-neutral-200 rounded-full px-3 py-1 bg-neutral-50 cursor-default select-none"
                                                            title="Orders cannot be cancelled once packed or shipped for dispatch"
                                                        >
                                                            Packed & Non-Cancellable
                                                        </span>
                                                    );
                                                }

                                                return null;
                                            })()}
                                        </div>
                                        <Link
                                            href="/account/support"
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors cursor-pointer"
                                        >
                                            <HelpCircle className="w-3.5 h-3.5" />
                                            Need Help?
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination Controls (8 items per page) */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-neutral-100">
                            <p className="text-xs text-neutral-500 order-2 sm:order-1">
                                Showing <span className="font-semibold text-neutral-800">{startIndex + 1}</span>–<span className="font-semibold text-neutral-800">{Math.min(startIndex + ITEMS_PER_PAGE, filteredOrders.length)}</span> of <span className="font-semibold text-neutral-800">{filteredOrders.length}</span> orders
                            </p>

                            <div className="flex items-center gap-1.5 order-1 sm:order-2">
                                {/* Previous Page Button */}
                                <button
                                    disabled={activePage === 1}
                                    onClick={() => handlePageChange(activePage - 1)}
                                    className={`p-2 rounded-full border border-neutral-200 hover:border-black transition-colors cursor-pointer flex items-center justify-center ${activePage === 1 ? "opacity-30 cursor-not-allowed border-neutral-100" : ""
                                        }`}
                                    aria-label="Previous Page"
                                >
                                    <ChevronLeft className="h-4 w-4 stroke-[1.75]" />
                                </button>

                                {/* Page Numbers with ellipsis support */}
                                {(() => {
                                    const pages = [];
                                    if (totalPages <= 7) {
                                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                                    } else {
                                        if (activePage <= 4) {
                                            pages.push(1, 2, 3, 4, 5, "...", totalPages);
                                        } else if (activePage >= totalPages - 3) {
                                            pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                                        } else {
                                            pages.push(1, "...", activePage - 1, activePage, activePage + 1, "...", totalPages);
                                        }
                                    }
                                    return pages.map((page, idx) =>
                                        page === "..." ? (
                                            <span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-neutral-400 select-none">
                                                ...
                                            </span>
                                        ) : (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${activePage === page
                                                    ? "bg-black text-white shadow-xs"
                                                    : "text-neutral-500 hover:text-black hover:bg-neutral-100"
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    );
                                })()}

                                {/* Next Page Button */}
                                <button
                                    disabled={activePage === totalPages}
                                    onClick={() => handlePageChange(activePage + 1)}
                                    className={`p-2 rounded-full border border-neutral-200 hover:border-black transition-colors cursor-pointer flex items-center justify-center ${activePage === totalPages ? "opacity-30 cursor-not-allowed border-neutral-100" : ""
                                        }`}
                                    aria-label="Next Page"
                                >
                                    <ChevronRight className="h-4 w-4 stroke-[1.75]" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Status Filter Modal */}
            {isFilterModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-fade-in border border-neutral-100">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                            <h3 className="text-base sm:text-lg font-semibold font-clashDisplay text-neutral-900">
                                Filters
                            </h3>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSelectedStatusFilter("All")}
                                    className="text-xs font-semibold text-red-500 hover:underline cursor-pointer"
                                >
                                    Clear All
                                </button>
                                <button
                                    onClick={() => setIsFilterModalOpen(false)}
                                    className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="grid grid-cols-12 min-h-[300px]">
                            {/* Left Navigation Sidebar */}
                            <div className="col-span-4 bg-neutral-50/70 border-r border-neutral-100 p-2 space-y-1">
                                <button
                                    className="w-full flex items-center gap-2.5 px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-50/70 text-indigo-900 border-l-3 border-indigo-600 transition-all text-left"
                                >
                                    <Tag className="w-4 h-4 text-indigo-600" />
                                    <span>Status</span>
                                </button>
                            </div>

                            {/* Right Status Options List */}
                            <div className="col-span-8 p-6 space-y-5">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-400 tracking-wider uppercase">
                                        ORDER STATUS
                                    </span>
                                    <div className="flex-1 border-t border-neutral-100"></div>
                                </div>

                                <div className="space-y-3.5">
                                    {STATUS_FILTER_OPTIONS.map((option) => {
                                        const isSelected = selectedStatusFilter === option.value;
                                        return (
                                            <label
                                                key={option.value}
                                                onClick={() => setSelectedStatusFilter(option.value)}
                                                className="flex items-center gap-3.5 cursor-pointer select-none group py-0.5"
                                            >
                                                <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? "border-black bg-white" : "border-neutral-300 group-hover:border-neutral-400"
                                                    }`}>
                                                    {isSelected && (
                                                        <div className="w-2.5 h-2.5 rounded-full bg-black" />
                                                    )}
                                                </div>
                                                <span className={`text-xs sm:text-sm transition-colors ${isSelected ? "font-semibold text-neutral-900" : "font-normal text-neutral-700 group-hover:text-neutral-900"
                                                    }`}>
                                                    {option.label}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 flex justify-end">
                            <button
                                onClick={() => setIsFilterModalOpen(false)}
                                className="bg-neutral-900 text-white rounded-xl px-6 py-2 text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                            >
                                Apply Filter
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Track Order Modal (Shared Reusable Component) */}
            {selectedTrackOrder && (
                <TrackOrderModal
                    order={selectedTrackOrder}
                    onClose={() => setSelectedTrackOrder(null)}
                />
            )}

            {/* Cancel Order Modal */}
            {cancellingOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5 animate-fade-in border border-neutral-100">
                        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold font-clashDisplay text-neutral-900">Cancel Order</h3>
                                    {/* Info button for Cancellation Policy */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowPolicyTooltip(prev => !prev)}
                                            onMouseEnter={() => setShowPolicyTooltip(true)}
                                            onMouseLeave={() => setShowPolicyTooltip(false)}
                                            className="w-5 h-5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 flex items-center justify-center transition-colors cursor-pointer"
                                        >
                                            <Info className="w-3.5 h-3.5" />
                                        </button>

                                        {showPolicyTooltip && (
                                            <div className="absolute left-0 top-7 w-72 sm:w-80 bg-white border border-amber-100 rounded-2xl p-4 shadow-sm z-30 space-y-1.5 text-xs text-neutral-800 animate-fade-in">
                                                <p className="font-bold text-sm text-neutral-900 pb-1 border-b border-neutral-100 flex items-center gap-1.5">
                                                    <Info className="w-4 h-4 text-amber-600" />
                                                    <span>Bacstory Cancellation Policy</span>
                                                </p>
                                                <p className="leading-relaxed pt-1">
                                                    • <strong>100% Refund:</strong> Prepaid orders cancelled before packing receive a full 100% refund.
                                                </p>
                                                <p className="leading-relaxed">
                                                    • <strong>Zero Fee:</strong> No cancellation fee is charged.
                                                </p>
                                                <p className="leading-relaxed">
                                                    • <strong>Packing Cutoff:</strong> Once packed for dispatch, orders cannot be cancelled.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-neutral-400 mt-0.5">
                                    Order ID: <span className="font-mono font-semibold text-neutral-800">{cancellingOrder.id}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setCancellingOrder(null);
                                    setShowPolicyTooltip(false);
                                }}
                                className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCancelOrderSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                    Reason for Cancellation <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    placeholder="Please tell us why you are cancelling..."
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs text-black focus:outline-none focus:border-black resize-none"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setCancellingOrder(null)}
                                    className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                                >
                                    Keep Order
                                </button>
                                <button
                                    type="submit"
                                    disabled={cancelLoading}
                                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
                                >
                                    {cancelLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    <span>Confirm Cancel</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
