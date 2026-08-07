const Order = require("../../models/Order");

const ALLOWED_STATUSES = [
  "Placed",
  "Order Confirmed",
  "Ready to Pack & Ship",
  "Dispatched & In Transit",
  "Out for Delivery",
  "Delivered",
  "Return In Progress",
  "Returned",
  "Cancelled",
  "Processing"
];

// Get all orders for admin management
const getAllOrders = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (status && status !== "All") {
      if (status === "Return Requested") {
        query["returnExchange.isRequested"] = true;
      } else {
        query.orderStatus = status;
      }
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { orderId: searchRegex },
        { "shippingAddress.email": searchRegex },
        { "shippingAddress.firstName": searchRegex },
        { "shippingAddress.lastName": searchRegex },
        { "shippingAddress.phoneNumber": searchRegex },
        { razorpayPaymentId: searchRegex }
      ];
    }

    const orders = await Order.find(query)
      .populate("user", "name email phoneNumber")
      .sort({ createdAt: -1 });

    // Auto-sync pending Razorpay refunds with live Razorpay API status
    await Promise.all(
      orders.map(async (ord) => {
        if (
          (ord.returnExchange?.status === "Refund Initiated" || ord.paymentStatus === "Refund Processing") &&
          (ord.refundDetails?.razorpayRefundId || ord.refundDetails?.refundId)
        ) {
          await syncRazorpayRefundStatus(ord);
        }
      })
    );

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Admin get all orders error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch admin orders",
    });
  }
};

// Helper to update active returnExchange and matching entry in returnRequestsHistory
const updateReturnRequestStatus = (order, newStatus, additionalData = {}) => {
  if (!order.returnExchange) order.returnExchange = {};
  order.returnExchange.status = newStatus;
  Object.assign(order.returnExchange, additionalData);

  if (Array.isArray(order.returnRequestsHistory) && order.returnRequestsHistory.length > 0) {
    const lastIdx = order.returnRequestsHistory.length - 1;
    if (order.returnRequestsHistory[lastIdx]) {
      order.returnRequestsHistory[lastIdx].status = newStatus;
      Object.assign(order.returnRequestsHistory[lastIdx], additionalData);
    }
  }
};

// Helper to auto-sync Razorpay refund status with backend database
const syncRazorpayRefundStatus = async (order) => {
  try {
    const refundId = order?.refundDetails?.razorpayRefundId || order?.refundDetails?.refundId;
    if (!refundId || !refundId.startsWith("rfnd_")) return;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return;

    const Razorpay = require("razorpay");
    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const rzpRefund = await rzp.refunds.fetch(refundId);

    if (rzpRefund) {
      if (rzpRefund.status === "credited" || rzpRefund.speed_processed === "instant") {
        // Stage 7: Bank credit confirmed -> Refunded & Returned
        if (order.returnExchange?.status !== "Refunded") {
          order.orderStatus = "Returned";
          order.paymentStatus = "Refunded";
          updateReturnRequestStatus(order, "Refunded");
          if (!order.refundDetails) order.refundDetails = {};
          order.refundDetails.refundStatus = "Refunded";
          order.refundDetails.updatedAt = new Date();

          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item) => {
              item.orderStatus = "Returned";
              item.paymentStatus = "Refunded";
            });
          }
          await order.save();
        }
      } else if (rzpRefund.status === "processed" || rzpRefund.status === "pending") {
        // Stage 6: Razorpay gateway processed -> Refund Initiated & Processing (5-7 working days for bank credit)
        if (order.returnExchange?.status !== "Refunded") {
          order.orderStatus = "Return In Progress";
          order.paymentStatus = "Refund Processing";
          updateReturnRequestStatus(order, "Refund Initiated");
          if (!order.refundDetails) order.refundDetails = {};
          order.refundDetails.refundStatus = "Refund Processing";
          order.refundDetails.estimatedCreditWindow = "5-7 Business Days";
          order.refundDetails.updatedAt = new Date();

          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item) => {
              item.orderStatus = "Return In Progress";
              item.paymentStatus = "Refund Processing";
            });
          }
          await order.save();
        }
      }
    }
  } catch (err) {
    console.error("Error auto-syncing Razorpay refund status:", err.message);
  }
};

// Get single order details (by MongoDB _id or orderId)
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const isMongoId = id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
    const order = await Order.findOne({
      $or: [{ _id: isMongoId ? id : null }, { orderId: id.trim() }]
    }).populate("user", "name email phoneNumber");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      (order.returnExchange?.status === "Refund Initiated" || order.paymentStatus === "Refund Processing") &&
      (order.refundDetails?.razorpayRefundId || order.refundDetails?.refundId)
    ) {
      await syncRazorpayRefundStatus(order);
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Admin get order by id error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch order details",
    });
  }
};

