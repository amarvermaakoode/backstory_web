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
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order status updated to "${status}"`,
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
      if (!order.returnExchange) order.returnExchange = {};
      order.returnExchange.status = "Refund Initiated";
      order.paymentStatus = "Refund Processing";
    } else if (refundStatus === "Refunded" || refundStatus === "Processed / Credited") {
      order.orderStatus = "Returned";
      if (!order.returnExchange) order.returnExchange = {};
      order.returnExchange.status = "Refunded";
      order.paymentStatus = "Refunded";
    }

    order.refundDetails.updatedAt = new Date();
    await order.save();

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

    if (reqType === "return") {
      // Stage 4: Admin approves return -> Order: Delivered, Return: Return Approved, Payment: Paid
      order.returnExchange.status = "Return Approved";
      order.orderStatus = "Delivered";
      order.paymentStatus = "Paid";

      const returnFee = order.returnExchange?.returnShippingFee || 0;
      const refundAmountRs = order.refundDetails?.refundAmount || Math.max(0, (order.totalAmount || order.orderTotal || 1100) - returnFee);
      
      if (!order.refundDetails) order.refundDetails = {};
      order.refundDetails.refundAmount = refundAmountRs;
      order.refundDetails.refundStatus = "None";
    } else {
      // Exchange request
      order.returnExchange.status = "Exchange Approved";
      order.orderStatus = "Ready to Pack & Ship";
    }

    order.returnExchange.approvedAt = new Date();
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

    if (!order.returnExchange) {
      order.returnExchange = {};
    }

    order.returnExchange.status = "Rejected";
    order.returnExchange.rejectionReason = rejectionReason || "Request does not meet return policy criteria.";
    order.returnExchange.rejectedAt = new Date();

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

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateRefundStatus,
  approveReturnRequest,
  rejectReturnRequest,
};
