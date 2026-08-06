"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, RotateCcw, HelpCircle, X, Loader2, SlidersHorizontal, Tag } from "lucide-react";
import { getImageUrl } from "@/lib/api";

const STATUS_FILTER_OPTIONS = [
    { label: "All", value: "All" },
    { label: "On the way", value: "On the way" },
    { label: "Delivered", value: "Delivered" },
    { label: "Cancelled", value: "Cancelled" },
    { label: "Returned", value: "Returned" },
];

export default function AccountOrdersPage() {
    const [selectedTrackOrder, setSelectedTrackOrder] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [selectedStatusFilter, setSelectedStatusFilter] = useState("All");

    useEffect(() => {
        try {
            const storedOrders = localStorage.getItem("userOrders");
            if (storedOrders) {
                const parsed = JSON.parse(storedOrders);
                if (Array.isArray(parsed)) {
                    setOrders(parsed);
                }
            }
        } catch (error) {
            console.error("Error reading user orders:", error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Filter orders based on status filter
    const filteredOrders = orders.filter(order => {
        if (selectedStatusFilter === "All") return true;

        return order.items.some(item => {
            const status = (item.orderStatus || "").toLowerCase();
            if (selectedStatusFilter === "On the way") {
                return status.includes("transit") || status.includes("processing") || status.includes("way") || status.includes("dispatched");
            }
            if (selectedStatusFilter === "Delivered") {
                return status.includes("delivered");
            }
            if (selectedStatusFilter === "Cancelled") {
                return status.includes("cancel");
            }
            if (selectedStatusFilter === "Returned") {
                return status.includes("return") || status.includes("exchange");
            }
            return true;
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
                        <span className="bg-red-500 text-white text-[10px] font-semibold px-1.5 py-0.2 rounded-full">
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
                        You haven't placed any orders yet. When you place an order, it will appear here.
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
                    <p className="text-xs text-neutral-400 mb-4">No orders matching status "{selectedStatusFilter}".</p>
                    <button
                        onClick={() => setSelectedStatusFilter("All")}
                        className="text-xs font-semibold text-neutral-900 underline cursor-pointer"
                    >
                        Reset Filter
                    </button>
                </div>
            ) : (
                <div className="space-y-10">
                    {filteredOrders.map((order) => (
                        <div key={order.id} className="border-b border-neutral-100 pb-8 last:border-0 space-y-5">
                            <p className="text-xs font-normal text-neutral-400">
                                Order ID: <span className="text-neutral-500 font-medium">{order.id}</span>
                            </p>

                            {/* Items inside this order */}
                            <div className="space-y-6">
                                {order.items.map((item) => {
                                    const productUrl = item.link || `/products/${item.slug || item.productId || item.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")}`;
                                    return (
                                        <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <Link href={productUrl} className="relative w-20 h-20 sm:w-24 sm:h-24 bg-neutral-100 rounded-2xl overflow-hidden shrink-0 group block cursor-pointer">
                                                    <Image
                                                        src={item.image}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
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
                                                    <div className="text-xs text-neutral-500 space-x-3 pt-2 font-normal">
                                                        <span>
                                                            Order Status: <strong className="text-neutral-900 font-semibold">{item.orderStatus}</strong>
                                                        </span>
                                                        <span>
                                                            Payment Status: <strong className="text-neutral-900 font-semibold">{item.paymentStatus}</strong>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right self-end sm:self-center shrink-0 space-y-1">
                                                <p className="font-semibold text-neutral-900 text-base sm:text-lg">{item.price}</p>
                                                <p className="text-xs text-neutral-400 font-medium">Qty: {item.quantity}</p>
                                                <p className="text-xs text-neutral-400 font-normal pt-4">{item.deliveryDate}</p>
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
                                    <Link
                                        href="/return-and-exchange"
                                        className="border border-neutral-300 rounded-full px-4 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 text-neutral-600" />
                                        Return or Exchange
                                    </Link>
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
                    ))}
                </div>
            )}

            {/* Status Filter Modal matching screenshot */}
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

                        {/* Modal Body with Left Sidebar (Status tab) & Right Options */}
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
                                                <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? "border-red-500 bg-white" : "border-neutral-300 group-hover:border-neutral-400"
                                                    }`}>
                                                    {isSelected && (
                                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
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

            {/* Track Order Modal */}
            {selectedTrackOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6 animate-fade-in">
                        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                            <div>
                                <h3 className="text-lg font-semibold font-clashDisplay text-neutral-900">Track Order</h3>
                                <p className="text-xs text-neutral-400 mt-0.5">Order ID: {selectedTrackOrder.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedTrackOrder(null)}
                                className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6 relative pl-6 border-l-2 border-neutral-200">
                            <div className="relative space-y-1">
                                <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white ring-4 ring-emerald-100" />
                                <p className="text-sm font-semibold text-neutral-900">Order Confirmed</p>
                                <p className="text-xs text-neutral-500">Order details processed and sent to warehouse</p>
                            </div>
                            <div className="relative space-y-1">
                                <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white ring-4 ring-emerald-100" />
                                <p className="text-sm font-semibold text-neutral-900">Dispatched & In Transit</p>
                                <p className="text-xs text-neutral-500">Package is on its way via Express Logistics</p>
                            </div>
                            <div className="relative space-y-1">
                                <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-neutral-300 border-2 border-white" />
                                <p className="text-sm font-semibold text-neutral-400">Out for Delivery</p>
                                <p className="text-xs text-neutral-400">Courier partner will deliver to your address</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedTrackOrder(null)}
                            className="w-full bg-neutral-900 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                            Close Tracking
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