// Update status of an order (by MongoDB _id or orderId)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed statuses are: ${ALLOWED_STATUSES.join(", ")}`,
      });
    }

    const isMongoId = id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
    const order = await Order.findOne({
      $or: [{ _id: isMongoId ? id : null }, { orderId: id.trim() }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.orderStatus = status;

    // Update items inside this order to match the new status
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item) => {
        item.orderStatus = status;
      });
    }

    // Auto-update return lifecycle status based on user table:
    // Stage 5: Product picked up/received -> Order: Return In Progress, Return: Product Received, Payment: Paid
    // Stage 7: Refund completed -> Order: Returned, Return: Refunded, Payment: Refunded
    if (status === "Return In Progress") {
      if (!order.returnExchange) order.returnExchange = {};
      if (order.returnExchange.status !== "Refund Initiated") {
        order.returnExchange.status = "Product Received";
      }
      if (order.paymentStatus !== "Refund Processing" && order.paymentStatus !== "Refunded") {
        order.paymentStatus = "Paid";
      }
    } else if (status === "Returned") {
      if (!order.returnExchange) order.returnExchange = {};
      order.returnExchange.status = "Refunded";
      order.paymentStatus = "Refunded";
      if (!order.refundDetails) order.refundDetails = {};
      order.refundDetails.refundStatus = "Refunded";

      const returnFee = typeof order.returnExchange?.returnShippingFee === "number" ? order.returnExchange.returnShippingFee : 0;
      const orderTotal = order.totalAmount || order.orderTotal || 0;
      if (!order.refundDetails.refundAmount || order.refundDetails.refundAmount <= 0) {
        order.refundDetails.refundAmount = Math.max(0, orderTotal - returnFee);
      }

      const method = (order.refundDetails?.refundMethod || order.returnExchange?.refundMethod || "").toLowerCase();
      const originalWasWallet = (order.paymentMethod || "").toLowerCase().includes("wallet") || (order.walletDeduction && order.walletDeduction > 0);
      const isWalletMethod = method.includes("wallet") || (method.includes("original") && originalWasWallet) || (method === "" && originalWasWallet);

      if (isWalletMethod) {
        order.refundDetails.refundMethod = "BacStory Wallet";
        order.refundDetails.refundId = order.refundDetails.refundId || `WLT-${Math.floor(100000 + Math.random() * 900000)}`;
        order.refundDetails.estimatedCreditWindow = "Instant Credit to BacStory Wallet";
      }
    }

    await order.save();

    // Sync wallet balance if payout method was BacStory Wallet
    const { syncUserWalletBalance } = require("../../config/walletHelper");
    const creditedWalletBalance = await syncUserWalletBalance(order.user, order.shippingAddress?.email, order.shippingAddress?.phoneNumber);

    const methodCheck = (order.refundDetails?.refundMethod || order.returnExchange?.refundMethod || "").toLowerCase();
    const origCheck = (order.paymentMethod || "").toLowerCase().includes("wallet") || (order.walletDeduction && order.walletDeduction > 0);
    const isWalletMethodFinal = methodCheck.includes("wallet") || (methodCheck.includes("original") && origCheck) || (methodCheck === "" && origCheck);

    const successMsg = isWalletMethodFinal && status === "Returned"
      ? `Order status updated to "Returned". Rs ${order.refundDetails.refundAmount.toLocaleString()} credited instantly to customer's BacStory Wallet (New Balance: Rs ${creditedWalletBalance.toLocaleString()})!`
      : `Order status updated to "${status}"`;

    return res.status(200).json({
      success: true,
      message: successMsg,
      data: order,
    });
  } catch (error) {
    console.error("Admin update order status error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status",
    });
  }
};

// Update refund status of an order (e.g. "None", "Paid", "Refund Processing", "Refunded")
const updateRefundStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { refundStatus, estimatedCreditWindow } = req.body;

    const isMongoId = id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
    const order = await Order.findOne({
      $or: [{ _id: isMongoId ? id : null }, { orderId: id.trim() }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.refundDetails) {
      order.refundDetails = {};
    }

    if (refundStatus) order.refundDetails.refundStatus = refundStatus;
    if (estimatedCreditWindow) order.refundDetails.estimatedCreditWindow = estimatedCreditWindow;

    // Sync return lifecycle according to table when refund status changes:
    // Stage 6: Refund initiated -> Order: Return In Progress, Return: Refund Initiated, Payment: Refund Processing
    // Stage 7: Refund completed -> Order: Returned, Return: Refunded, Payment: Refunded
    if (refundStatus === "Refund Processing" || refundStatus === "Initiated / Refund Pending") {
      order.orderStatus = "Return In Progress";
      order.paymentStatus = "Refund Processing";
      updateReturnRequestStatus(order, "Refund Initiated");
    } else if (refundStatus === "Refunded" || refundStatus === "Processed / Credited") {
      order.orderStatus = "Returned";
      order.paymentStatus = "Refunded";
      updateReturnRequestStatus(order, "Refunded");
    }

    order.refundDetails.updatedAt = new Date();
    await order.save();

    // Sync wallet balance if payout method was BacStory Wallet
    const { syncUserWalletBalance } = require("../../config/walletHelper");
    await syncUserWalletBalance(order.user, order.shippingAddress?.email, order.shippingAddress?.phoneNumber);

    return res.status(200).json({
      success: true,
      message: `Refund status updated to "${refundStatus}"`,
      data: order,
    });
  } catch (error) {
    console.error("Admin update refund status error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update refund status",
    });
  }
};

