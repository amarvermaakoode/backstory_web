"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Package,
  Search,
  Filter,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Loader2,
  X,
  Check,
  PackageCheck,
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  ChevronDown,
  RotateCcw,
  Video,
  ExternalLink
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useToast } from "@/context/ToastContext";
import { getImageUrl, API_BASE_URL } from "@/lib/api";
import CustomSelect from "@/components/ui/CustomSelect";
import CustomConfirmModal from "@/components/ui/CustomConfirmModal";
import AdminPagination from "@/components/ui/AdminPagination";

const ORDER_STATUS_STEPS = [
  "Order Confirmed",
  "Ready to Pack & Ship",
  "Dispatched & In Transit",
  "Out for Delivery",
  "Delivered"
];

const STATUS_BADGE_STYLES = {
  "Placed": "bg-blue-50 text-blue-700 border-blue-200",
  "Order Confirmed": "bg-blue-50 text-blue-700 border-blue-200",
  "Ready to Pack & Ship": "bg-amber-50 text-amber-800 border-amber-200",
  "Dispatched & In Transit": "bg-purple-50 text-purple-700 border-purple-200",
  "Out for Delivery": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Delivered": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Return Requested": "bg-amber-50 text-amber-800 border-amber-300 font-semibold",
  "Exchange Requested": "bg-purple-50 text-purple-800 border-purple-300 font-semibold",
  "Return In Progress": "bg-purple-50 text-purple-800 border-purple-200",
  "Returned": "bg-neutral-100 text-neutral-700 border-neutral-300",
  "Exchange In Progress": "bg-purple-50 text-purple-800 border-purple-200",
  "Exchanged": "bg-emerald-50 text-emerald-800 border-emerald-200",
  "Cancelled": "bg-red-50 text-red-700 border-red-200"
};

// Helper to determine display status if a return or exchange request is active
export function getOrderDisplayStatus(order) {
  if (!order) return "Order Confirmed";

  const returnRequestsList = (Array.isArray(order.returnRequestsHistory) && order.returnRequestsHistory.length > 0)
    ? order.returnRequestsHistory
    : (order.returnExchange?.isRequested ? [order.returnExchange] : []);

  // Look for any pending return or exchange request
  const pendingReq = returnRequestsList.slice().reverse().find(r =>
    r.status === "Return Requested" ||
    r.status === "Exchange Requested" ||
    r.status === "Pending Verification" ||
    (r.status === "Requested" && (r.requestType === "return" || r.requestType === "exchange"))
  );

  if (pendingReq) {
    if (pendingReq.requestType === "exchange" || pendingReq.status === "Exchange Requested") {
      return "Exchange Requested";
    }
    return "Return Requested";
  }

  if (order.orderStatus === "Return Requested" || order.orderStatus === "Exchange Requested") {
    return order.orderStatus;
  }

  return order.orderStatus || "Order Confirmed";
}

