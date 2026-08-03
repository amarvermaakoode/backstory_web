"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, RotateCcw, HelpCircle, X } from "lucide-react";

export default function AccountOrdersPage() {
    const [selectedTrackOrder, setSelectedTrackOrder] = useState(null);
    const [orders, setOrders] = useState([
        {
            id: "TB918920379",
            items: [
                {
                    id: 101,
                    name: "Lost on Purpose",
                    category: "BIKER SERIES",
                    size: "XL",
                    color: "Raw Cream",
                    colorHex: "#F2EFE9",
                    price: "Rs 3,998",
                    quantity: 2,
                    orderStatus: "In Transit",
                    paymentStatus: "COD",
                    deliveryDate: "On Sat 23, 2026",
                    image: "/images/landing-page/biker-tshirt.png",
                },
                {
                    id: 102,
                    name: "Lost on Purpose",
                    category: "BIKER SERIES",
                    size: "XL",
                    color: "Raw Cream",
                    colorHex: "#F2EFE9",
                    price: "Rs 998",
                    quantity: 1,
                    orderStatus: "In Transit",
                    paymentStatus: "COD",
                    deliveryDate: "On Sat 23, 2026",
                    image: "/images/landing-page/biker-tshirt.png",
                },
            ],
        },
        {
            id: "TB918920380",
            items: [
                {
                    id: 103,
                    name: "Midnight Wanderer",
                    category: "TRAVEL SERIES",
                    size: "L",
                    color: "Midnight Blue",
                    colorHex: "#1E293B",
                    price: "Rs 2,499",
                    quantity: 1,
                    orderStatus: "Delivered",
                    paymentStatus: "Prepaid",
                    deliveryDate: "Delivered on Fri 22, 2026",
                    image: "/images/landing-page/coding-tshirt.png",
                },
            ],
        },
        {
            id: "TB918920381",
            items: [
                {
                    id: 104,
                    name: "Urban Trekker",
                    category: "CITY SERIES",
                    size: "M",
                    color: "Charcoal Grey",
                    colorHex: "#475569",
                    price: "Rs 1,750",
                    quantity: 3,
                    orderStatus: "Processing",
                    paymentStatus: "Pending",
                    deliveryDate: "Estimated Delivery: Mon 25, 2026",
                    image: "/images/landing-page/wonderlust.png",
                },
            ],
        },
    ]);

    if (orders.length === 0) {
        return (
            <div className="text-center py-16">
                <Package className="w-12 h-12 stroke-[1.2] text-neutral-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold font-clashDisplay text-neutral-900 mb-2">No Orders Yet</h3>
                <p className="text-sm text-neutral-500 mb-6">When you place an order, it will appear here.</p>
                <Link
                    href="/product-list"
                    className="bg-neutral-900 text-white rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-neutral-800 transition-colors inline-block"
                >
                    Explore Shop
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <h2 className="text-xl sm:text-2xl font-bold font-clashDisplay text-neutral-900 tracking-tight mb-6">
                Order History
            </h2>

            <div className="space-y-10">
                {orders.map((order) => (
                    <div key={order.id} className="border-b border-neutral-100 pb-8 last:border-0 space-y-5">
                        <p className="text-xs font-normal text-neutral-400">
                            Order ID: <span className="text-neutral-500 font-medium">{order.id}</span>
                        </p>

                        {/* Items inside this order */}
                        <div className="space-y-6">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-neutral-100 rounded-2xl overflow-hidden shrink-0">
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                fill
                                                className="object-cover object-center"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-neutral-900 text-sm sm:text-base">{item.name}</h4>
                                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{item.category}</p>
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
                                        <p className="font-bold text-neutral-900 text-base sm:text-lg">{item.price}</p>
                                        <p className="text-xs text-neutral-400 font-medium">Qty: {item.quantity}</p>
                                        <p className="text-xs text-neutral-400 font-normal pt-4">{item.deliveryDate}</p>
                                    </div>
                                </div>
                            ))}
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

            {/* Track Order Modal */}
            {selectedTrackOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6 animate-fade-in">
                        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                            <div>
                                <h3 className="text-lg font-bold font-clashDisplay text-neutral-900">Track Order</h3>
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
                                <p className="text-sm font-bold text-neutral-900">Order Confirmed</p>
                                <p className="text-xs text-neutral-500">Order details processed and sent to warehouse</p>
                            </div>
                            <div className="relative space-y-1">
                                <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white ring-4 ring-emerald-100" />
                                <p className="text-sm font-bold text-neutral-900">Dispatched & In Transit</p>
                                <p className="text-xs text-neutral-500">Package is on its way via Express Logistics</p>
                            </div>
                            <div className="relative space-y-1">
                                <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-neutral-300 border-2 border-white" />
                                <p className="text-sm font-bold text-neutral-400">Out for Delivery</p>
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
