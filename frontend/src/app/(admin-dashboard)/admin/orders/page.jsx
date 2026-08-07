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
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  ChevronDown,
  RotateCcw
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { getImageUrl, API_BASE_URL } from "@/lib/api";
import CustomSelect from "@/components/ui/CustomSelect";

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
  "Return In Progress": "bg-purple-50 text-purple-800 border-purple-200",
  "Cancelled": "bg-red-50 text-red-700 border-red-200",
  "Returned": "bg-neutral-100 text-neutral-700 border-neutral-300"
};

export default function AdminOrdersPage() {
  const { adminFetch } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleApproveReturn = async (orderDbId) => {
    if (!confirm("Are you sure you want to approve this return request?")) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminFetch(`/orders/${orderDbId}/approve-return`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();

      if (res.ok && data.success) {
        alert(data.message || "Return request approved successfully!");
        if (data.data) {
          setOrders(prev => prev.map(o => (o._id === orderDbId || o.orderId === orderDbId ? data.data : o)));
          setSelectedOrder(data.data);
        } else {
          fetchOrders();
        }
      } else {
        alert(data.message || "Failed to approve return request.");
      }
    } catch (error) {
      console.error("Error approving return request:", error);
      alert("Failed to approve return request.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkProductReceived = async (orderDbId) => {
    if (!confirm("Confirm that the returned product has been picked up and received by seller?")) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminFetch(`/orders/${orderDbId}/product-received`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();

      if (res.ok && data.success) {
        alert(data.message || "Product marked as received! You can now process the refund.");
        if (data.data) {
          setOrders(prev => prev.map(o => (o._id === orderDbId || o.orderId === orderDbId ? data.data : o)));
          setSelectedOrder(data.data);
        } else {
          fetchOrders();
        }
      } else {
        alert(data.message || "Failed to mark product received.");
      }
    } catch (error) {
      console.error("Error marking product received:", error);
      alert("Failed to mark product received.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessReturnRefund = async (orderDbId) => {
    const existingPaymentId = selectedOrder?.razorpayPaymentId || selectedOrder?.paymentInfo?.razorpayPaymentId;
    let paymentIdToSend = existingPaymentId;

    if (!paymentIdToSend) {
      const inputId = prompt("Enter Razorpay Payment ID for this order (e.g. pay_TMzlj6hvnzLzle):");
      if (!inputId || !inputId.trim()) {
        alert("Razorpay Payment ID is required to process refund.");
        return;
      }
      paymentIdToSend = inputId.trim();
    }

    if (!confirm(`Are you sure you want to process and initiate the Razorpay refund (Payment ID: ${paymentIdToSend})?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminFetch(`/orders/${orderDbId}/process-refund`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ razorpayPaymentId: paymentIdToSend })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        alert(data.message || "Razorpay refund processed and completed successfully!");
        if (data.data) {
          setOrders(prev => prev.map(o => (o._id === orderDbId || o.orderId === orderDbId ? data.data : o)));
          setSelectedOrder(data.data);
        } else {
          fetchOrders();
        }
      } else {
        alert(data.message || "Failed to process refund.");
      }
    } catch (error) {
      console.error("Error processing return refund:", error);
      alert("Failed to process return refund.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteRefund = async (orderDbId) => {
    if (!confirm("Confirm that the refund has been credited to customer's bank account (Stage 7)?")) {
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
        alert("Refund marked as completed & credited successfully!");
        if (data.data) {
          setOrders(prev => prev.map(o => (o._id === orderDbId || o.orderId === orderDbId ? data.data : o)));
          setSelectedOrder(data.data);
        } else {
          fetchOrders();
        }
      } else {
        alert(data.message || "Failed to update refund status.");
      }
    } catch (error) {
      console.error("Error completing refund status:", error);
      alert("Failed to update refund status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectReturn = async (orderDbId) => {
    const reason = prompt("Enter rejection reason (optional):", "Request does not meet return policy criteria.");
    if (reason === null) return;

    setActionLoading(true);
    try {
      const res = await adminFetch(`/orders/${orderDbId}/reject-return`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: reason })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        alert("Return request rejected successfully.");
        if (data.data) {
          setOrders(prev => prev.map(o => (o._id === orderDbId || o.orderId === orderDbId ? data.data : o)));
          setSelectedOrder(data.data);
        } else {
          fetchOrders();
        }
      } else {
        alert(data.message || "Failed to reject return request.");
      }
    } catch (error) {
      console.error("Error rejecting return request:", error);
      alert("Failed to reject return request.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteOrder = async (orderDbId) => {
    if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      return;
    }
    try {
      const res = await adminFetch(`/orders/${orderDbId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(prev => prev.filter(o => o._id !== orderDbId && o.orderId !== orderDbId));
        if (selectedOrder && (selectedOrder._id === orderDbId || selectedOrder.orderId === orderDbId)) {
          setSelectedOrder(null);
        }
      } else {
        alert(data.message || "Failed to delete order.");
      }
    } catch (err) {
      console.error("Delete order error:", err);
      alert("Failed to delete order. Please try again.");
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
        setOrders(prev =>
          prev.map(o => (o._id === orderDbId ? { ...o, orderStatus: newStatus } : o))
        );
        if (selectedOrder && selectedOrder._id === orderDbId) {
          setSelectedOrder(prev => ({ ...prev, orderStatus: newStatus }));
        }
      } else {
        alert(data.message || "Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Error updating order status. Please try again.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-clashDisplay text-neutral-900 tracking-tight flex items-center gap-2.5">
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
                ...ORDER_STATUS_STEPS.map((st) => ({ value: st, label: st })),
                { value: "Cancelled", label: "Cancelled" },
                { value: "Returned", label: "Returned" },
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
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map((order) => {
                  const currentStatus = order.orderStatus || "Order Confirmed";
                  const addr = order.shippingAddress || {};
                  const isUpdating = updatingOrderId === order._id;

                  return (
                    <tr key={order._id} className="hover:bg-neutral-50/60 transition-colors">
                      {/* Order ID & Date */}
                      <td className="py-4 px-4 sm:px-6 align-top">
                        <span className="font-bold text-neutral-900 block font-mono text-sm">
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
                                <Image
                                  src={getImageUrl(item.image)}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
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

                      {/* Amount & Payment */}
                      <td className="py-4 px-4 align-top">
                        <span className="font-clashDisplay text-base font-semibold text-neutral-900 block">
                          Rs {order.totalAmount ? order.totalAmount.toLocaleString() : 0}
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
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh] relative space-y-6 animate-fade-in border border-neutral-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold font-clashDisplay text-neutral-900">
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
                <span className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase block">
                  Order Status
                </span>
                <span className="text-xs font-bold text-neutral-900 mt-0.5 block">
                  Current: <span className="text-purple-700">{selectedOrder.orderStatus || "Placed"}</span>
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
                  <option value="Return In Progress">Return In Progress</option>
                  <option value="Returned">Returned</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Shipping Address Section */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/60 space-y-2">
              <span className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase block">
                Shipping Address
              </span>
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
              <span className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase block">
                Ordered Items ({selectedOrder.items?.length})
              </span>
              <div className="divide-y divide-neutral-100 border border-neutral-200/60 rounded-2xl overflow-hidden">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between gap-4 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 bg-neutral-100 rounded-xl overflow-hidden shrink-0 border border-neutral-200/60">
                        <Image
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          fill
                          className="object-cover"
                          unoptimized
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
                      <p className="text-xs sm:text-sm font-bold text-neutral-900">{item.price}</p>
                      <p className="text-[11px] text-neutral-400 font-medium">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cancellation Info (if cancelled) */}
            {selectedOrder.cancellation?.isCancelled && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-1.5 text-xs text-red-900">
                <span className="font-bold text-sm uppercase tracking-wider text-red-950 block">Order Cancelled</span>
                <p><strong>Reason:</strong> {selectedOrder.cancellation.cancellationReason}</p>
                <p><strong>Fee Charged:</strong> Rs {selectedOrder.cancellation.cancellationFee || 0} (Zero Cancellation Fee)</p>
                <p><strong>Refund Amount:</strong> Rs {selectedOrder.cancellation.refundAmount || selectedOrder.totalAmount} (100% Refund)</p>
              </div>
            )}

            {/* Return / Exchange Request Details (if requested) */}
            {selectedOrder.returnExchange?.isRequested && (() => {
              const reqReason = selectedOrder.returnExchange?.reason || "";
              const isFreeShippingReason = [
                "Defective or damaged product",
                "Received wrong item",
                "Parcel received with missing items",
                "Item damaged during transit"
              ].includes(reqReason);

              const returnShippingFee = isFreeShippingReason
                ? 0
                : (typeof selectedOrder.returnExchange?.returnShippingFee === "number"
                  ? selectedOrder.returnExchange.returnShippingFee
                  : 99);

              const orderGrossTotal = selectedOrder.totalAmount || selectedOrder.subtotal || 0;
              const netRefundAmount = Math.max(0, orderGrossTotal - returnShippingFee);

              return (
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 space-y-3 text-xs text-purple-950">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm uppercase tracking-wider text-purple-950">
                      {selectedOrder.returnExchange.requestType === "return" ? "Return Request" : "Exchange Request"}
                    </span>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${selectedOrder.returnExchange.status === "Approved"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : selectedOrder.returnExchange.status === "Rejected"
                        ? "bg-red-100 text-red-800 border border-red-200"
                        : "bg-amber-100 text-amber-900 border border-amber-200"
                      }`}>
                      {selectedOrder.returnExchange.status}
                    </span>
                  </div>
                  <p><strong>Reason:</strong> {selectedOrder.returnExchange.reason}</p>
                  {selectedOrder.returnExchange.additionalNotes && (
                    <p><strong>Notes:</strong> {selectedOrder.returnExchange.additionalNotes}</p>
                  )}

                  {/* Requested Return Items */}
                  {selectedOrder.returnExchange.requestedItems?.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-purple-200/60">
                      <span className="font-semibold text-purple-900 block text-xs uppercase tracking-wider">
                        Requested {selectedOrder.returnExchange.requestType === "exchange" ? "Exchange" : "Return"} Items:
                      </span>
                      <div className="space-y-1">
                        {selectedOrder.returnExchange.requestedItems.map((ritem, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded-xl border border-purple-100 font-medium">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-neutral-900">{ritem.name}</span>
                              <span className="text-neutral-500">({ritem.size} / {ritem.color})</span>
                            </div>
                            <span className="font-bold text-purple-950 bg-purple-100 px-2 py-0.5 rounded-md">
                              Qty: {ritem.returnQuantity || 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mandatory Unboxing Video Link for Damaged/Wrong Item */}
                  {selectedOrder.returnExchange.unboxingVideo && (
                    <div className="bg-white p-2.5 rounded-xl border border-purple-200 space-y-1">
                      <span className="font-semibold text-purple-900 block">Unboxing Video Proof:</span>
                      <a
                        href={getImageUrl(selectedOrder.returnExchange.unboxingVideo)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 underline font-medium break-all text-xs hover:text-indigo-800"
                      >
                        {selectedOrder.returnExchange.unboxingVideo}
                      </a>
                    </div>
                  )}

                  {/* Proof Photos */}
                  {selectedOrder.returnExchange.proofPhotos?.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="font-semibold text-purple-900 block">Uploaded Proof Photos:</span>
                      <div className="flex items-center gap-2 overflow-x-auto">
                        {selectedOrder.returnExchange.proofPhotos.map((img, idx) => (
                          <a key={idx} href={getImageUrl(img)} target="_blank" rel="noopener noreferrer">
                            <img src={getImageUrl(img)} alt="Proof" className="w-14 h-14 object-cover rounded-lg border border-purple-200" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Action Buttons matching exact 7-stage return table workflow */}
                  {(() => {
                    const retStatus = selectedOrder.returnExchange.status;

                    if (retStatus === "Pending Verification" || retStatus === "Return Requested") {
                      return (
                        <div className="pt-3 border-t border-purple-200/80 flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => handleApproveReturn(selectedOrder._id || selectedOrder.orderId)}
                            disabled={actionLoading}
                            className="flex-1 min-w-[200px] bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                          >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            <span>Approve Return Request</span>
                          </button>

                          <button
                            onClick={() => handleRejectReturn(selectedOrder._id || selectedOrder.orderId)}
                            disabled={actionLoading}
                            className="bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-800 border border-red-200 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                          >
                            Reject Request
                          </button>
                        </div>
                      );
                    }

                    if (retStatus === "Return Approved" || retStatus === "Approved") {
                      return (
                        <div className="pt-3 border-t border-purple-200/80 flex items-center justify-between gap-3">
                          <span className="text-xs text-purple-950 font-medium">Next Action: <strong>Product Pickup & Receipt</strong></span>
                          <button
                            onClick={() => handleMarkProductReceived(selectedOrder._id || selectedOrder.orderId)}
                            disabled={actionLoading}
                            className="bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                          >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                            <span>Mark Product Received by Seller</span>
                          </button>
                        </div>
                      );
                    }

                    if (retStatus === "Product Received") {
                      return (
                        <div className="pt-3 border-t border-purple-200/80 flex items-center justify-between gap-3">
                          <span className="text-xs text-purple-950 font-medium">Next Action: <strong>Refund Processing</strong></span>
                          <button
                            onClick={() => handleProcessReturnRefund(selectedOrder._id || selectedOrder.orderId)}
                            disabled={actionLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                          >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                            <span>Initiate & Process Refund via Razorpay (Rs {netRefundAmount.toLocaleString()})</span>
                          </button>
                        </div>
                      );
                    }

                    if (retStatus === "Refund Initiated") {
                      return (
                        <div className="pt-3 border-t border-purple-200/80 flex items-center justify-between text-xs">
                          <span className="font-semibold text-amber-800 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-amber-600" /> Razorpay Refund Processing (Auto-syncs upon bank settlement in 5-7 days)
                          </span>
                          <span className="bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-full uppercase">Refund Processing</span>
                        </div>
                      );
                    }

                    if (retStatus === "Refunded") {
                      return (
                        <div className="pt-3 border-t border-purple-200/80 flex items-center justify-between text-xs">
                          <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Razorpay Refund Processed & Credited to Customer
                          </span>
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full uppercase">Refunded</span>
                        </div>
                      );
                    }

                    return null;
                  })()}
                </div>
              );
            })()}

            {/* Refund Details & Calculation */}
            {selectedOrder.refundDetails && selectedOrder.refundDetails.refundMethod !== "None" && (() => {
              const isCancelled = selectedOrder.cancellation?.isCancelled || selectedOrder.orderStatus === "Cancelled";
              const reqReason = selectedOrder.returnExchange?.reason || "";
              const isFreeShippingReason = [
                "Defective or damaged product",
                "Received wrong item",
                "Parcel received with missing items",
                "Item damaged during transit",
                "Item defective or damaged"
              ].some(r => reqReason.toLowerCase().includes(r.toLowerCase()));

              const returnShippingFee = (isCancelled || isFreeShippingReason)
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

              const refundBaseSubtotal = isCancelled
                ? (selectedOrder.cancellation?.refundAmount || orderGrossTotal)
                : (returnItemsSubtotal > 0 ? returnItemsSubtotal : orderGrossTotal);

              const netRefundAmount = (typeof selectedOrder.refundDetails?.refundAmount === "number" && selectedOrder.refundDetails.refundAmount > 0)
                ? selectedOrder.refundDetails.refundAmount
                : Math.max(0, refundBaseSubtotal - returnShippingFee);

              return (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5 space-y-3.5 text-xs text-blue-950">
                  <div className="flex items-center justify-between border-b border-blue-200/80 pb-2.5">
                    <span className="font-bold text-sm uppercase tracking-wider text-blue-950 block">Refund Details & Calculation</span>
                    <span className="bg-blue-200 text-blue-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                      {selectedOrder.refundDetails.refundMethod}
                    </span>
                  </div>

                  {/* Calculation Breakdown Box */}
                  <div className="bg-[#FFFFFF] p-3.5 rounded-xl border border-blue-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-neutral-600 font-medium">
                      <span>{isCancelled ? "Order Total Paid" : "Returned Items Subtotal"}</span>
                      <span className="font-semibold text-neutral-900">
                        Rs {(isCancelled ? orderGrossTotal : (returnItemsSubtotal > 0 ? returnItemsSubtotal : (netRefundAmount + returnShippingFee))).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-neutral-600 font-medium">
                      <span>Return Shipping Fee</span>
                      <span className={returnShippingFee === 0 ? "font-bold text-emerald-600" : "font-semibold text-amber-700"}>
                        {returnShippingFee === 0 ? "Rs 0" : `- Rs ${returnShippingFee}`}
                      </span>
                    </div>

                    <div className="border-t border-neutral-200/80 pt-2 flex items-center justify-between font-bold text-neutral-900 text-sm">
                      <span>Net Refund Amount</span>
                      <span className="text-emerald-700 text-base font-mono">
                        Rs {netRefundAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Payout Credentials */}
                  <div className="space-y-1.5 pt-1">
                    <p><strong>Payout Method:</strong> {selectedOrder.refundDetails.refundMethod}</p>
                    {selectedOrder.refundDetails.refundMethod === "Bank Transfer" && (
                      <>
                        <p><strong>Account Holder:</strong> {selectedOrder.refundDetails.bankHolderName || "N/A"}</p>
                        <p><strong>Account Number:</strong> {selectedOrder.refundDetails.accountNumber || "N/A"}</p>
                        <p><strong>IFSC Code:</strong> {selectedOrder.refundDetails.ifscCode || "N/A"}</p>
                      </>
                    )}
                    {selectedOrder.refundDetails.refundMethod === "UPI" && (
                      <p><strong>UPI ID:</strong> {selectedOrder.refundDetails.upiId || "N/A"}</p>
                    )}
                    <p>
                      <strong>Status:</strong>{" "}
                      <span className="font-semibold text-blue-900">{selectedOrder.refundDetails.refundStatus}</span>{" "}
                      (Window: {selectedOrder.refundDetails.estimatedCreditWindow || "5-7 Business Days"})
                    </p>
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
    </div>
  );
}
