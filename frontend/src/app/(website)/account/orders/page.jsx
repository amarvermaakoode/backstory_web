"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, RotateCcw, HelpCircle, X, Loader2, SlidersHorizontal, Tag, Info } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { getImageUrl, API_BASE_URL } from "@/lib/api";

const STATUS_FILTER_OPTIONS = [
    { label: "All", value: "All" },
    { label: "Order Confirmed", value: "Order Confirmed" },
    { label: "Ready to Pack & Ship", value: "Ready to Pack & Ship" },
    { label: "Dispatched & In Transit", value: "Dispatched & In Transit" },
    { label: "Out for Delivery", value: "Out for Delivery" },
    { label: "Delivered", value: "Delivered" },
    { label: "Cancelled", value: "Cancelled" },
];

const ORDER_STEPS = [
    {
        title: "Order Confirmed",
        desc: "Order details processed & payment confirmed via Razorpay"
    },
    {
        title: "Ready to Pack & Ship",
        desc: "Admin is packing your order for courier drop-off"
    },
    {
        title: "Dispatched & In Transit",
        desc: "Package handed over to courier & in transit"
    },
    {
        title: "Out for Delivery",
        desc: "Courier partner is delivering to your address"
    },
    {
        title: "Delivered",
        desc: "Package successfully delivered to your doorstep"
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

export default function AccountOrdersPage() {
    const { showToast } = useToast();
    const [selectedTrackOrder, setSelectedTrackOrder] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [selectedStatusFilter, setSelectedStatusFilter] = useState("All");

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
                            orderStatus: o.orderStatus || "Order Confirmed",
                            paymentStatus: o.paymentStatus || "Confirmed",
                            totalAmount: o.totalAmount || 0,
                            shippingAddress: o.shippingAddress || {},
                            cancellation: o.cancellation || {},
                            returnExchange: o.returnExchange || {},
                            refundDetails: o.refundDetails || {},
                            items: (o.items || []).map(i => ({
                                id: i._id || i.productId,
                                productId: i.product || i.productId,
                                name: i.name,
                                category: i.category,
                                size: i.size,
                                color: i.color,
                                colorHex: i.colorHex,
                                price: i.price,
                                quantity: i.quantity,
                                orderStatus: o.orderStatus || i.orderStatus || "Order Confirmed",
                                paymentStatus: i.paymentStatus || o.paymentStatus || "Confirmed",
                                deliveryDate: i.deliveryDate || "Estimated Delivery: 3-5 Business Days",
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

        if (mainStatus === filterVal || mainStatus.includes(filterVal)) return true;

        return order.items.some(item => {
            const status = (item.orderStatus || "").toLowerCase();
            return status === filterVal || status.includes(filterVal);
        });
    });

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
                    {filteredOrders.map((order) => {
                        const currentOrderStatus = order.orderStatus || "Order Confirmed";
                        return (
                            <div key={order.id} className="border-b border-neutral-100 pb-8 last:border-0 space-y-5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-xs font-normal text-neutral-400">
                                        Order ID: <span className="text-neutral-900 font-bold font-mono">{order.id}</span>
                                    </p>
                                </div>

                                {/* Items inside this order */}
                                <div className="space-y-6">
                                    {order.items.map((item) => {
                                        const productUrl = item.link || `/products/${item.slug || item.productId || item.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")}`;
                                        const itemStatus = order.orderStatus || item.orderStatus || "Order Confirmed";

                                        return (
                                            <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <Link href={productUrl} className="relative w-20 h-20 sm:w-24 sm:h-24 bg-neutral-100 rounded-2xl overflow-hidden shrink-0 group block cursor-pointer">
                                                        <img
                                                            src={getImageUrl(item.image)}
                                                            alt={item.name || "Product"}
                                                            onError={(e) => {
                                                                e.currentTarget.onerror = null;
                                                                e.currentTarget.src = "/images/landing-page/coding-tshirt.png";
                                                            }}
                                                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    </Link>
                                                    <div className="space-y-1">
                                                        <Link href={productUrl} className="group block cursor-pointer">
                                                            <h4 className="font-semibold text-neutral-900 text-sm sm:text-base group-hover:underline transition-colors">
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
                                <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                                    <div className="flex items-center gap-2.5">
                                        <button
                                            onClick={() => setSelectedTrackOrder(order)}
                                            className="border border-neutral-300 rounded-full px-4 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                                        >
                                            <Package className="w-3.5 h-3.5 text-neutral-600" />
                                            Track Order
                                        </button>

                                        {order.returnExchange?.isRequested ? (
                                            order.returnExchange.status === "Approved" ? (
                                                <Link
                                                    href={`/return-and-exchange?orderId=${encodeURIComponent(order.id)}`}
                                                    className="border rounded-full px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5 text-current" />
                                                    <span>Return Request Approved</span>
                                                </Link>
                                            ) : order.returnExchange.status === "Rejected" ? (
                                                <Link
                                                    href={`/return-and-exchange?orderId=${encodeURIComponent(order.id)}`}
                                                    className="border rounded-full px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer bg-red-50 text-red-800 border-red-300 hover:bg-red-100"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5 text-current" />
                                                    <span>Return Request Rejected</span>
                                                </Link>
                                            ) : null
                                        ) : currentOrderStatus === "Delivered" ? (
                                            <Link
                                                href={`/return-and-exchange?orderId=${encodeURIComponent(order.id)}`}
                                                className="border border-neutral-300 rounded-full px-4 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5 text-neutral-600" />
                                                Return or Exchange
                                            </Link>
                                        ) : null}

                                        {/* Cancellation Action according to Bacstory policy */}
                                        {(currentOrderStatus === "Order Confirmed" || currentOrderStatus === "Processing") ? (
                                            <button
                                                onClick={() => setCancellingOrder(order)}
                                                className="border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded-full px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                            >
                                                <X className="w-3.5 h-3.5 text-red-600" />
                                                Cancel Order
                                            </button>
                                        ) : (() => {
                                            const stepIdx = getStepIndex(currentOrderStatus);
                                            const isNonCancellableInTransit = stepIdx >= 1 && stepIdx <= 3 && currentOrderStatus !== "Cancelled" && currentOrderStatus !== "Returned";
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

            {/* Track Order Dynamic 5-Step Timeline Modal */}
            {selectedTrackOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6 animate-fade-in border border-neutral-100">
                        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                            <div>
                                <h3 className="text-lg font-semibold font-clashDisplay text-neutral-900">Track Order</h3>
                                <p className="text-xs text-neutral-400 mt-0.5">
                                    Order ID: <span className="font-mono font-semibold text-neutral-800">{selectedTrackOrder.id}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedTrackOrder(null)}
                                className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Order, Return & Payment Status Overview Box */}
                        {(() => {
                            const rawOrderStatus = selectedTrackOrder.orderStatus || (selectedTrackOrder.items && selectedTrackOrder.items[0]?.orderStatus) || "Placed";
                            const isCancelledModal = rawOrderStatus === "Cancelled" || selectedTrackOrder.cancellation?.isCancelled;
                            const isReturnRequestedModal = selectedTrackOrder.returnExchange?.isRequested;

                            let modalOrderStatus = rawOrderStatus;
                            let modalReturnStatus = selectedTrackOrder.returnExchange?.status || "None";
                            let modalPayStatus = selectedTrackOrder.paymentStatus || "Paid";

                            if (isCancelledModal) {
                                modalOrderStatus = "Cancelled";
                                if (selectedTrackOrder.paymentStatus === "Refunded" || selectedTrackOrder.refundDetails?.refundStatus === "Refunded") {
                                    modalPayStatus = "Refunded";
                                } else if (selectedTrackOrder.cancellation?.refundAmount > 0) {
                                    modalPayStatus = "Refund Processing";
                                } else {
                                    modalPayStatus = "Cancelled (Unpaid)";
                                }
                            } else if (isReturnRequestedModal) {
                                if (modalReturnStatus === "Refunded") {
                                    modalOrderStatus = "Returned";
                                    modalPayStatus = "Refunded";
                                } else if (modalReturnStatus === "Refund Initiated") {
                                    modalOrderStatus = "Return In Progress";
                                    modalPayStatus = "Refund Processing";
                                } else if (modalReturnStatus === "Product Received") {
                                    modalOrderStatus = "Return In Progress";
                                    modalPayStatus = "Paid";
                                } else if (modalReturnStatus === "Return Approved" || modalReturnStatus === "Approved") {
                                    modalOrderStatus = "Delivered";
                                    modalReturnStatus = "Return Approved";
                                    modalPayStatus = "Paid";
                                } else {
                                    modalOrderStatus = "Delivered";
                                    modalReturnStatus = "Return Requested";
                                    modalPayStatus = "Paid";
                                }
                            }

                            const cancelReason = selectedTrackOrder.cancellation?.cancellationReason;
                            const refundAmount = selectedTrackOrder.cancellation?.refundAmount || selectedTrackOrder.totalAmount || 0;
                            const refundMethod = selectedTrackOrder.refundDetails?.refundMethod || "Original Payment Method";

                            return (
                                <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-4 space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-neutral-500 font-medium">Order Status:</span>
                                        <span className="font-semibold text-neutral-900">
                                            {modalOrderStatus}
                                        </span>
                                    </div>
                                    {isReturnRequestedModal && (
                                        <div className="flex items-center justify-between border-t border-neutral-200/50 pt-2">
                                            <span className="text-neutral-500 font-medium">Return Status:</span>
                                            <span className="font-semibold text-neutral-900">
                                                {modalReturnStatus}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between border-t border-neutral-200/50 pt-2">
                                        <span className="text-neutral-500 font-medium">Payment Status:</span>
                                        <span className="font-semibold text-neutral-900">
                                            {modalPayStatus}
                                        </span>
                                    </div>
                                    {cancelReason && (
                                        <div className="flex items-center justify-between border-t border-neutral-200/50 pt-2">
                                            <span className="text-neutral-500 font-medium">Cancellation Reason:</span>
                                            <span className="font-semibold text-neutral-900 text-right max-w-[60%] truncate">
                                                {cancelReason}
                                            </span>
                                        </div>
                                    )}
                                    {(isCancelledModal || selectedTrackOrder.cancellation?.refundAmount > 0) && (
                                        <>
                                            <div className="border-t border-neutral-200/50 pt-2 space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-neutral-500 font-medium">Order Total:</span>
                                                    <span className="font-semibold text-neutral-900">
                                                        Rs {Number(refundAmount || selectedTrackOrder.totalAmount || 0)?.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-neutral-500 font-medium">Cancellation Fee:</span>
                                                    <span className="font-semibold text-neutral-900">
                                                        - ₹0 (100% Refund)
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between border-t border-neutral-200/80 pt-1.5">
                                                    <span className="text-neutral-900 font-bold">Refund Amount:</span>
                                                    <span className="font-bold text-neutral-900 text-xs sm:text-sm">
                                                        Rs {Number(refundAmount || selectedTrackOrder.totalAmount || 0)?.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-neutral-200/50 pt-2">
                                                <span className="text-neutral-500 font-medium">Payout Method:</span>
                                                <span className="font-semibold text-neutral-900">
                                                    {refundMethod}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    {isReturnRequestedModal && (() => {
                                        const reqReason = selectedTrackOrder.returnExchange?.reason || "";
                                        const isFreeShippingReason = [
                                            "Defective or damaged product",
                                            "Received wrong item",
                                            "Parcel received with missing items",
                                            "Item damaged during transit",
                                            "Item defective or damaged"
                                        ].some(r => reqReason.toLowerCase().includes(r.toLowerCase()));

                                        const returnShippingFee = isFreeShippingReason
                                            ? 0
                                            : (typeof selectedTrackOrder.returnExchange?.returnShippingFee === "number"
                                                ? selectedTrackOrder.returnExchange.returnShippingFee
                                                : 99);

                                        const orderTotal = selectedTrackOrder.totalAmount || selectedTrackOrder.subtotal || 0;
                                        const netRefund = selectedTrackOrder.refundDetails?.refundAmount || Math.max(0, orderTotal - returnShippingFee);
                                        const payoutMethod = selectedTrackOrder.refundDetails?.refundMethod || "Original Payment Method";

                                        return (
                                            <>
                                                <div className="border-t border-neutral-200/50 pt-2 space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-neutral-500 font-medium">Order Total:</span>
                                                        <span className="font-semibold text-neutral-900">
                                                            Rs {Number(orderTotal)?.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-neutral-500 font-medium">Return Shipping Fee:</span>
                                                        <span className={returnShippingFee === 0 ? "font-semibold text-emerald-600" : "font-semibold text-amber-700"}>
                                                            {returnShippingFee === 0 ? "Rs 0 (Free Return)" : `- Rs ${returnShippingFee}`}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between border-t border-neutral-200/80 pt-1.5">
                                                        <span className="text-neutral-900 font-bold">Refund Amount:</span>
                                                        <span className="font-bold text-neutral-900 text-xs sm:text-sm">
                                                            Rs {Number(netRefund)?.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between border-t border-neutral-200/50 pt-2">
                                                    <span className="text-neutral-500 font-medium">Payout Method:</span>
                                                    <span className="font-semibold text-neutral-900">
                                                        {payoutMethod}
                                                    </span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            );
                        })()}

                        {/* Dynamic Progress Timeline (Delivery vs Cancelled vs Returned) */}
                        {(() => {
                            const currentStatus = selectedTrackOrder.orderStatus || (selectedTrackOrder.items && selectedTrackOrder.items[0]?.orderStatus) || "Placed";
                            const isCancelled = currentStatus === "Cancelled" || selectedTrackOrder.cancellation?.isCancelled;
                            const isReturned = currentStatus === "Returned" || selectedTrackOrder.returnExchange?.isRequested;

                            if (isCancelled) {
                                const cancelReason = selectedTrackOrder.cancellation?.cancellationReason || "Cancelled by customer before dispatch";
                                const refundStatus = selectedTrackOrder.refundDetails?.refundStatus || "Refund Processing";
                                const refundAmount = selectedTrackOrder.cancellation?.refundAmount || selectedTrackOrder.totalAmount || 0;
                                const refundMethod = selectedTrackOrder.refundDetails?.refundMethod || "Original Payment Method";

                                const CANCEL_STEPS = [
                                    { title: "Order Confirmed", desc: "Your order was successfully placed", completed: true, current: false },
                                    { title: "Order Cancelled", desc: `Reason: ${cancelReason}`, completed: true, current: refundStatus !== "Refunded" },
                                    { title: `Refund Status: ${refundStatus}`, desc: `Rs ${refundAmount?.toLocaleString()} via ${refundMethod}`, completed: refundStatus === "Refunded", current: refundStatus === "Refunded" }
                                ];

                                return (
                                    <div className="space-y-6 relative pl-6 border-l-2 border-red-200">
                                        {CANCEL_STEPS.map((step, idx) => (
                                            <div key={idx} className="relative space-y-0.5">
                                                <span className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white transition-all ${step.completed ? "bg-red-500 ring-4 ring-red-100" : "bg-neutral-300"
                                                    }`} />
                                                <p className={`text-sm font-semibold ${step.completed ? "text-neutral-900" : "text-neutral-400"
                                                    }`}>
                                                    <span>{step.title}</span>
                                                </p>
                                                <p className="text-xs text-neutral-500 font-normal">{step.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                );
                            }

                            if (isReturned) {
                                const returnReason = selectedTrackOrder.returnExchange?.reason || "Return requested";
                                const returnStatus = selectedTrackOrder.returnExchange?.status || "Return Requested";

                                const isApproved = returnStatus === "Return Approved" || returnStatus === "Approved" || returnStatus === "Product Received" || returnStatus === "Refund Initiated" || returnStatus === "Refunded";
                                const isReceived = returnStatus === "Product Received" || returnStatus === "Refund Initiated" || returnStatus === "Refunded";
                                const isRefundInit = returnStatus === "Refund Initiated" || returnStatus === "Refunded";
                                const isRefundedDone = returnStatus === "Refunded";

                                const RETURN_STEPS = [
                                    { title: "Return Requested", desc: `Reason: ${returnReason}`, completed: true },
                                    { title: "Return Approved", desc: "Return request approved by seller", completed: isApproved },
                                    { title: "Product Received", desc: "Product picked up & received by seller", completed: isReceived },
                                    { title: "Refund Initiated", desc: "Refund payment processing", completed: isRefundInit },
                                    { title: "Refunded", desc: "Refund completed & credited to account", completed: isRefundedDone }
                                ];

                                return (
                                    <div className="space-y-6">
                                        <div className="space-y-6 relative pl-6 border-l-2 border-purple-200">
                                            {RETURN_STEPS.map((step, idx) => (
                                                <div key={idx} className="relative space-y-0.5">
                                                    <span className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white transition-all ${step.completed ? "bg-purple-600 ring-4 ring-purple-100" : "bg-neutral-300"
                                                        }`} />
                                                    <p className={`text-sm font-semibold ${step.completed ? "text-neutral-900" : "text-neutral-400"}`}>
                                                        <span>{step.title}</span>
                                                    </p>
                                                    <p className="text-xs text-neutral-500 font-normal">{step.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }

                            const activeStepIdx = getStepIndex(currentStatus);

                            return (
                                <div className="space-y-6 relative pl-6 border-l-2 border-neutral-200">
                                    {ORDER_STEPS.map((step, idx) => {
                                        const isCompleted = idx <= activeStepIdx;
                                        const isCurrent = idx === activeStepIdx;

                                        return (
                                            <div key={idx} className="relative space-y-0.5">
                                                <span className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white transition-all ${isCompleted
                                                    ? "bg-emerald-500 ring-4 ring-emerald-100"
                                                    : "bg-neutral-300"
                                                    }`} />
                                                <p className={`text-sm font-semibold ${isCompleted ? "text-neutral-900" : "text-neutral-400"}`}>
                                                    <span>{step.title}</span>
                                                </p>
                                                <p className="text-xs text-neutral-500 font-normal">{step.desc}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}

                        <button
                            onClick={() => setSelectedTrackOrder(null)}
                            className="w-full bg-neutral-900 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                            Close Tracking
                        </button>
                    </div>
                </div>
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