export default function AdminOrdersPage() {
  const { adminFetch } = useAdminAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const activePage = currentPage > totalPages && totalPages > 0 ? totalPages : currentPage;
  const paginatedOrders = orders.slice((activePage - 1) * ITEMS_PER_PAGE, activePage * ITEMS_PER_PAGE);

  // Custom Popup Modal State & Promise Helpers
  const [popupModal, setPopupModal] = useState(null);

  const customConfirm = (message, title = "Confirm Action", confirmText = "Confirm", isDanger = false) => {
    return new Promise((resolve) => {
      setPopupModal({
        type: "confirm",
        title,
        message,
        confirmText,
        cancelText: "Cancel",
        isDanger,
        onConfirm: () => {
          setPopupModal(null);
          resolve(true);
        },
        onCancel: () => {
          setPopupModal(null);
          resolve(false);
        }
      });
    });
  };

  const customAlert = (message, title = "Notification") => {
    return new Promise((resolve) => {
      setPopupModal({
        type: "alert",
        title,
        message,
        confirmText: "OK",
        onConfirm: () => {
          setPopupModal(null);
          resolve(true);
        }
      });
    });
  };

  const customPrompt = (message, defaultValue = "", title = "Input Required", placeholder = "Enter details...") => {
    return new Promise((resolve) => {
      setPopupModal({
        type: "prompt",
        title,
        message,
        inputValue: defaultValue,
        placeholder,
        confirmText: "Submit",
        cancelText: "Cancel",
        onConfirm: (val) => {
          setPopupModal(null);
          resolve(val);
        },
        onCancel: () => {
          setPopupModal(null);
          resolve(null);
        }
      });
    });
  };

  const handleApproveReturn = async (orderDbId, requestId = null) => {
    const confirmed = await customConfirm("Are you sure you want to approve this return request?", "Approve Return Request");
    if (!confirmed) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminFetch(`/orders/${orderDbId}/approve-return`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(data.message || "Return request approved successfully!", "success");
        if (data.data) {
          setOrders(prev => prev.map(o => (o._id === orderDbId || o.orderId === orderDbId ? data.data : o)));
          setSelectedOrder(data.data);
        } else {
          fetchOrders();
        }
      } else {
        showToast(data.message || "Failed to approve return request.", "error");
      }
    } catch (error) {
      console.error("Error approving return request:", error);
      showToast("Failed to approve return request.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkProductReceived = async (orderDbId, requestId = null) => {
    const confirmed = await customConfirm("Confirm that the returned product has been picked up and received by seller?", "Mark Product Received");
    if (!confirmed) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminFetch(`/orders/${orderDbId}/product-received`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(data.message || "Product marked as received! You can now process the refund.", "success");
        if (data.data) {
          setOrders(prev => prev.map(o => (o._id === orderDbId || o.orderId === orderDbId ? data.data : o)));
          setSelectedOrder(data.data);
        } else {
          fetchOrders();
        }
      } else {
        showToast(data.message || "Failed to mark product received.", "error");
      }
    } catch (error) {
      console.error("Error marking product received:", error);
      showToast("Failed to mark product received.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessReturnRefund = async (orderDbId, requestId = null) => {
    const refundMethodStr = (selectedOrder?.refundDetails?.refundMethod || selectedOrder?.returnExchange?.refundMethod || "").toLowerCase();
    const isExplicitWallet = (refundMethodStr.includes("wallet") || refundMethodStr.includes("store credit")) && !refundMethodStr.includes("original");

    const orderPaidAmount = typeof selectedOrder?.totalAmount === "number"
      ? selectedOrder.totalAmount
      : (parseFloat(String(selectedOrder?.totalAmount ?? selectedOrder?.orderTotal ?? 0).replace(/[^0-9.]/g, "")) || 0);

    const orderWalletDeduction = typeof selectedOrder?.walletDeduction === "number"
      ? selectedOrder.walletDeduction
      : (parseFloat(String(selectedOrder?.walletDeduction || 0).replace(/[^0-9.]/g, "")) || 0);

    const orderRazorpayPaid = Math.max(0, orderPaidAmount - orderWalletDeduction);
    const isOrderSplit = !isExplicitWallet && orderWalletDeduction > 0 && orderRazorpayPaid > 0 && orderPaidAmount > 0;

    const isZeroOrMarketing = 
      orderPaidAmount <= 0 ||
      (selectedOrder?.paymentMethod || "").toLowerCase().includes("marketing") ||
      (selectedOrder?.paymentMethod || "").toLowerCase().includes("promo") ||
      (selectedOrder?.couponCode || "").toLowerCase().startsWith("mkt") ||
      (selectedOrder?.couponCode || "").toLowerCase().includes("promo") ||
      String(selectedOrder?.razorpayPaymentId || "").startsWith("pay_PROMO") ||
      String(selectedOrder?.razorpayOrderId || "").startsWith("order_FREE");

    let paymentIdToSend = "";

    if (isZeroOrMarketing) {
      const confirmed = await customConfirm(
        "This order was placed using a marketing / promo code (₹0 paid). No Razorpay payment was made.\n\nConfirm completing the return and closing this request without monetary refund?",
        "Complete Return (₹0 Order)"
      );
      if (!confirmed) return;
    } else if (isExplicitWallet || (orderWalletDeduction > 0 && orderRazorpayPaid <= 0)) {
      const confirmed = await customConfirm("Confirm crediting refund amount directly to customer's BacStory Wallet?", "Process Wallet Refund");
      if (!confirmed) return;
    } else if (isOrderSplit) {
      const reqEntry = (selectedOrder?.returnRequestsHistory || []).find(r => r.requestId === requestId || r._id === requestId) || selectedOrder?.returnExchange;
      const netRefund = typeof reqEntry?.refundAmount === "number" ? reqEntry.refundAmount : orderPaidAmount;
      const walletShare = Math.min(orderWalletDeduction, Math.round(netRefund * (orderWalletDeduction / orderPaidAmount)));
      const razorpayShare = Math.max(0, netRefund - walletShare);

      const existingPaymentId = selectedOrder?.razorpayPaymentId || selectedOrder?.paymentInfo?.razorpayPaymentId;
      paymentIdToSend = existingPaymentId;

      if (!paymentIdToSend) {
        const inputId = await customPrompt("Enter Razorpay Payment ID for the online payment portion:", "", "Razorpay Payment ID Required", "e.g. pay_TMzlj6hvnzLzle");
        if (!inputId || !inputId.trim()) {
          showToast("Razorpay Payment ID is required to process the online payment portion.", "error");
          return;
        }
        paymentIdToSend = inputId.trim();
      }

      const confirmed = await customConfirm(
        `Confirm Split Refund for Order #${selectedOrder?.orderId}?\n\n• ₹${walletShare.toLocaleString()} will be credited to customer's BacStory Wallet\n• ₹${razorpayShare.toLocaleString()} will be refunded to original payment method via Razorpay (Payment ID: ${paymentIdToSend})`,
        "Process Split Refund"
      );
      if (!confirmed) return;
    } else {
      const existingPaymentId = selectedOrder?.razorpayPaymentId || selectedOrder?.paymentInfo?.razorpayPaymentId;
      paymentIdToSend = existingPaymentId;

      if (!paymentIdToSend) {
        const inputId = await customPrompt("Enter Razorpay Payment ID for this order:", "", "Razorpay Payment ID Required", "e.g. pay_TMzlj6hvnzLzle");
        if (!inputId || !inputId.trim()) {
          showToast("Razorpay Payment ID is required to process refund.", "error");
          return;
        }
        paymentIdToSend = inputId.trim();
      }

      const confirmed = await customConfirm(`Are you sure you want to process and initiate the Razorpay refund (Payment ID: ${paymentIdToSend})?`, "Process Refund");
      if (!confirmed) {
        return;
      }
    }

    setActionLoading(true);
    try {
      const res = await adminFetch(`/orders/${orderDbId}/process-refund`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          razorpayPaymentId: paymentIdToSend, 
          requestId,
          isZeroRefund: isZeroOrMarketing
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(data.message || "Refund processed and completed successfully!", "success");
        if (data.data) {
          setOrders(prev => prev.map(o => (o._id === orderDbId || o.orderId === orderDbId ? data.data : o)));
          setSelectedOrder(data.data);
        } else {
          fetchOrders();
        }
      } else {
        showToast(data.message || "Failed to process refund.", "error");
      }
    } catch (error) {
      console.error("Error processing return refund:", error);
      showToast("Failed to process return refund.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteRefund = async (orderDbId) => {
    const confirmed = await customConfirm("Confirm that the refund has been credited to customer's bank account?", "Complete Refund");
    if (!confirmed) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminFetch(`/orders/${orderDbId}/refund-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refundStatus: "Refunded" })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast("Refund marked as completed & credited successfully!", "success");
        if (data.data) {
          setOrders(prev => prev.map(o => (o._id === orderDbId || o.orderId === orderDbId ? data.data : o)));
          setSelectedOrder(data.data);
        } else {
          fetchOrders();
        }
      } else {
        showToast(data.message || "Failed to update refund status.", "error");
      }
    } catch (error) {
      console.error("Error completing refund status:", error);
      showToast("Failed to update refund status.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateExchangeStatus = async (orderDbId, newStatus, requestId = null) => {
    const confirmed = await customConfirm(`Update exchange status to '${newStatus}'?`, "Update Exchange Status");
    if (!confirmed) return;
    setActionLoading(true);
    try {
      const res = await adminFetch(`/orders/${orderDbId}/exchange-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status: newStatus })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(data.message || `Exchange status updated to '${newStatus}'!`, "success");
        if (data.data) {
          setOrders(prev => prev.map(o => (o._id === orderDbId || o.orderId === orderDbId ? data.data : o)));
          setSelectedOrder(data.data);
        } else {
          fetchOrders();
        }
      } else {
        showToast(data.message || "Failed to update exchange status.", "error");
      }
    } catch (error) {
      console.error("Error updating exchange status:", error);
      showToast("Failed to update exchange status.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectReturn = async (orderDbId, requestId = null) => {
    const reason = await customPrompt("Enter rejection reason for customer (optional):", "Request does not meet return policy criteria.", "Reject Return Request", "Rejection reason...");
    if (reason === null) return;

    setActionLoading(true);
    try {
      const res = await adminFetch(`/orders/${orderDbId}/reject-return`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: reason, requestId })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast("Return request rejected successfully.", "success");
        if (data.data) {
          setOrders(prev => prev.map(o => (o._id === orderDbId || o.orderId === orderDbId ? data.data : o)));
          setSelectedOrder(data.data);
        } else {
          fetchOrders();
        }
      } else {
        showToast(data.message || "Failed to reject return request.", "error");
      }
    } catch (error) {
      console.error("Error rejecting return request:", error);
      showToast("Failed to reject return request.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteOrder = async (orderDbId) => {
    const confirmed = await customConfirm("Are you sure you want to delete this order? This action cannot be undone.", "Delete Order", "Delete", true);
    if (!confirmed) {
      return;
    }
    try {
      const res = await adminFetch(`/orders/${orderDbId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Order deleted successfully.", "success");
        setOrders(prev => prev.filter(o => o._id !== orderDbId && o.orderId !== orderDbId));
        if (selectedOrder && (selectedOrder._id === orderDbId || selectedOrder.orderId === orderDbId)) {
          setSelectedOrder(null);
        }
      } else {
        showToast(data.message || "Failed to delete order.", "error");
      }
    } catch (err) {
      console.error("Delete order error:", err);
      showToast("Failed to delete order. Please try again.", "error");
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let queryParams = [];
      if (statusFilter !== "All") {
        queryParams.push(`status=${encodeURIComponent(statusFilter)}`);
      }
      if (searchQuery.trim()) {
        queryParams.push(`search=${encodeURIComponent(searchQuery.trim())}`);
      }

      const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const res = await adminFetch(`/orders${queryString}`);
      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.data)) {
        setOrders(data.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching admin orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleStatusChange = async (orderDbId, newStatus) => {
    setUpdatingOrderId(orderDbId);
    try {
      const res = await adminFetch(`/orders/${orderDbId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`Order status updated to "${newStatus}"`, "success");
        setOrders(prev =>
          prev.map(o => (o._id === orderDbId ? { ...o, orderStatus: newStatus } : o))
        );
        if (selectedOrder && selectedOrder._id === orderDbId) {
          setSelectedOrder(prev => ({ ...prev, orderStatus: newStatus }));
        }
      } else {
        showToast(data.message || "Failed to update order status", "error");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      showToast("Error updating order status. Please try again.", "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold font-clashDisplay text-neutral-900 tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-black" />
            <span>Orders Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Pack and ship customer orders to the nearest courier partner & update fulfillment steps.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 bg-neutral-100 px-3.5 py-2 rounded-xl">
          <span>Total Orders:</span>
          <span className="bg-black text-white px-2 py-0.5 rounded-md text-xs">{orders.length}</span>
        </div>
      </div>

      {/* Controls Bar: Search & Status Filter */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Order ID, Email, Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 text-xs sm:text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-black font-medium transition-colors"
          />
        </form>

        {/* Status Filter Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">


          <div className="w-52 sm:w-60">
            <CustomSelect
              options={[
                { value: "All", label: "Filter by Status (All)" },
                { value: "Return Requested", label: "Return Requested" },
                { value: "Exchange Requested", label: "Exchange Requested" },
                ...ORDER_STATUS_STEPS.map((st) => ({ value: st, label: st })),
                { value: "Return In Progress", label: "Return In Progress" },
                { value: "Returned", label: "Returned" },
                { value: "Exchange In Progress", label: "Exchange In Progress" },
                { value: "Exchanged", label: "Exchanged" },
                { value: "Cancelled", label: "Cancelled" },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="Filter by Status"
              showPlaceholderInMenu={false}
            />
          </div>
        </div>
      </div>

      {/* Orders List Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-neutral-400">
            <Loader2 className="w-6 h-6 animate-spin text-black" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Package className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-neutral-800">No Orders Found</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              There are no orders matching your current search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Order ID & Date</th>
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4">Shipping Method</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {paginatedOrders.map((order) => {
                  const currentStatus = getOrderDisplayStatus(order);
                  const addr = order.shippingAddress || {};
                  const isUpdating = updatingOrderId === order._id;

                  return (
                    <tr key={order._id} className="hover:bg-neutral-50/60 transition-colors">
                      {/* Order ID & Date */}
                      <td className="py-4 px-4 sm:px-6 align-top">
                        <span className="font-semibold text-neutral-900 block font-mono text-sm">
                          {order.orderId}
                        </span>
                        <span className="text-[11px] text-neutral-400 flex items-center gap-1 mt-1 font-medium">
                          <Calendar className="w-3 h-3" />
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </span>

                      </td>

                      {/* Customer & Shipping Address */}
                      <td className="py-4 px-4 align-top max-w-xs">
                        <p className="font-semibold text-neutral-900">
                          {addr.firstName} {addr.lastName}
                        </p>
                        <p className="text-[11px] text-neutral-500 font-medium flex items-center gap-1 mt-0.5" title={addr.email || "No email"}>
                          <Mail className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span>
                            {addr.email
                              ? (addr.email.length > 20 ? `${addr.email.slice(0, 20)}...` : addr.email)
                              : "No email"}
                          </span>
                        </p>
                      </td>

                      {/* Items Summary */}
                      <td className="py-4 px-4 align-top max-w-xs">
                        <div className="space-y-2">
                          {order.items.slice(0, 1).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2.5">
                              <div className="relative w-9 h-9 bg-neutral-100 rounded-lg overflow-hidden shrink-0 border border-neutral-200/60">
                                <img
                                  src={getImageUrl(item.image)}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/images/landing-page/coding-tshirt.png";
                                  }}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-neutral-900 truncate">
                                  {item.name}
                                </p>
                                <p className="text-[10px] text-neutral-500 font-medium">
                                  Qty: {item.quantity} • {item.size} • {item.color}
                                </p>
                              </div>
                            </div>
                          ))}
                          {order.items.length > 1 && (
                            <span className="text-[10px] text-neutral-400 font-semibold block">
                              +{order.items.length - 1} more item(s)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Shipping Method */}
                      <td className="py-4 px-4 align-top">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border bg-white border-neutral-200 text-neutral-800 whitespace-nowrap shadow-2xs">
                          <Truck className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                          <span>{order.shippingMethod || "Standard Delivery"}</span>
                        </span>
                      </td>

                      {/* Amount & Payment */}
                      <td className="py-4 px-4 align-top">
                        <span className="font-clashDisplay text-base font-semibold text-neutral-900 block">
                          Rs {order.totalAmount ? order.totalAmount.toLocaleString() : 0}
                        </span>
                        <span className={`inline-block text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-md border ${
                          (order.paymentMethod?.toLowerCase().includes("cod") || order.paymentStatus === "COD")
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}>
                          {(order.paymentMethod?.toLowerCase().includes("cod") || order.paymentStatus === "COD") ? "Cash on Delivery" : "Prepaid"}
                        </span>
                      </td>

                      {/* Fulfillment Status Display Badge */}
                      <td className="py-4 px-4 align-top">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold border ${STATUS_BADGE_STYLES[currentStatus] || "bg-neutral-50 text-neutral-800 border-neutral-200"}`}>
                          {currentStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 align-top text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            title="Edit Order"
                            className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4 text-neutral-700" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order._id || order.orderId)}
                            title="Delete Order"
                            className="p-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-6 pb-6">
          <AdminPagination
            currentPage={activePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={orders.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh] relative space-y-6 animate-fade-in border border-neutral-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold font-clashDisplay text-neutral-900">
                  Order Details: {selectedOrder.orderId}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-full hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>



            {/* Change Order Status Section */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/60 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase block">
                  Order Status
                </span>
                <span className="text-xs font-semibold text-neutral-900 mt-0.5 block">
                  Current: <span className="text-purple-700">{getOrderDisplayStatus(selectedOrder)}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-neutral-500">Change Status:</span>
                <select
                  disabled={updatingOrderId === selectedOrder._id}
                  value={selectedOrder.orderStatus || "Placed"}
                  onChange={(e) => handleStatusChange(selectedOrder._id || selectedOrder.orderId, e.target.value)}
                  className="bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer shadow-xs"
                >
                  {ORDER_STATUS_STEPS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                  <option value="Return Requested">Return Requested</option>
                  <option value="Exchange Requested">Exchange Requested</option>
                  <option value="Return In Progress">Return In Progress</option>
                  <option value="Returned">Returned</option>
                  <option value="Exchange In Progress">Exchange In Progress</option>
                  <option value="Exchanged">Exchanged</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Status Change History / Timeline */}
            {((selectedOrder.statusTimeline && selectedOrder.statusTimeline.length > 0) || selectedOrder.createdAt) && (
              <div className="bg-neutral-50/80 p-4 rounded-2xl border border-neutral-200/60 space-y-2.5">
                <span className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase block">
                  Status Transition History
                </span>
                <div className="space-y-2">
                  {(() => {
                    const timeline = Array.isArray(selectedOrder.statusTimeline) && selectedOrder.statusTimeline.length > 0
                      ? selectedOrder.statusTimeline
                      : [
                          {
                            status: "Order Confirmed",
                            timestamp: selectedOrder.createdAt,
                            note: "Order confirmed"
                          },
                          ...(selectedOrder.orderStatus && selectedOrder.orderStatus !== "Order Confirmed"
                            ? [{
                                status: selectedOrder.orderStatus,
                                timestamp: selectedOrder.updatedAt || selectedOrder.createdAt,
                                note: "Current status"
                              }]
                            : [])
                        ];

                    return timeline.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-neutral-200/70">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="font-semibold text-neutral-900">{item.status}</span>
                          {item.note && (
                            <span className="text-[11px] text-neutral-400 hidden sm:inline">({item.note})</span>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                          {new Date(item.timestamp).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true
                          })}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Shipping Address Section */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase block">
                  Shipping Address & Method
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-white border border-neutral-200 text-neutral-800 shadow-2xs">
                  <Truck className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
                  <span>{selectedOrder.shippingMethod || "Standard Delivery"}</span>
                </span>
              </div>
              <p className="text-sm font-semibold text-neutral-900">
                {selectedOrder.shippingAddress?.firstName} {selectedOrder.shippingAddress?.lastName}
              </p>
              <p className="text-xs text-neutral-600">
                {selectedOrder.shippingAddress?.streetAddress}, {selectedOrder.shippingAddress?.city},{" "}
                {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pinCode},{" "}
                {selectedOrder.shippingAddress?.country}
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-neutral-500 pt-1 font-medium">
                <span>Phone: <strong>{selectedOrder.shippingAddress?.phoneNumber}</strong></span>
                <span>Email: <strong>{selectedOrder.shippingAddress?.email}</strong></span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              <span className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase block">
                Ordered Items ({selectedOrder.items?.length})
              </span>
              <div className="divide-y divide-neutral-100 border border-neutral-200/60 rounded-2xl overflow-hidden">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between gap-4 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 bg-neutral-100 rounded-xl overflow-hidden shrink-0 border border-neutral-200/60">
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/images/landing-page/coding-tshirt.png";
                          }}
                        />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-neutral-900">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500">
                          <span>Size: <strong>{item.size}</strong></span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            Color: <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.colorHex || '#000' }} />
                            <strong>{item.color}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-semibold text-neutral-900">{item.price}</p>
                      <p className="text-[11px] text-neutral-400 font-medium">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cancellation Info (if cancelled) */}
            {selectedOrder.cancellation?.isCancelled && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-1.5 text-xs text-red-900">
                <span className="font-semibold text-sm uppercase tracking-wider text-red-950 block">Order Cancelled</span>
                <p><strong>Reason:</strong> {selectedOrder.cancellation.cancellationReason}</p>
                <p><strong>Fee Charged:</strong> Rs {selectedOrder.cancellation.cancellationFee || 0} (Zero Cancellation Fee)</p>
                <p><strong>Refund Amount:</strong> Rs {selectedOrder.cancellation.refundAmount || selectedOrder.totalAmount} (100% Refund)</p>
              </div>
            )}
            
            {/* Return / Exchange Requests Section */}
            {(() => {
              const returnRequestsList = (Array.isArray(selectedOrder.returnRequestsHistory) && selectedOrder.returnRequestsHistory.length > 0)
                ? selectedOrder.returnRequestsHistory
                : (selectedOrder.returnExchange?.isRequested ? [selectedOrder.returnExchange] : []);

              if (returnRequestsList.length === 0) return null;

              return (
                <div className="space-y-4">
                  <span className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase block">
                    {returnRequestsList.every(r => r.requestType === "exchange") ? "Exchange Requests" : "Return & Exchange Requests"} ({returnRequestsList.length})
                  </span>

                  {returnRequestsList.map((req, reqIndex) => {
                    const isPendingAction = req.status === "Pending Verification" || req.status === "Return Requested" || req.status === "Exchange Requested";
                    const isReturn = req.requestType === "return";

                    let reqItemsSubtotal = 0;
                    if (req.requestedItems?.length > 0) {
                      req.requestedItems.forEach(ritem => {
                        const origItem = selectedOrder.items?.find(i => (i._id?.toString() === ritem.itemId || i.id === ritem.itemId || i.name === ritem.name));
                        const rawPrice = origItem ? (origItem.priceNum ?? origItem.price) : 0;
                        const unitPrice = typeof rawPrice === "number" ? rawPrice : (parseFloat(String(rawPrice || 0).replace(/[^0-9.]/g, "")) || 0);
                        const qty = ritem.returnQuantity || 1;
                        reqItemsSubtotal += (unitPrice * qty);
                      });
                    }

                    const orderPaidAmount = typeof selectedOrder.totalAmount === "number"
                      ? selectedOrder.totalAmount
                      : (parseFloat(String(selectedOrder.totalAmount ?? selectedOrder.orderTotal ?? 0).replace(/[^0-9.]/g, "")) || 0);

                    const orderOriginalSubtotal = selectedOrder.subtotal > 0
                      ? selectedOrder.subtotal
                      : (selectedOrder.items && Array.isArray(selectedOrder.items)
                          ? selectedOrder.items.reduce((s, it) => {
                              const rawP = it.priceNum ?? it.price;
                              const p = typeof rawP === "number" ? rawP : (parseFloat(String(rawP || 0).replace(/[^0-9.]/g, "")) || 0);
                              return s + (p * (it.quantity || 1));
                            }, 0)
                          : orderPaidAmount);

                    const paidRatio = orderOriginalSubtotal > 0 ? Math.min(1, Math.max(0, orderPaidAmount / orderOriginalSubtotal)) : 0;
                    const effectivePaidForReturned = orderPaidAmount === 0
                      ? 0
                      : Math.min(orderPaidAmount, Math.round(reqItemsSubtotal * paidRatio));

                    const isZeroOrMarketing = orderPaidAmount <= 0 ||
                      (selectedOrder.paymentMethod || "").toLowerCase().includes("marketing") ||
                      (selectedOrder.paymentMethod || "").toLowerCase().includes("promo") ||
                      (selectedOrder.couponCode || "").toLowerCase().startsWith("mkt") ||
                      (selectedOrder.couponCode || "").toLowerCase().includes("promo") ||
                      String(selectedOrder.razorpayPaymentId || "").startsWith("pay_PROMO") ||
                      String(selectedOrder.razorpayOrderId || "").startsWith("order_FREE");

                    const normalizedReqReason = (req.reason || "").toLowerCase();
                    const isFeeApplicableReason = normalizedReqReason.includes("mind") || normalizedReqReason === "other" || normalizedReqReason.startsWith("other");
                    const reqShippingFee = typeof req.returnShippingFee === "number" ? req.returnShippingFee : (isFeeApplicableReason ? 99 : 0);
                    const reqNetRefund = isZeroOrMarketing 
                      ? 0 
                      : (typeof req.refundAmount === "number" ? req.refundAmount : Math.max(0, effectivePaidForReturned - reqShippingFee));

                    const orderWalletDeduction = typeof selectedOrder.walletDeduction === "number"
                      ? selectedOrder.walletDeduction
                      : (parseFloat(String(selectedOrder.walletDeduction || 0).replace(/[^0-9.]/g, "")) || 0);
                    const orderRazorpayPaid = Math.max(0, orderPaidAmount - orderWalletDeduction);
                    const isOrderSplit = orderWalletDeduction > 0 && orderRazorpayPaid > 0 && orderPaidAmount > 0;
                    const isExplicitWallet = (req.refundMethod || "").toLowerCase().includes("wallet") && !(req.refundMethod || "").toLowerCase().includes("original");

                    let reqWalletPortion = 0;
                    let reqRazorpayPortion = 0;
                    if (isExplicitWallet) {
                      reqWalletPortion = reqNetRefund;
                      reqRazorpayPortion = 0;
                    } else if (isOrderSplit) {
                      reqWalletPortion = Math.min(orderWalletDeduction, Math.round(reqNetRefund * (orderWalletDeduction / orderPaidAmount)));
                      reqRazorpayPortion = Math.max(0, reqNetRefund - reqWalletPortion);
                    } else if (orderWalletDeduction > 0 && orderRazorpayPaid <= 0) {
                      reqWalletPortion = reqNetRefund;
                      reqRazorpayPortion = 0;
                    } else {
                      reqWalletPortion = 0;
                      reqRazorpayPortion = reqNetRefund;
                    }

                    const reqPayoutMethod = isZeroOrMarketing 
                      ? "None (₹0 / Marketing Order)" 
                      : (isOrderSplit && !isExplicitWallet
                          ? `Original Payment Method (Split: ₹${reqWalletPortion.toLocaleString()} Wallet + ₹${reqRazorpayPortion.toLocaleString()} Razorpay)`
                          : (req.refundMethod || selectedOrder.refundDetails?.refundMethod || "Original Payment Method"));
                    const reqBankHolder = req.bankHolderName || selectedOrder.refundDetails?.bankHolderName || "";
                    const reqAccountNumber = req.accountNumber || selectedOrder.refundDetails?.accountNumber || "";
                    const reqIfscCode = req.ifscCode || selectedOrder.refundDetails?.ifscCode || "";
                    const reqUpiId = req.upiId || selectedOrder.refundDetails?.upiId || "";

                    const isOrderAlreadyRefunded = selectedOrder.refundDetails?.refundStatus === "Refunded" || selectedOrder.returnExchange?.status === "Refunded" || selectedOrder.orderStatus === "Returned";
                    const reqActualStatus = (req.status === "Product Received" && isOrderAlreadyRefunded)
                      ? "Refunded"
                      : (req.status || "Return Requested");

                    return (
                      <div key={req._id || req.requestId || reqIndex} className={`${isPendingAction ? "bg-purple-50/30 border border-purple-200/50" : "bg-neutral-50 border border-neutral-200/60"} p-4 rounded-2xl space-y-3 transition-colors`}>
                        <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2">
                          <span className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase block">
                            {isReturn ? `Return Request #${reqIndex + 1}` : `Exchange Request #${reqIndex + 1}`}
                          </span>

                          {!isReturn && (req.status === "Approved" || req.status === "Exchange Approved" || req.status === "Return Approved") ? (
                            <button
                              onClick={() => handleMarkProductReceived(selectedOrder._id || selectedOrder.orderId, req.requestId || req._id)}
                              disabled={actionLoading}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackageCheck className="w-3.5 h-3.5" />}
                              Mark Product Picked Up
                            </button>
                          ) : !isReturn && (req.status === "Product Picked Up" || req.status === "Product Received") ? (
                            <button
                              onClick={() => handleUpdateExchangeStatus(selectedOrder._id || selectedOrder.orderId, "Replacement Ready to Pack & Ship", req.requestId || req._id)}
                              disabled={actionLoading}
                              className="bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5" />}
                              Mark Ready to Pack & Ship
                            </button>
                          ) : !isReturn && (req.status === "Replacement Ready to Pack & Ship") ? (
                            <button
                              onClick={() => handleUpdateExchangeStatus(selectedOrder._id || selectedOrder.orderId, "Replacement Dispatched", req.requestId || req._id)}
                              disabled={actionLoading}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                              Mark Replacement Dispatched
                            </button>
                          ) : !isReturn && (req.status === "Replacement Dispatched") ? (
                            <button
                              onClick={() => handleUpdateExchangeStatus(selectedOrder._id || selectedOrder.orderId, "Exchange Completed", req.requestId || req._id)}
                              disabled={actionLoading}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              Mark Exchange Completed
                            </button>
                          ) : isPendingAction ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApproveReturn(selectedOrder._id || selectedOrder.orderId, req.requestId || req._id)}
                                disabled={actionLoading}
                                title="Approve Request"
                                className="cursor-pointer hover:opacity-80 transition-opacity p-0.5"
                              >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3] text-emerald-600" />}
                              </button>
                              <button
                                onClick={() => handleRejectReturn(selectedOrder._id || selectedOrder.orderId, req.requestId || req._id)}
                                disabled={actionLoading}
                                title="Reject Request"
                                className="cursor-pointer hover:opacity-80 transition-opacity p-0.5"
                              >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 stroke-[3] text-red-600" />}
                              </button>
                            </div>
                          ) : (
                            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${reqActualStatus === "Approved" || reqActualStatus === "Return Approved" || reqActualStatus === "Exchange Approved" || reqActualStatus === "Exchange Completed" || reqActualStatus === "Refunded"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : reqActualStatus === "Product Picked Up" || reqActualStatus === "Product Received" || reqActualStatus === "Replacement Ready to Pack & Ship" || reqActualStatus === "Replacement Dispatched"
                                ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                                : reqActualStatus === "Rejected"
                                  ? "bg-red-100 text-red-800 border border-red-200"
                                  : "bg-neutral-200 text-neutral-800 border border-neutral-300"
                              }`}>
                              {reqActualStatus}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-600"><strong className="font-semibold text-neutral-900">Reason:</strong> {req.reason}</p>
                        {req.additionalNotes && (
                          <p className="text-xs text-neutral-600"><strong className="font-semibold text-neutral-900">Notes:</strong> {req.additionalNotes}</p>
                        )}

                        {/* Requested Return Items */}
                        {req.requestedItems?.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-neutral-200/60">
                            <span className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase block">
                              Items to {isReturn ? "Return" : "Exchange"} (Original):
                            </span>
                            <div className="space-y-1.5">
                              {req.requestedItems.map((ritem, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs bg-white p-3 rounded-xl border border-neutral-200/80 font-medium">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-neutral-900">{ritem.name}</span>
                                    <span className="text-neutral-500">({ritem.size} / {ritem.color})</span>
                                  </div>
                                  <span className="font-semibold text-neutral-900 bg-neutral-100 px-2.5 py-0.5 rounded-md text-xs border border-neutral-200/60">
                                    Qty: {ritem.returnQuantity || 1}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Requested Replacement Preference Box for Exchange */}
                        {!isReturn && (
                          <div className="bg-purple-50 p-3 rounded-xl border border-purple-200/80 space-y-1.5 text-xs text-purple-950">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">Requested Replacement Preference:</span>
                            <div className="flex items-center justify-between font-medium">
                              <span>Replacement Variant:</span>
                              <span className="font-bold text-purple-900 bg-white px-2.5 py-0.5 rounded border border-purple-200">
                                Size: {req.requestedSize || selectedOrder.returnExchange?.requestedSize || "N/A"}{(req.requestedColor || selectedOrder.returnExchange?.requestedColor) ? ` | Color: ${req.requestedColor || selectedOrder.returnExchange?.requestedColor}` : ""}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Mandatory Unboxing Video for Damaged/Wrong Item */}
                        {req.unboxingVideo && (
                          <div className="bg-white p-3.5 rounded-xl border border-neutral-200/80 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Video className="w-3.5 h-3.5 text-neutral-600" />
                                <span className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase block">
                                  Unboxing Video Proof:
                                </span>
                              </div>
                              <a
                                href={getImageUrl(req.unboxingVideo)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-indigo-600 underline font-medium hover:text-indigo-800"
                              >
                                <span>Open in new tab</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>

                            <div className="rounded-xl overflow-hidden bg-black border border-neutral-200">
                              <video
                                controls
                                playsInline
                                preload="metadata"
                                className="w-full max-h-64 object-contain bg-black"
                                src={getImageUrl(req.unboxingVideo)}
                              >
                                Your browser does not support the video tag.
                              </video>
                            </div>
                            <p className="text-[10px] text-neutral-400 truncate">
                              Source: {decodeURIComponent(req.unboxingVideo.split("/").pop() || "")}
                            </p>
                          </div>
                        )}

                        {/* Proof Photos */}
                        {req.proofPhotos?.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase block">Uploaded Proof Photos:</span>
                            <div className="flex items-center gap-2 overflow-x-auto">
                              {req.proofPhotos.map((img, idx) => (
                                <a key={idx} href={getImageUrl(img)} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                  <img
                                    src={getImageUrl(img)}
                                    alt={`Proof photo ${idx + 1}`}
                                    className="w-14 h-14 object-cover rounded-xl border border-neutral-200/80 bg-neutral-100"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                                    }}
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Refund Details & Breakdown for this specific return request */}
                        {isReturn && (
                          <div className="bg-white p-3.5 rounded-xl border border-neutral-200/80 space-y-2 text-xs">
                            <div className="border-b border-neutral-200/60 pb-1.5 flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase">
                                Refund Details
                              </span>
                              <span className="text-[11px] font-semibold text-neutral-600">
                                Payout: <span className="text-neutral-900 font-medium">{reqPayoutMethod}</span>
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-neutral-600 font-medium">
                              <span>Returned Items Subtotal</span>
                              <span className="font-semibold text-neutral-900">
                                Rs {reqItemsSubtotal.toLocaleString()}
                              </span>
                            </div>

                            {reqItemsSubtotal > effectivePaidForReturned && (
                              <div className="flex items-center justify-between text-emerald-600 text-[11px] font-medium">
                                <span>Promo / Discount Applied</span>
                                <span className="font-semibold">- Rs {(reqItemsSubtotal - effectivePaidForReturned).toLocaleString()}</span>
                              </div>
                            )}

                            {isZeroOrMarketing && (
                              <div className="flex items-center justify-between text-neutral-600 font-medium">
                                <span>Amount Paid for Items</span>
                                <span className="font-semibold text-neutral-900">Rs 0</span>
                              </div>
                            )}

                            {reqShippingFee > 0 && (
                              <div className="flex items-center justify-between text-neutral-600 font-medium">
                                <span>Return Shipping Fee</span>
                                <span className="font-semibold text-neutral-900">
                                  - Rs {reqShippingFee}
                                </span>
                              </div>
                            )}

                            <div className="border-t border-neutral-200/80 pt-2 flex items-center justify-between font-semibold text-neutral-900 text-xs sm:text-sm">
                              <span className="font-semibold text-neutral-900">Net Refund Amount</span>
                              <span className="font-semibold text-neutral-900 text-sm sm:text-base font-mono">
                                Rs {reqNetRefund.toLocaleString()}
                              </span>
                            </div>

                            {/* Split Refund Distribution Details */}
                            {isOrderSplit && !isExplicitWallet && !isZeroOrMarketing && (
                              <div className="bg-indigo-50/80 border border-indigo-200/80 p-2.5 rounded-xl space-y-1.5 text-xs text-indigo-950 font-medium">
                                <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                                  <span>Split Refund Distribution</span>
                                  <span className="text-indigo-600 font-mono text-[10px]">2-Way Split</span>
                                </div>
                                <div className="flex items-center justify-between text-neutral-700">
                                  <span>BacStory Wallet Credit:</span>
                                  <span className="font-bold text-emerald-700 font-mono">Rs {reqWalletPortion.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between text-neutral-700">
                                  <span>Razorpay (Original Card/UPI):</span>
                                  <span className="font-bold text-indigo-700 font-mono">Rs {reqRazorpayPortion.toLocaleString()}</span>
                                </div>
                              </div>
                            )}

                            {isZeroOrMarketing && (
                              <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200/80 font-medium leading-relaxed">
                                No Razorpay refund required as this order was placed with 100% discount via Marketing / Promo Code (₹0 paid).
                              </div>
                            )}

                            {/* Payout Credentials */}
                            {!isZeroOrMarketing && (reqPayoutMethod === "Bank Transfer" || (reqBankHolder && reqAccountNumber)) && (
                              <div className="pt-2 border-t border-neutral-200/60 text-xs text-neutral-700 space-y-1">
                                <p className="font-semibold text-neutral-900 text-[11px] uppercase tracking-wider">Bank Details:</p>
                                <p><strong>Account Holder:</strong> {reqBankHolder || "N/A"}</p>
                                <p><strong>Account Number:</strong> {reqAccountNumber || "N/A"}</p>
                                <p><strong>IFSC Code:</strong> {reqIfscCode || "N/A"}</p>
                              </div>
                            )}

                            {!isZeroOrMarketing && (reqPayoutMethod === "UPI" || (reqUpiId && reqPayoutMethod !== "Bank Transfer")) && (
                              <div className="pt-2 border-t border-neutral-200/60 text-xs text-neutral-700 space-y-1">
                                <p className="font-semibold text-neutral-900 text-[11px] uppercase tracking-wider">UPI Details:</p>
                                <p><strong>UPI ID:</strong> {reqUpiId || "N/A"}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Admin Action Buttons matching exact 7-stage return table workflow */}
                        {(() => {
                          const retStatus = reqActualStatus;

                          if (retStatus === "Return Approved" || retStatus === "Approved") {
                            return (
                              <div className="pt-3 border-t border-neutral-200/60 flex items-center justify-between gap-3">
                                <span className="text-xs text-neutral-800 font-medium">Next Action: <strong>Product Pickup & Receipt</strong></span>
                                <button
                                  onClick={() => handleMarkProductReceived(selectedOrder._id || selectedOrder.orderId, req.requestId || req._id)}
                                  disabled={actionLoading}
                                  className="bg-neutral-900 hover:bg-black disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                                >
                                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                                  <span>Mark Product Received by Seller</span>
                                </button>
                              </div>
                            );
                          }

                          if (retStatus === "Product Received") {
                            return (
                              <div className="pt-3 border-t border-neutral-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <span className="text-xs text-neutral-800 font-medium">
                                  Next Action: <strong>{isZeroOrMarketing ? "Complete Return" : (isOrderSplit && !isExplicitWallet ? "Split Refund Processing" : "Refund Processing")}</strong>
                                </span>
                                <button
                                  onClick={() => handleProcessReturnRefund(selectedOrder._id || selectedOrder.orderId, req.requestId || req._id)}
                                  disabled={actionLoading}
                                  className={`${isZeroOrMarketing ? "bg-neutral-900 hover:bg-black" : "bg-emerald-600 hover:bg-emerald-700"} disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer whitespace-nowrap shrink-0`}
                                >
                                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isZeroOrMarketing ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <CreditCard className="w-4 h-4" />)}
                                  <span>
                                    {isZeroOrMarketing 
                                      ? "Complete Return (₹0 Order)" 
                                      : (isOrderSplit && !isExplicitWallet)
                                        ? `Initiate Split Refund (₹${reqWalletPortion.toLocaleString()} Wallet + ₹${reqRazorpayPortion.toLocaleString()} Razorpay)`
                                        : `Initiate Refund (Rs ${reqNetRefund.toLocaleString()})`}
                                  </span>
                                </button>
                              </div>
                            );
                          }

                          if (retStatus === "Refund Initiated") {
                            const isSplit = (isOrderSplit && !isExplicitWallet) || (req.walletRefundAmount > 0 && req.razorpayRefundAmount > 0);
                            const wPortion = req.walletRefundAmount || selectedOrder.refundDetails?.walletRefundAmount || reqWalletPortion;
                            const rPortion = req.razorpayRefundAmount || selectedOrder.refundDetails?.razorpayRefundAmount || reqRazorpayPortion;

                            return (
                              <div className="pt-3 border-t border-neutral-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-amber-800 flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>
                                      {isSplit
                                        ? `Split Refund: Rs ${wPortion.toLocaleString()} Wallet Credited | Rs ${rPortion.toLocaleString()} Razorpay Processing (5-7 Days)`
                                        : "Razorpay Refund Processing (Auto-syncs upon settlement)"}
                                    </span>
                                  </span>
                                  {isSplit && (
                                    <p className="text-[11px] text-neutral-500 pl-5.5">
                                      Wallet portion credited instantly. Razorpay refund is in transit to customer's bank account.
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() => handleCompleteRefund(selectedOrder._id || selectedOrder.orderId)}
                                    disabled={actionLoading}
                                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                                    title="Mark refund settled and completed once bank deposit is confirmed"
                                  >
                                    {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                    <span>Mark Settled</span>
                                  </button>
                                  <span className="w-fit whitespace-nowrap bg-amber-100 text-amber-900 font-semibold px-2.5 py-1 rounded-full uppercase text-[10px] tracking-wider border border-amber-200/60">
                                    Refund Processing
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          if (retStatus === "Refunded") {
                            const isWallet = (req.refundMethod || selectedOrder.refundDetails?.refundMethod || selectedOrder.returnExchange?.refundMethod || "").toLowerCase().includes("wallet") ||
                              (selectedOrder.paymentMethod || "").toLowerCase().includes("wallet");
                            const hasSplitDetails = (selectedOrder.refundDetails?.walletRefundAmount > 0 && selectedOrder.refundDetails?.razorpayRefundAmount > 0) ||
                              (req.walletRefundAmount > 0 && req.razorpayRefundAmount > 0) ||
                              (isOrderSplit && !isExplicitWallet);
                            const wPortion = req.walletRefundAmount || selectedOrder.refundDetails?.walletRefundAmount || reqWalletPortion;
                            const rPortion = req.razorpayRefundAmount || selectedOrder.refundDetails?.razorpayRefundAmount || reqRazorpayPortion;

                            return (
                              <div className="pt-3 border-t border-neutral-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span>
                                    {isZeroOrMarketing 
                                      ? "Return Completed & Closed (₹0 Order)" 
                                      : hasSplitDetails
                                        ? `Split Refund Processed (₹${wPortion.toLocaleString()} Wallet + ₹${rPortion.toLocaleString()} Razorpay)`
                                        : isWallet
                                          ? "Wallet Refund Processed & Credited"
                                          : "Razorpay Refund Processed & Credited"}
                                  </span>
                                </span>
                                <span className="w-fit bg-emerald-100 text-emerald-800 font-semibold px-3 py-1 rounded-full uppercase shrink-0">
                                  {isZeroOrMarketing ? "Completed" : "Refunded"}
                                </span>
                              </div>
                            );
                          }

                          return null;
                        })()}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Standalone Refund Details & Calculation (when no return requests list exists) */}
            {(!selectedOrder.returnRequestsHistory || selectedOrder.returnRequestsHistory.length === 0) && selectedOrder.refundDetails && selectedOrder.refundDetails.refundMethod !== "None" && (() => {
              const isCancelled = selectedOrder.cancellation?.isCancelled || selectedOrder.orderStatus === "Cancelled";
              const reqReason = selectedOrder.returnExchange?.reason || "";
              const normalizedReqReason = (reqReason || "").toLowerCase();
              const isFeeApplicableReason = normalizedReqReason.includes("mind") || normalizedReqReason === "other" || normalizedReqReason.startsWith("other");

              const returnShippingFee = (isCancelled || !isFeeApplicableReason)
                ? 0
                : (typeof selectedOrder.returnExchange?.returnShippingFee === "number"
                  ? selectedOrder.returnExchange.returnShippingFee
                  : 99);

              const orderGrossTotal = selectedOrder.totalAmount || selectedOrder.subtotal || 0;

              let returnItemsSubtotal = 0;
              if (!isCancelled && selectedOrder.returnExchange?.requestedItems?.length > 0) {
                selectedOrder.returnExchange.requestedItems.forEach(ritem => {
                  const origItem = selectedOrder.items?.find(i => (i._id?.toString() === ritem.itemId || i.id === ritem.itemId || i.name === ritem.name));
                  const rawPrice = origItem ? origItem.price : (orderGrossTotal / (selectedOrder.items?.length || 1));
                  const unitPrice = typeof rawPrice === "number" ? rawPrice : (parseFloat(String(rawPrice).replace(/[^0-9.]/g, "")) || 0);
                  const qty = ritem.returnQuantity || 1;
                  returnItemsSubtotal += (unitPrice * qty);
                });
              }

              const orderPaidAmount = typeof selectedOrder.totalAmount === "number"
                ? selectedOrder.totalAmount
                : (parseFloat(String(selectedOrder.totalAmount ?? selectedOrder.orderTotal ?? 0).replace(/[^0-9.]/g, "")) || 0);

              const orderOriginalSubtotal = selectedOrder.subtotal > 0
                ? selectedOrder.subtotal
                : (selectedOrder.items && Array.isArray(selectedOrder.items)
                    ? selectedOrder.items.reduce((s, it) => {
                        const rawP = it.priceNum ?? it.price;
                        const p = typeof rawP === "number" ? rawP : (parseFloat(String(rawP || 0).replace(/[^0-9.]/g, "")) || 0);
                        return s + (p * (it.quantity || 1));
                      }, 0)
                    : orderPaidAmount);

              const paidRatio = orderOriginalSubtotal > 0 ? Math.min(1, Math.max(0, orderPaidAmount / orderOriginalSubtotal)) : 0;
              const effectivePaidForReturned = orderPaidAmount === 0
                ? 0
                : Math.min(orderPaidAmount, Math.round(returnItemsSubtotal * paidRatio));

              const refundBaseSubtotal = isCancelled
                ? (selectedOrder.cancellation?.refundAmount || orderPaidAmount)
                : (returnItemsSubtotal > 0 ? effectivePaidForReturned : orderPaidAmount);

              const netRefundAmount = typeof selectedOrder.refundDetails?.refundAmount === "number"
                ? selectedOrder.refundDetails.refundAmount
                : Math.max(0, refundBaseSubtotal - returnShippingFee);

              return (
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/60 space-y-3">
                  <div className="border-b border-neutral-200/60 pb-2">
                    <span className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase block">
                      Refund Details
                    </span>
                  </div>

                  {/* Calculation Breakdown Box */}
                  <div className="bg-white p-3.5 rounded-xl border border-neutral-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-neutral-600 font-medium">
                      <span>{isCancelled ? "Order Total Paid" : "Returned Items Subtotal"}</span>
                      <span className="font-semibold text-neutral-900">
                        Rs {(isCancelled ? orderGrossTotal : (returnItemsSubtotal > 0 ? returnItemsSubtotal : (netRefundAmount + returnShippingFee))).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-neutral-600 font-medium">
                      <span>Return Shipping Fee</span>
                      <span className="font-semibold text-neutral-900">
                        {returnShippingFee === 0 ? "Rs 0" : `- Rs ${returnShippingFee}`}
                      </span>
                    </div>

                    <div className="border-t border-neutral-200/80 pt-2 flex items-center justify-between font-semibold text-neutral-900 text-xs sm:text-sm">
                      <span className="font-semibold text-neutral-900">Net Refund Amount</span>
                      <span className="font-semibold text-neutral-900 text-sm sm:text-base font-mono">
                        Rs {netRefundAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Payout Credentials */}
                  <div className="text-xs text-neutral-600 pt-0.5">
                    <p><strong className="font-semibold text-neutral-900">Payout Method:</strong> <span className="text-neutral-700">{selectedOrder.refundDetails.refundMethod || "Original Payment Method"}</span></p>
                    {selectedOrder.refundDetails.refundMethod === "Bank Transfer" && (
                      <div className="mt-2 space-y-1 pl-1 border-l-2 border-neutral-200 text-neutral-700">
                        <p><strong>Account Holder:</strong> {selectedOrder.refundDetails.bankHolderName || "N/A"}</p>
                        <p><strong>Account Number:</strong> {selectedOrder.refundDetails.accountNumber || "N/A"}</p>
                        <p><strong>IFSC Code:</strong> {selectedOrder.refundDetails.ifscCode || "N/A"}</p>
                      </div>
                    )}
                    {selectedOrder.refundDetails.refundMethod === "UPI" && (
                      <p className="mt-1"><strong>UPI ID:</strong> {selectedOrder.refundDetails.upiId || "N/A"}</p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Footer Buttons */}
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-neutral-900 text-white rounded-xl px-6 py-2.5 text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation / Prompt / Alert Popup Modal */}
      <CustomConfirmModal modalData={popupModal} />
    </div>
  );
}
