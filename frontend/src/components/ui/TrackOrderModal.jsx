"use client";

import React from "react";
import { X } from "lucide-react";

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

const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return num % 1 === 0
        ? num.toLocaleString("en-IN")
        : num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function TrackOrderModal({ order, onClose }) {
    if (!order) return null;

    const displayOrderId = order.orderId || order.id || "";
    const rawOrderStatus = order.orderStatus || (order.items && order.items[0]?.orderStatus) || "Placed";
    const isCancelledModal = rawOrderStatus === "Cancelled" || order.cancellation?.isCancelled;
    const returnRequestsList = (Array.isArray(order.returnRequestsHistory) && order.returnRequestsHistory.length > 0)
        ? order.returnRequestsHistory
        : (order.returnExchange?.isRequested ? [order.returnExchange] : []);
    const isReturnRequestedModal = returnRequestsList.length > 0;

    let modalOrderStatus = rawOrderStatus;
    let modalPayStatus = order.paymentStatus || "Paid";

    if (isCancelledModal) {
        modalOrderStatus = "Cancelled";
        if (order.paymentStatus === "Refunded" || order.refundDetails?.refundStatus === "Refunded" || order.refundDetails?.refundStatus === "Processed / Credited") {
            modalPayStatus = "Refunded";
        } else if (order.cancellation?.refundAmount > 0) {
            modalPayStatus = "Refund Processing";
        } else {
            modalPayStatus = "Cancelled (Unpaid)";
        }
    } else if (isReturnRequestedModal) {
        const latestReqStatus = returnRequestsList[returnRequestsList.length - 1]?.status;
        if (latestReqStatus === "Refunded") {
            modalOrderStatus = "Returned";
            modalPayStatus = "Refunded";
        } else if (latestReqStatus === "Refund Initiated") {
            modalOrderStatus = "Return In Progress";
            modalPayStatus = "Refund Processing";
        } else if (latestReqStatus === "Product Received") {
            modalOrderStatus = "Return In Progress";
            modalPayStatus = "Paid";
        } else if (latestReqStatus === "Return Approved" || latestReqStatus === "Approved") {
            modalOrderStatus = "Delivered";
            modalPayStatus = "Paid";
        } else {
            modalOrderStatus = "Delivered";
            modalPayStatus = "Paid";
        }
    }

    const cancelReason = order.cancellation?.cancellationReason;
    const refundAmount = order.cancellation?.refundAmount || order.totalAmount || 0;
    const refundMethod = order.refundDetails?.refundMethod || "Original Payment Method";

    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-white max-h-[90vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6 animate-fade-in border border-neutral-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <div>
                        <h3 className="text-lg font-semibold font-clashDisplay text-neutral-900">Track Order</h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                            Order ID: <span className="font-mono font-semibold text-neutral-800">{displayOrderId}</span>
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Order, Return & Payment Status Overview Box */}
                <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-neutral-500 font-medium">Order Status:</span>
                        <span className="font-semibold text-neutral-900">
                            {modalOrderStatus}
                        </span>
                    </div>

                    {isReturnRequestedModal && (
                        <div className="flex items-center justify-between border-t border-neutral-200/50 pt-2">
                            <span className="text-neutral-500 font-medium">
                                {returnRequestsList.some(r => r.requestType === "exchange") ? "Exchange Requests:" : "Return Requests:"}
                            </span>
                            <span className="font-semibold text-neutral-900">
                                {returnRequestsList.length} Request{returnRequestsList.length > 1 ? "s" : ""} Submitted
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

                    {(isCancelledModal || order.cancellation?.refundAmount > 0) && (
                        <>
                            <div className="border-t border-neutral-200/50 pt-2 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-neutral-500 font-medium">Order Total:</span>
                                    <span className="font-semibold text-neutral-900">
                                        Rs {Number(refundAmount || order.totalAmount || 0)?.toLocaleString()}
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
                                        Rs {Number(refundAmount || order.totalAmount || 0)?.toLocaleString()}
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
                </div>

                {/* Dynamic Progress Timelines */}
                {(() => {
                    const currentStatus = order.orderStatus || (order.items && order.items[0]?.orderStatus) || "Placed";
                    const isCancelled = currentStatus === "Cancelled" || order.cancellation?.isCancelled;

                    // CASE 1: Cancelled Order
                    if (isCancelled) {
                        const cancelReasonText = order.cancellation?.cancellationReason || "Cancelled by customer before dispatch";
                        const refundStatus = order.refundDetails?.refundStatus || "Refund Processing";
                        const refundAmt = order.cancellation?.refundAmount || order.totalAmount || 0;
                        const rawCancelMethod = order.refundDetails?.refundMethod || "Original Payment Method";
                        const originalWasWallet = (order.paymentMethod || "").toLowerCase().includes("wallet") || (order.walletDeduction && order.walletDeduction > 0);
                        const isCancelWallet = rawCancelMethod.toLowerCase().includes("wallet") || (rawCancelMethod.toLowerCase().includes("original") && originalWasWallet);
                        const finalRefundMethod = isCancelWallet ? "BacStory Wallet" : rawCancelMethod;

                        const isRefundComplete =
                            order.paymentStatus === "Refunded" ||
                            refundStatus === "Refunded" ||
                            refundStatus === "Processed / Credited" ||
                            refundStatus === "Paid";

                        const refundDate = formatTimelineDate(
                            order.refundDetails?.updatedAt ||
                            order.refundDetails?.initiatedAt ||
                            order.cancellation?.cancelledAt ||
                            order.updatedAt
                        );

                        const CANCEL_STEPS = [
                            {
                                title: "Order Confirmed",
                                desc: "Your order was successfully placed",
                                completed: true,
                                current: false,
                                date: formatTimelineDate(order.createdAt)
                            },
                            {
                                title: "Order Cancelled",
                                desc: `Reason: ${cancelReasonText}`,
                                completed: true,
                                current: !isRefundComplete,
                                date: formatTimelineDate(order.cancellation?.cancelledAt || order.updatedAt)
                            },
                            {
                                title: isRefundComplete
                                    ? `Refund Status: ${refundStatus === "Refund Pending" || refundStatus === "Refund Processing" ? "Processed / Credited" : refundStatus}`
                                    : `Refund Status: ${refundStatus}`,
                                desc: isRefundComplete
                                    ? `Rs ${refundAmt?.toLocaleString()} refunded successfully via ${finalRefundMethod}`
                                    : `Rs ${refundAmt?.toLocaleString()} via ${finalRefundMethod}`,
                                completed: isRefundComplete,
                                current: isRefundComplete,
                                isSuccess: isRefundComplete,
                                date: isRefundComplete ? refundDate : null
                            }
                        ];

                        return (
                            <div className="space-y-6 relative pl-6 border-l-2 border-red-200">
                                {CANCEL_STEPS.map((step, idx) => (
                                    <div key={idx} className="relative space-y-0.5">
                                        <span className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 border-white transition-all ${
                                            step.completed
                                                ? (step.isSuccess ? "bg-emerald-500 ring-4 ring-emerald-100" : "bg-red-500 ring-4 ring-red-100")
                                                : "bg-neutral-300"
                                        }`} />
                                        <div className="flex flex-wrap sm:flex-nowrap items-baseline sm:items-center justify-between gap-1 sm:gap-2">
                                            <p className={`text-sm font-semibold ${
                                                step.completed
                                                    ? (step.isSuccess ? "text-emerald-700 font-bold" : "text-neutral-900")
                                                    : "text-neutral-400"
                                            }`}>
                                                <span>{step.title}</span>
                                            </p>
                                            {step.date && (
                                                <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md shrink-0">
                                                    {step.date}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-neutral-500 font-normal">{step.desc}</p>
                                    </div>
                                ))}
                            </div>
                        );
                    }

                    // CASE 2: Return & Exchange Request Timelines
                    if (isReturnRequestedModal) {
                        return (
                            <div className="space-y-4">
                                <span className="text-xs font-semibold text-neutral-400 tracking-wider uppercase block">
                                    {returnRequestsList.every(r => r.requestType === "exchange") ? "Exchange Requests" : "Return & Exchange Requests"} ({returnRequestsList.length})
                                </span>

                                {returnRequestsList.map((req, reqIndex) => {
                                    const isReturn = req.requestType === "return";
                                    const reqReason = req.reason || "Return requested";
                                    const isOrderAlreadyRefunded = order.paymentStatus === "Refunded" || order.refundDetails?.refundStatus === "Refunded" || order.refundDetails?.refundStatus === "Processed / Credited" || order.returnExchange?.status === "Refunded" || order.orderStatus === "Returned";
                                    const reqStatus = (req.status === "Product Received" && isOrderAlreadyRefunded)
                                        ? "Refunded"
                                        : (req.status || "Return Requested");

                                    let reqItemsSubtotal = 0;
                                    if (req.requestedItems?.length > 0) {
                                        req.requestedItems.forEach(ritem => {
                                            const origItem = order.items?.find(i => (ritem.itemId && (i._id?.toString() === ritem.itemId || i.id === ritem.itemId)) || (ritem.name && i.name === ritem.name));
                                            const rawPrice = origItem ? (origItem.priceNum ?? origItem.price) : 0;
                                            const unitPrice = typeof rawPrice === "number" ? rawPrice : (parseFloat(String(rawPrice || 0).replace(/[^0-9.]/g, "")) || 0);
                                            const qty = ritem.returnQuantity || 1;
                                            reqItemsSubtotal += (unitPrice * qty);
                                        });
                                    }

                                    const orderPaidAmount = typeof order.totalAmount === "number"
                                        ? order.totalAmount
                                        : (parseFloat(String(order.totalAmount ?? order.orderTotal ?? 0).replace(/[^0-9.]/g, "")) || 0);

                                    const orderOriginalSubtotal = order.subtotal > 0
                                        ? Number(order.subtotal)
                                        : (order.items && Array.isArray(order.items)
                                            ? order.items.reduce((s, it) => {
                                                const rawP = it.priceNum ?? it.price;
                                                const p = typeof rawP === "number" ? rawP : (parseFloat(String(rawP || 0).replace(/[^0-9.]/g, "")) || 0);
                                                return s + (p * (it.quantity || 1));
                                            }, 0)
                                            : orderPaidAmount);

                                    // Proportional discount calculation:
                                    // Exclude order shipping & tax so shipping is not refunded for partial returns.
                                    const orderShippingCost = typeof order.shippingCost === "number" ? order.shippingCost : (parseFloat(String(order.shippingCost || 0).replace(/[^0-9.]/g, "")) || 0);
                                    const orderTaxAmount = typeof order.taxAmount === "number" ? order.taxAmount : (parseFloat(String(order.taxAmount || 0).replace(/[^0-9.]/g, "")) || 0);
                                    const netItemsPaid = Math.max(0, orderPaidAmount - orderShippingCost - orderTaxAmount);

                                    const storedPrepaidDiscount = typeof order.prepaidDiscount === "number" ? order.prepaidDiscount : (parseFloat(String(order.prepaidDiscount || 0).replace(/[^0-9.]/g, "")) || 0);
                                    const totalItemDiscount = orderOriginalSubtotal > 0
                                        ? Math.max(0, orderOriginalSubtotal - netItemsPaid)
                                        : 0;

                                    let itemDiscountRate = 0;
                                    if (orderOriginalSubtotal > 0) {
                                        if (storedPrepaidDiscount > 0 && Math.abs((storedPrepaidDiscount / orderOriginalSubtotal) - 0.05) < 0.005) {
                                            itemDiscountRate = 0.05;
                                        } else if (totalItemDiscount > 0) {
                                            itemDiscountRate = Math.min(1, Math.max(0, totalItemDiscount / orderOriginalSubtotal));
                                        } else if (storedPrepaidDiscount > 0) {
                                            itemDiscountRate = Math.min(1, Math.max(0, storedPrepaidDiscount / orderOriginalSubtotal));
                                        }
                                    }

                                    const discountShareForReturned = Math.round(reqItemsSubtotal * itemDiscountRate * 100) / 100;
                                    const effectivePaidForReturned = orderPaidAmount === 0
                                        ? 0
                                        : Math.max(0, Math.min(netItemsPaid, Math.round((reqItemsSubtotal - discountShareForReturned) * 100) / 100));

                                    const isZeroOrMarketing = orderPaidAmount <= 0 ||
                                        (order.paymentMethod || "").toLowerCase().includes("marketing") ||
                                        (order.paymentMethod || "").toLowerCase().includes("promo") ||
                                        (order.couponCode || "").toLowerCase().startsWith("mkt") ||
                                        (order.couponCode || "").toLowerCase().includes("promo") ||
                                        String(order.razorpayPaymentId || "").startsWith("pay_PROMO") ||
                                        String(order.razorpayOrderId || "").startsWith("order_FREE");

                                    const normalizedReqReason = (reqReason || "").toLowerCase();
                                    const isFeeApplicableReason = normalizedReqReason.includes("mind") || normalizedReqReason === "other" || normalizedReqReason.startsWith("other");

                                    const reqShippingFee = typeof req.returnShippingFee === "number" ? req.returnShippingFee : (isFeeApplicableReason ? 99 : 0);
                                    const reqNetRefund = isZeroOrMarketing
                                        ? 0
                                        : (typeof req.refundAmount === "number"
                                            ? req.refundAmount
                                            : Math.max(0, Math.round((effectivePaidForReturned - reqShippingFee) * 100) / 100));
                                    const orderWalletDeduction = typeof order.walletDeduction === "number"
                                        ? order.walletDeduction
                                        : (parseFloat(String(order.walletDeduction || 0).replace(/[^0-9.]/g, "")) || 0);
                                    const orderRazorpayPaid = Math.max(0, orderPaidAmount - orderWalletDeduction);
                                    const isOrderSplit = orderWalletDeduction > 0 && orderRazorpayPaid > 0 && orderPaidAmount > 0;

                                    const rawMethod = req.refundMethod || order.refundDetails?.refundMethod || order.returnExchange?.refundMethod || "Original Payment Method";
                                    const isExplicitWallet = (rawMethod || "").toLowerCase().includes("wallet") && !(rawMethod || "").toLowerCase().includes("original");

                                    let reqWalletPortion = 0;
                                    let reqRazorpayPortion = 0;
                                    if (isExplicitWallet) {
                                        reqWalletPortion = reqNetRefund;
                                        reqRazorpayPortion = 0;
                                    } else if (isOrderSplit) {
                                        reqWalletPortion = Math.round(Math.min(orderWalletDeduction, reqNetRefund * (orderWalletDeduction / orderPaidAmount)) * 100) / 100;
                                        reqRazorpayPortion = Math.max(0, Math.round((reqNetRefund - reqWalletPortion) * 100) / 100);
                                    } else if (orderWalletDeduction > 0 && orderRazorpayPaid <= 0) {
                                        reqWalletPortion = reqNetRefund;
                                        reqRazorpayPortion = 0;
                                    } else {
                                        reqWalletPortion = 0;
                                        reqRazorpayPortion = reqNetRefund;
                                    }

                                    const isSplitRefund = isOrderSplit && !isExplicitWallet;
                                    const reqPayoutMethod = isZeroOrMarketing 
                                        ? "None (₹0 / Marketing Order)" 
                                        : (isSplitRefund
                                            ? `Original Payment Method (Split: Rs ${formatCurrency(reqWalletPortion)} to Wallet + Rs ${formatCurrency(reqRazorpayPortion)} via Razorpay)`
                                            : (isExplicitWallet ? "BacStory Wallet / Store Credit" : rawMethod));

                                    const isApproved = ["Return Approved", "Exchange Approved", "Approved", "Product Received", "Product Picked Up", "Replacement Ready to Pack & Ship", "Refund Initiated", "Replacement Dispatched", "Refunded", "Exchange Completed"].includes(reqStatus);
                                    const isReceived = ["Product Received", "Product Picked Up", "Replacement Ready to Pack & Ship", "Refund Initiated", "Replacement Dispatched", "Refunded", "Exchange Completed"].includes(reqStatus);
                                    const isReadyToShip = ["Replacement Ready to Pack & Ship", "Replacement Dispatched", "Exchange Completed"].includes(reqStatus);
                                    const isDispatched = ["Replacement Dispatched", "Exchange Completed"].includes(reqStatus);
                                    const isExchangedDone = reqStatus === "Exchange Completed";

                                    const RETURN_STEPS = isZeroOrMarketing ? [
                                        { title: "Return Requested", desc: `Reason: ${reqReason}`, completed: true, date: formatTimelineDate(req.requestedAt) },
                                        { title: "Return Approved", desc: "Return request approved by seller", completed: isApproved, date: isApproved ? formatTimelineDate(req.updatedAt || req.requestedAt) : null },
                                        { title: "Product Received", desc: "Product picked up & received by seller", completed: isReceived, date: isReceived ? formatTimelineDate(req.updatedAt) : null },
                                        {
                                            title: "Return Completed",
                                            desc: "Return completed & closed. No monetary refund required as order was ₹0 (Marketing / Promo Code).",
                                            completed: ["Refunded", "Returned", "Completed"].includes(reqStatus),
                                            date: ["Refunded", "Returned", "Completed"].includes(reqStatus) ? formatTimelineDate(order.refundDetails?.updatedAt || req.updatedAt) : null
                                        }
                                    ] : [
                                        { title: "Return Requested", desc: `Reason: ${reqReason}`, completed: true, date: formatTimelineDate(req.requestedAt) },
                                        { title: "Return Approved", desc: "Return request approved by seller", completed: isApproved, date: isApproved ? formatTimelineDate(req.updatedAt || req.requestedAt) : null },
                                        { title: "Product Received", desc: "Product picked up & received by seller", completed: isReceived, date: isReceived ? formatTimelineDate(req.updatedAt) : null },
                                        {
                                            title: "Refund Initiated",
                                            desc: isSplitRefund
                                                ? `Split Refund: Rs ${reqWalletPortion.toLocaleString()} credited to BacStory Wallet, and Rs ${reqRazorpayPortion.toLocaleString()} processing via Razorpay (5-7 Working Days)`
                                                : isExplicitWallet
                                                    ? "Refund credited instantly to BacStory Wallet"
                                                    : "Refund payment processing via Razorpay (Credited in 5-7 Working Days)",
                                            completed: ["Refund Initiated", "Refunded"].includes(reqStatus),
                                            date: ["Refund Initiated", "Refunded"].includes(reqStatus) ? formatTimelineDate(order.refundDetails?.initiatedAt || req.updatedAt) : null
                                        },
                                        {
                                            title: "Refunded",
                                            desc: isSplitRefund
                                                ? `Split Refund Completed: Rs ${reqWalletPortion.toLocaleString()} added to BacStory Wallet balance, and Rs ${reqRazorpayPortion.toLocaleString()} refunded to bank account/card`
                                                : isExplicitWallet
                                                    ? "Refund completed & added to BacStory Wallet balance"
                                                    : "Refund completed & credited to bank account",
                                            completed: reqStatus === "Refunded",
                                            date: reqStatus === "Refunded" ? formatTimelineDate(order.refundDetails?.updatedAt || req.updatedAt) : null
                                        }
                                    ];

                                    const EXCHANGE_STEPS = [
                                        { title: "Exchange Requested", desc: `Reason: ${reqReason}`, completed: true, date: formatTimelineDate(req.requestedAt) },
                                        { title: "Exchange Approved", desc: "Exchange request approved by seller", completed: isApproved, date: isApproved ? formatTimelineDate(req.updatedAt || req.requestedAt) : null },
                                        { title: "Product Picked Up", desc: "Product picked up by seller for quality inspection", completed: isReceived, date: isReceived ? formatTimelineDate(req.updatedAt) : null },
                                        {
                                            title: "Replacement Ready to Pack & Ship",
                                            desc: "Replacement item undergoing quality check & packing",
                                            completed: isReadyToShip,
                                            date: isReadyToShip ? formatTimelineDate(req.updatedAt) : null
                                        },
                                        {
                                            title: "Replacement Dispatched",
                                            desc: "Replacement item dispatched & in transit",
                                            completed: isDispatched,
                                            date: isDispatched ? formatTimelineDate(req.updatedAt) : null
                                        },
                                        {
                                            title: "Exchange Completed",
                                            desc: "Replacement item delivered successfully to customer",
                                            completed: isExchangedDone,
                                            date: isExchangedDone ? formatTimelineDate(req.updatedAt) : null
                                        }
                                    ];

                                    const TRACKING_STEPS = isReturn ? RETURN_STEPS : EXCHANGE_STEPS;

                                    return (
                                        <div key={req._id || req.requestId || reqIndex} className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-4 space-y-3">
                                            <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2">
                                                <span className="text-xs font-semibold text-neutral-900">
                                                    {isReturn ? `Return Request #${reqIndex + 1}` : `Exchange Request #${reqIndex + 1}`}
                                                </span>
                                                <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${reqStatus === "Approved" || reqStatus === "Return Approved" || reqStatus === "Exchange Approved"
                                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                                    : reqStatus === "Rejected"
                                                        ? "bg-red-100 text-red-800 border border-red-200"
                                                        : "bg-neutral-200 text-neutral-800 border border-neutral-300"
                                                    }`}>
                                                    {reqStatus}
                                                </span>
                                            </div>

                                            {/* Details Breakdown */}
                                            {isReturn && (
                                                <div className="space-y-1.5 text-xs text-neutral-600 bg-white p-3 rounded-xl border border-neutral-200/60">
                                                    <div className="flex items-center justify-between">
                                                        <span>Items Value:</span>
                                                        <span className="font-semibold text-neutral-900">Rs {formatCurrency(reqItemsSubtotal)}</span>
                                                    </div>
                                                    {isFeeApplicableReason && (
                                                        <div className="flex items-center justify-between text-amber-700">
                                                            <span>Return Shipping Fee:</span>
                                                            <span className="font-semibold">Rs {formatCurrency(reqShippingFee)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between border-t border-neutral-100 pt-1 text-emerald-700 font-semibold">
                                                        <span>Refund Amount:</span>
                                                        <span>Rs {formatCurrency(reqNetRefund)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between border-t border-neutral-100 pt-1 text-neutral-500">
                                                        <span>Refund Payout Method:</span>
                                                        <span className="font-semibold text-neutral-800 text-right">{reqPayoutMethod}</span>
                                                    </div>
                                                    {isSplitRefund && (
                                                        <div className="p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100/90 space-y-1 text-[11px] text-neutral-700">
                                                            <div className="flex items-center justify-between font-semibold text-indigo-950">
                                                                <span>Split Refund Distribution</span>
                                                                <span className="text-[10px] text-indigo-600 font-mono">2-Way Split</span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span>BacStory Wallet Credit:</span>
                                                                <span className="font-semibold text-emerald-700 font-mono">Rs {formatCurrency(reqWalletPortion)}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span>Razorpay (Original Card/UPI):</span>
                                                                <span className="font-semibold text-indigo-700 font-mono">Rs {formatCurrency(reqRazorpayPortion)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Status Timeline for this Request */}
                                            <div className="space-y-3 pt-1">
                                                <span className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase block">Status Timeline:</span>
                                                <div className="space-y-4 relative pl-5 border-l-2 border-purple-200">
                                                    {TRACKING_STEPS.map((step, idx) => (
                                                        <div key={idx} className="relative space-y-0.5">
                                                            <span className={`absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white transition-all ${step.completed ? "bg-purple-600 ring-4 ring-purple-100" : "bg-neutral-300"
                                                                }`} />
                                                            <div className="flex flex-wrap sm:flex-nowrap items-baseline sm:items-center justify-between gap-1 sm:gap-2">
                                                                <p className={`text-xs font-semibold ${step.completed ? "text-neutral-900" : "text-neutral-400"}`}>
                                                                    <span>{step.title}</span>
                                                                </p>
                                                                {step.date && (
                                                                    <span className="text-[10px] font-medium text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded shrink-0">
                                                                        {step.date}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-neutral-500 font-normal">{step.desc}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    }

                    // CASE 3: Active Delivery Timeline (5-Step Order Flow)
                    const activeStepIdx = getStepIndex(currentStatus);

                    return (
                        <div className="space-y-6 relative pl-6 border-l-2 border-neutral-200">
                            {ORDER_STEPS.map((step, idx) => {
                                const isCompleted = idx <= activeStepIdx;
                                const isCurrent = idx === activeStepIdx;
                                const stepDate = getStepTimelineDate(step.title, idx, order, activeStepIdx);

                                return (
                                    <div key={idx} className="relative space-y-0.5">
                                        <span className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 border-white transition-all ${isCompleted
                                            ? "bg-emerald-500 ring-4 ring-emerald-100"
                                            : "bg-neutral-300"
                                            }`} />
                                        <div className="flex flex-wrap sm:flex-nowrap items-baseline sm:items-center justify-between gap-1 sm:gap-2">
                                            <p className={`text-sm font-semibold ${isCompleted ? "text-neutral-900" : "text-neutral-400"}`}>
                                                <span>{step.title}</span>
                                            </p>
                                            {stepDate && (
                                                <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md shrink-0">
                                                    {stepDate}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-neutral-500 font-normal">{step.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}

                {/* Footer Action Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full bg-neutral-900 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                    Close Tracking
                </button>
            </div>
        </div>
    );
}