// Approve Return or Exchange request
const approveReturnRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const isMongoId = id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
    const order = await Order.findOne({
      $or: [{ _id: isMongoId ? id : null }, { orderId: id.trim() }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.returnExchange || !order.returnExchange.isRequested) {
      return res.status(400).json({ success: false, message: "No return or exchange request found for this order." });
    }

    const reqType = order.returnExchange.requestType || "return";
    const appStatus = reqType === "return" ? "Return Approved" : "Exchange Approved";

    if (reqType === "return") {
      // Stage 4: Admin approves return -> Order: Delivered, Return: Return Approved, Payment: Paid
      order.orderStatus = "Delivered";
      order.paymentStatus = "Paid";

      const returnFee = order.returnExchange?.returnShippingFee || 0;
      const refundAmountRs = order.refundDetails?.refundAmount || Math.max(0, (order.totalAmount || order.orderTotal || 1100) - returnFee);
      
      if (!order.refundDetails) order.refundDetails = {};
      order.refundDetails.refundAmount = refundAmountRs;
      order.refundDetails.refundStatus = "None";
    } else {
      // Exchange request
      order.orderStatus = "Ready to Pack & Ship";
    }

    updateReturnRequestStatus(order, appStatus, { approvedAt: new Date() });
    await order.save();

    return res.status(200).json({
      success: true,
      message: `${reqType === "return" ? "Return request approved" : "Exchange request approved"} successfully!`,
      data: order
    });
  } catch (error) {
    console.error("Admin approve return error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to approve return request" });
  }
};

// Mark return product received by seller (Stage 5: Order: Return In Progress, Return: Product Received, Payment: Paid)
const markProductReceived = async (req, res) => {
  try {
    const { id } = req.params;
    const isMongoId = id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
    const order = await Order.findOne({
      $or: [{ _id: isMongoId ? id : null }, { orderId: id.trim() }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.returnExchange || !order.returnExchange.isRequested) {
      return res.status(400).json({ success: false, message: "No return request found for this order." });
    }

    order.orderStatus = "Return In Progress";
    order.paymentStatus = "Paid";
    updateReturnRequestStatus(order, "Product Received", { receivedAt: new Date() });

    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item) => {
        item.orderStatus = "Return In Progress";
      });
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Product marked as received by seller. You can now process the refund.",
      data: order
    });
  } catch (error) {
    console.error("Admin mark product received error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to mark product received" });
  }
};

// Process & execute Razorpay refund for returned product (Stage 6 & 7: Refund Initiated / Refunded)
const processReturnRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const isMongoId = id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
    const order = await Order.findOne({
      $or: [{ _id: isMongoId ? id : null }, { orderId: id.trim() }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.returnExchange || !order.returnExchange.isRequested) {
      return res.status(400).json({ success: false, message: "No return request found for this order." });
    }

    const returnFee = typeof order.returnExchange?.returnShippingFee === "number" ? order.returnExchange.returnShippingFee : 0;
    const orderTotal = order.totalAmount || order.orderTotal || 1100;
    const refundAmountRs = (typeof order.refundDetails?.refundAmount === "number" && order.refundDetails.refundAmount > 0)
      ? order.refundDetails.refundAmount
      : Math.max(0, orderTotal - returnFee);

    if (!order.refundDetails) order.refundDetails = {};
    order.refundDetails.refundAmount = refundAmountRs;

    // Check if customer selected BacStory Wallet payout or original payment method (when original was Wallet)
    const refundMethodStr = (order.refundDetails?.refundMethod || order.returnExchange?.refundMethod || "").toLowerCase();
    const originalWasWallet = (order.paymentMethod || "").toLowerCase().includes("wallet") || (order.walletDeduction && order.walletDeduction > 0);
    const isWalletRefund = refundMethodStr.includes("wallet") || (refundMethodStr.includes("original") && originalWasWallet) || (refundMethodStr === "" && originalWasWallet);

    if (isWalletRefund) {
      const User = require("../../models/user");
      let customer = null;
      if (order.user) {
        customer = await User.findById(order.user);
      }
      if (!customer && order.shippingAddress?.email) {
        customer = await User.findOne({ email: order.shippingAddress.email.toLowerCase().trim() });
      }

      if (customer) {
        customer.walletBalance = (customer.walletBalance || 0) + refundAmountRs;
        if (!customer.walletTransactions) customer.walletTransactions = [];
        customer.walletTransactions.push({
          type: "credit",
          amount: refundAmountRs,
          description: `Refund credited for Order #${order.orderId}`,
          orderId: order.orderId,
          createdAt: new Date()
        });
        await customer.save();
      }

      const walletRefundId = `WLT-${Math.floor(100000 + Math.random() * 900000)}`;

      order.orderStatus = "Returned";
      order.returnExchange.status = "Refunded";
      order.paymentStatus = "Refunded";
      order.refundDetails.refundStatus = "Refunded";
      order.refundDetails.refundId = walletRefundId;
      order.refundDetails.razorpayRefundId = walletRefundId;
      order.refundDetails.estimatedCreditWindow = "Instant Credit to BacStory Wallet";
      order.refundDetails.updatedAt = new Date();

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          item.orderStatus = "Returned";
          item.paymentStatus = "Refunded";
        });
      }

      await order.save();

      const { syncUserWalletBalance } = require("../../config/walletHelper");
      await syncUserWalletBalance(order.user, order.shippingAddress?.email, order.shippingAddress?.phoneNumber);

      return res.status(200).json({
        success: true,
        message: `Rs ${refundAmountRs.toLocaleString()} credited directly to customer's BacStory Wallet!`,
        data: order
      });
    }

    // Retrieve payment ID (from body or order schema) for Razorpay refunds
    let paymentId = req.body?.razorpayPaymentId || order.razorpayPaymentId || order.paymentInfo?.razorpayPaymentId || order.paymentDetails?.razorpay_payment_id;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(500).json({
        success: false,
        message: "Razorpay credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) missing in server environment (.env)."
      });
    }

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Razorpay Payment ID (pay_...) is missing on this order. Please provide razorpayPaymentId."
      });
    }

    // Call Razorpay API
    const Razorpay = require("razorpay");
    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });

    let refundResult;
    try {
      refundResult = await rzp.payments.refund(paymentId, {
        amount: Math.round(refundAmountRs * 100),
        notes: {
          orderId: order.orderId,
          reason: order.returnExchange.reason || "Return refund post inspection"
        }
      });
    } catch (rzpErr) {
      console.error("Razorpay API Refund Error:", rzpErr);
      const errorDescription = rzpErr?.error?.description || rzpErr?.description || rzpErr?.message || "Razorpay API refund failed";
      return res.status(400).json({
        success: false,
        message: `Razorpay Refund Failed: ${errorDescription}`
      });
    }

    if (!refundResult || !refundResult.id) {
      return res.status(400).json({
        success: false,
        message: "Razorpay refund call did not return a valid refund object."
      });
    }

    // Save payment ID on order if passed
    order.razorpayPaymentId = paymentId;

    // Stage 6: Refund initiated & processing (Razorpay processing timeline: 5-7 working days)
    order.orderStatus = "Return In Progress";
    order.paymentStatus = "Refund Processing";
    order.refundDetails.refundStatus = "Refund Processing";
    order.refundDetails.refundId = refundResult.id;
    order.refundDetails.razorpayRefundId = refundResult.id;
    order.refundDetails.estimatedCreditWindow = "5-7 Working Days";

    updateReturnRequestStatus(order, "Refund Initiated", { razorpayRefundId: refundResult.id });

    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item) => {
        item.orderStatus = "Return In Progress";
        item.paymentStatus = "Refund Processing";
      });
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: `Razorpay refund of Rs ${refundAmountRs.toLocaleString()} initiated successfully (Refund ID: ${refundResult.id})!`,
      data: order
    });
  } catch (error) {
    console.error("Admin process return refund error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to process return refund" });
  }
};

// Reject Return or Exchange request
const rejectReturnRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const isMongoId = id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
    const order = await Order.findOne({
      $or: [{ _id: isMongoId ? id : null }, { orderId: id.trim() }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    updateReturnRequestStatus(order, "Rejected", {
      rejectionReason: rejectionReason || "Request does not meet return policy criteria.",
      rejectedAt: new Date()
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Return / Exchange request rejected.",
      data: order
    });
  } catch (error) {
    console.error("Admin reject return error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to reject return request" });
  }
};

// Delete an order (by _id or orderId)
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const isMongoId = id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
    const order = await Order.findOneAndDelete({
      $or: [{ _id: isMongoId ? id : null }, { orderId: id.trim() }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully."
    });
  } catch (error) {
    console.error("Admin delete order error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to delete order" });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateRefundStatus,
  approveReturnRequest,
  markProductReceived,
  processReturnRefund,
  rejectReturnRequest,
  deleteOrder,
};
