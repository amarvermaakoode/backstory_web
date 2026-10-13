const Order = require("../../models/Order");
const QRCode = require("../../models/QRCode");
const { sendOrderStatusUpdateEmail } = require("../../services/emailService");

// Helper to unclaim QR codes & delete all profile/story data when a product return/exchange is marked as returned, exchanged, or received back
const unclaimOrderQRCodes = async (orderOrId, targetReturn = null) => {
  try {
    if (!orderOrId) return;
    let orderIdStr = "";
    let orderDoc = null;

    if (typeof orderOrId === "object" && orderOrId.orderId) {
      orderIdStr = orderOrId.orderId.toString().trim();
      orderDoc = orderOrId;
    } else {
      orderIdStr = orderOrId.toString().trim();
      const isMongoId = orderIdStr.length === 24 && /^[0-9a-fA-F]{24}$/.test(orderIdStr);
      orderDoc = await Order.findOne({
        $or: [{ _id: isMongoId ? orderIdStr : null }, { orderId: orderIdStr }]
      });
      if (orderDoc?.orderId) {
        orderIdStr = orderDoc.orderId;
      }
    }

    const query = {
      $or: [
        { orderId: orderIdStr },
        { orderId: { $regex: new RegExp(`^${orderIdStr}$`, "i") } }
      ]
    };
    if (orderDoc?._id) {
      query.$or.push({ orderId: orderDoc._id.toString() });
    }

    const qrs = await QRCode.find(query);
    if (!qrs || qrs.length === 0) return;

    // Check if targetReturn specifies certain requestedItems (e.g. partial return of 1 item in a multi-item order)
    const returnedItems = Array.isArray(targetReturn?.requestedItems) && targetReturn.requestedItems.length > 0
      ? targetReturn.requestedItems
      : null;

    for (const qrDoc of qrs) {
      // If specific items were returned and there are multiple QRs, check if this QR corresponds to a returned item
      if (returnedItems && qrs.length > 1) {
        const qrTitle = (qrDoc.profileData?.title || "").toLowerCase().trim();
        const matchesReturnedItem = returnedItems.some(item => {
          const itemName = (item.name || "").toLowerCase().trim();
          return qrTitle.includes(itemName) || (itemName && itemName.includes(qrTitle));
        });

        // If this QR doesn't match the returned item(s), skip unlinking it
        if (!matchesReturnedItem) {
          continue;
        }
      }

      // Automatically unlink the QR code and delete all data associated with that QR
      qrDoc.status = "unlinked";
      qrDoc.orderId = null;
      qrDoc.linkedUser = null;
      qrDoc.linkedAt = null;
      qrDoc.profileData = {
        title: "",
        storyType: "",
        signature: "",
        customText: "",
        bio: "",
        avatarUrl: "",
        coverUrl: "",
        themeColor: "#000000",
        askMeAbout: "",
        rightNow: {
          building: "",
          learning: "",
          obsessedWith: "",
          chasing: "",
          dreamingAbout: "",
        },
        storyPrompts: {
          whoAmI: "",
          unexpectedPart: "",
          nextChapter: "",
        },
        socialLinks: {},
        isPublic: false,
      };

      await qrDoc.save();
      console.log(`[QR Unlink] Successfully unlinked QR ${qrDoc.code} and deleted all associated data (Order ${orderIdStr} returned/exchanged/received back).`);
    }
  } catch (err) {
    console.error(`Error unclaiming QR codes for order ${orderOrId}:`, err);
  }
};

const ALLOWED_STATUSES = [
  "Placed",
  "Order Confirmed",
  "Ready to Pack & Ship",
  "Dispatched & In Transit",
  "Out for Delivery",
  "Delivered",
  "Return Requested",
  "Exchange Requested",
  "Return In Progress",
  "Returned",
  "Exchange In Progress",
  "Exchanged",
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
        query.$or = [
          { orderStatus: "Return Requested" },
          { "returnExchange.isRequested": true, "returnExchange.requestType": "return", "returnExchange.status": "Return Requested" },
          { "returnRequestsHistory.status": "Return Requested" }
        ];
      } else if (status === "Exchange Requested") {
        query.$or = [
          { orderStatus: "Exchange Requested" },
          { "returnExchange.isRequested": true, "returnExchange.requestType": "exchange", "returnExchange.status": "Exchange Requested" },
          { "returnRequestsHistory.status": "Exchange Requested" }
        ];
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
const updateReturnRequestStatus = (order, newStatus, additionalData = {}, targetRequestId = null) => {
  if (!order.returnExchange) order.returnExchange = {};

  if (Array.isArray(order.returnRequestsHistory) && order.returnRequestsHistory.length > 0) {
    let targetIdx = -1;
    if (targetRequestId) {
      targetIdx = order.returnRequestsHistory.findIndex(
        r => r.requestId === targetRequestId || (r._id && r._id.toString() === targetRequestId)
      );
    }
    if (targetIdx === -1) {
      targetIdx = order.returnRequestsHistory.length - 1;
    }
    if (order.returnRequestsHistory[targetIdx]) {
      order.returnRequestsHistory[targetIdx].status = newStatus;
      order.returnRequestsHistory[targetIdx].updatedAt = new Date();
      Object.assign(order.returnRequestsHistory[targetIdx], additionalData);
      order.returnExchange = { ...order.returnRequestsHistory[targetIdx] };
    }
  } else {
    order.returnExchange.status = newStatus;
    order.returnExchange.updatedAt = new Date();
    Object.assign(order.returnExchange, additionalData);
  }

  if (typeof order.markModified === "function") {
    order.markModified("returnRequestsHistory");
    order.markModified("returnExchange");
  }
};

// Helper to auto-sync Razorpay refund status with backend database
const syncRazorpayRefundStatus = async (order) => {
  try {
    let refundId = order?.refundDetails?.razorpayRefundId || order?.refundDetails?.refundId;
    if (refundId && refundId.includes(" / ")) {
      refundId = refundId.split(" / ").find(p => p.startsWith("rfnd_")) || refundId;
    }
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
          await unclaimOrderQRCodes(order.orderId || order._id);
          sendOrderStatusUpdateEmail({
            order,
            statusType: "refund",
            newStatus: "Refunded",
          }).catch((err) => console.error("[Order Email] Auto-sync refund completed email error:", err));
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
          sendOrderStatusUpdateEmail({
            order,
            statusType: "refund",
            newStatus: "Refund Processing",
            notes: "5-7 Business Days",
          }).catch((err) => console.error("[Order Email] Auto-sync refund processing email error:", err));
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

    if (!Array.isArray(order.statusTimeline)) {
      order.statusTimeline = [];
    }

    // Ensure Order Confirmed entry exists with original createdAt
    const hasConfirmed = order.statusTimeline.some(entry => 
      entry.status === "Order Confirmed" || entry.status === "Placed"
    );
    if (!hasConfirmed) {
      order.statusTimeline.unshift({
        status: "Order Confirmed",
        timestamp: order.createdAt || new Date(),
        note: "Order confirmed"
      });
    }

    // Check if status is already in timeline; update timestamp or append
    const existingIndex = order.statusTimeline.findIndex(
      (entry) => (entry.status || "").toLowerCase().trim() === status.toLowerCase().trim()
    );
    if (existingIndex !== -1) {
      order.statusTimeline[existingIndex].timestamp = new Date();
    } else {
      order.statusTimeline.push({
        status: status,
        timestamp: new Date(),
        note: `Order status updated to ${status}`
      });
    }

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
      const orderTotal = typeof order.totalAmount === "number" ? order.totalAmount : (order.orderTotal || 0);
      if (typeof order.refundDetails.refundAmount !== "number") {
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
    } else if (status === "Exchange In Progress") {
      if (!order.returnExchange) order.returnExchange = {};
      order.returnExchange.status = "Exchange Approved";
    } else if (status === "Exchanged") {
      if (!order.returnExchange) order.returnExchange = {};
      order.returnExchange.status = "Exchange Completed";
    }

    await order.save();

    sendOrderStatusUpdateEmail({
      order,
      statusType: "orderStatus",
      newStatus: status,
    }).catch((err) => console.error("[Order Email] Admin status update email error:", err));

    if (status === "Returned" || status === "Exchanged" || (status === "Return In Progress" && order.returnExchange?.status === "Product Received")) {
      await unclaimOrderQRCodes(order);
    }

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

    sendOrderStatusUpdateEmail({
      order,
      statusType: "refund",
      newStatus: refundStatus,
      notes: estimatedCreditWindow || "",
    }).catch((err) => console.error("[Order Email] Admin refund status email error:", err));

    if (refundStatus === "Refunded" || order.orderStatus === "Returned" || order.orderStatus === "Exchanged") {
      await unclaimOrderQRCodes(order.orderId || order._id);
    }

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
    const { requestId } = req.body || {};
    const isMongoId = id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
    const order = await Order.findOne({
      $or: [{ _id: isMongoId ? id : null }, { orderId: id.trim() }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    let targetReturn = null;
    if (requestId && Array.isArray(order.returnRequestsHistory)) {
      targetReturn = order.returnRequestsHistory.find(r => r.requestId === requestId || (r._id && r._id.toString() === requestId));
    }
    if (!targetReturn && Array.isArray(order.returnRequestsHistory) && order.returnRequestsHistory.length > 0) {
      targetReturn = order.returnRequestsHistory[order.returnRequestsHistory.length - 1];
    }
    if (!targetReturn) {
      targetReturn = order.returnExchange;
    }

    const hasAnyReturn = (targetReturn && (targetReturn.isRequested || targetReturn.status)) ||
      (order.returnExchange && (order.returnExchange.isRequested || order.returnExchange.status)) ||
      (Array.isArray(order.returnRequestsHistory) && order.returnRequestsHistory.length > 0);

    if (!hasAnyReturn) {
      return res.status(400).json({ success: false, message: "No return or exchange request found for this order." });
    }

    const reqType = targetReturn.requestType || "return";
    const appStatus = reqType === "return" ? "Return Approved" : "Exchange Approved";

    if (reqType === "return") {
      // Stage 4: Admin approves return -> Order: Return In Progress, Return: Return Approved, Payment: Paid
      order.orderStatus = "Return In Progress";
      order.paymentStatus = "Paid";

      const returnFee = targetReturn?.returnShippingFee || 0;
      const orderPaidAmount = typeof order.totalAmount === "number" ? order.totalAmount : (order.orderTotal || 0);
      const refundAmountRs = typeof targetReturn?.refundAmount === "number"
        ? targetReturn.refundAmount
        : Math.max(0, orderPaidAmount - returnFee);
      
      if (!order.refundDetails) order.refundDetails = {};
      order.refundDetails.refundAmount = refundAmountRs;
      order.refundDetails.refundStatus = "None";
    } else {
      // Exchange request
      order.orderStatus = "Exchange In Progress";
    }

    updateReturnRequestStatus(order, appStatus, { approvedAt: new Date() }, requestId);
    await order.save();

    sendOrderStatusUpdateEmail({
      order,
      statusType: reqType,
      newStatus: appStatus,
    }).catch((err) => console.error("[Order Email] Admin approve return email error:", err));

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
    const { requestId } = req.body || {};
    const isMongoId = id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
    const order = await Order.findOne({
      $or: [{ _id: isMongoId ? id : null }, { orderId: id.trim() }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    let targetReturn = null;
    if (requestId && Array.isArray(order.returnRequestsHistory)) {
      targetReturn = order.returnRequestsHistory.find(r => r.requestId === requestId || (r._id && r._id.toString() === requestId));
    }
    if (!targetReturn && Array.isArray(order.returnRequestsHistory) && order.returnRequestsHistory.length > 0) {
      targetReturn = order.returnRequestsHistory[order.returnRequestsHistory.length - 1];
    }
    if (!targetReturn) {
      targetReturn = order.returnExchange;
    }

    const hasAnyReturn = (targetReturn && (targetReturn.isRequested || targetReturn.status)) ||
      (order.returnExchange && (order.returnExchange.isRequested || order.returnExchange.status)) ||
      (Array.isArray(order.returnRequestsHistory) && order.returnRequestsHistory.length > 0);

    if (!hasAnyReturn) {
      return res.status(400).json({ success: false, message: "No return request found for this order." });
    }

    const isExchangeRequest = targetReturn?.requestType === "exchange" || order.returnExchange?.requestType === "exchange";

    if (isExchangeRequest) {
      updateReturnRequestStatus(order, "Product Picked Up", { receivedAt: new Date(), pickedUpAt: new Date() }, requestId);
      order.orderStatus = "Exchange In Progress";
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          item.orderStatus = "Exchange In Progress";
        });
      }
      await order.save();
      await unclaimOrderQRCodes(order, targetReturn);
      sendOrderStatusUpdateEmail({
        order,
        statusType: "exchange",
        newStatus: "Product Picked Up",
      }).catch((err) => console.error("[Order Email] Mark exchange product picked up email error:", err));
      return res.status(200).json({
        success: true,
        message: "Product marked as picked up for exchange successfully!",
        data: order
      });
    }

    order.orderStatus = "Return In Progress";
    order.paymentStatus = "Paid";
    updateReturnRequestStatus(order, "Product Received", { receivedAt: new Date() }, requestId);

    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item) => {
        item.orderStatus = "Return In Progress";
      });
    }

    await order.save();
    await unclaimOrderQRCodes(order, targetReturn);
    sendOrderStatusUpdateEmail({
      order,
      statusType: "return",
      newStatus: "Product Received",
    }).catch((err) => console.error("[Order Email] Mark return product received email error:", err));

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
    const { requestId } = req.body || {};
    const isMongoId = id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
    const order = await Order.findOne({
      $or: [{ _id: isMongoId ? id : null }, { orderId: id.trim() }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    let targetReturn = null;
    if (requestId && Array.isArray(order.returnRequestsHistory)) {
      targetReturn = order.returnRequestsHistory.find(r => r.requestId === requestId || (r._id && r._id.toString() === requestId));
    }
    if (!targetReturn && Array.isArray(order.returnRequestsHistory) && order.returnRequestsHistory.length > 0) {
      targetReturn = order.returnRequestsHistory[order.returnRequestsHistory.length - 1];
    }
    if (!targetReturn) {
      targetReturn = order.returnExchange;
    }

    const hasAnyReturn = (targetReturn && (targetReturn.isRequested || targetReturn.status)) ||
      (order.returnExchange && (order.returnExchange.isRequested || order.returnExchange.status)) ||
      (Array.isArray(order.returnRequestsHistory) && order.returnRequestsHistory.length > 0);

    if (!hasAnyReturn) {
      return res.status(400).json({ success: false, message: "No return request found for this order." });
    }

    const isExchangeRequest = targetReturn?.requestType === "exchange" || order.returnExchange?.requestType === "exchange";

    if (isExchangeRequest) {
      targetReturn.status = "Exchange Approved";
      order.orderStatus = "Exchange In Progress";
      if (order.returnExchange) {
        order.returnExchange.status = "Exchange Approved";
      }
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          item.orderStatus = "Exchange In Progress";
        });
      }
      await order.save();
      return res.status(200).json({
        success: true,
        message: "Exchange request approved successfully! Replacement processing is in progress.",
        data: order
      });
    }

    const returnFee = typeof targetReturn?.returnShippingFee === "number" ? targetReturn.returnShippingFee : 0;
    
    let reqItemsSubtotal = 0;
    if (targetReturn?.requestedItems?.length > 0) {
      targetReturn.requestedItems.forEach(ritem => {
        const origItem = order.items?.find(i => (ritem.itemId && (i._id?.toString() === ritem.itemId || i.id === ritem.itemId)) || (ritem.name && i.name === ritem.name));
        const rawPrice = origItem ? (origItem.priceNum ?? origItem.price) : ((order.totalAmount || order.subtotal || 1100) / (order.items?.length || 1));
        const unitPrice = typeof rawPrice === "number" ? rawPrice : (parseFloat(String(rawPrice).replace(/[^0-9.]/g, "")) || 0);
        const qty = ritem.returnQuantity || 1;
        reqItemsSubtotal += (unitPrice * qty);
      });
    }

    const orderPaidAmount = typeof order.totalAmount === "number" 
      ? order.totalAmount 
      : (parseFloat(String(order.totalAmount ?? order.orderTotal ?? 0).replace(/[^0-9.]/g, "")) || 0);

    const orderOriginalSubtotal = order.subtotal > 0
      ? order.subtotal
      : (order.items && Array.isArray(order.items)
          ? order.items.reduce((s, it) => s + ((it.priceNum || parseFloat(String(it.price || 0).replace(/[^0-9.]/g, "")) || 0) * (it.quantity || 1)), 0)
          : orderPaidAmount);

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

    // Check if this order was placed using a Marketing / Promo Code or has ₹0 paid / zero refund
    const isMarketingOrZeroOrder = orderPaidAmount <= 0 ||
      Boolean(req.body?.isZeroRefund) ||
      (order.paymentMethod || "").toLowerCase().includes("marketing") ||
      (order.paymentMethod || "").toLowerCase().includes("promo") ||
      (order.couponCode || "").toLowerCase().startsWith("mkt") ||
      (order.couponCode || "").toLowerCase().includes("promo") ||
      String(order.razorpayPaymentId || "").startsWith("pay_PROMO") ||
      String(order.razorpayOrderId || "").startsWith("order_FREE") ||
      String(order.paymentDetails?.razorpay_payment_id || "").startsWith("pay_PROMO");

    const refundAmountRs = isMarketingOrZeroOrder
      ? 0
      : (typeof targetReturn?.refundAmount === "number"
          ? targetReturn.refundAmount
          : Math.max(0, effectivePaidForReturned - returnFee));

    if (!order.refundDetails) order.refundDetails = {};
    order.refundDetails.refundAmount = refundAmountRs;

    // Handle Marketing / Promo Code / ₹0 Order Returns FIRST (No monetary refund needed)
    if (isMarketingOrZeroOrder || refundAmountRs <= 0) {
      const zeroRefundId = `MKT-RET-${Math.floor(100000 + Math.random() * 900000)}`;

      order.orderStatus = "Returned";
      order.returnExchange.status = "Refunded";
      order.paymentStatus = "Paid";
      order.refundDetails.refundStatus = "Refunded";
      order.refundDetails.refundAmount = 0;
      order.refundDetails.refundId = zeroRefundId;
      order.refundDetails.estimatedCreditWindow = "No Refund Required (₹0 Order)";
      order.refundDetails.updatedAt = new Date();

      updateReturnRequestStatus(order, "Refunded", {
        refundAmount: 0,
        refundId: zeroRefundId,
        note: "Zero refund order (marketing code / promo discount applied). Return completed successfully without monetary refund."
      }, requestId);

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          item.orderStatus = "Returned";
          item.paymentStatus = "Paid";
        });
      }

      await order.save();
      await unclaimOrderQRCodes(order.orderId || order._id);

      sendOrderStatusUpdateEmail({
        order,
        statusType: "refund",
        newStatus: "Refunded",
        meta: {
          refundAmount: 0,
          refundMethod: "No Monetary Refund (Marketing Code / ₹0 Order)",
        },
      }).catch((err) => console.error("[Order Email] Marketing zero refund email error:", err));

      return res.status(200).json({
        success: true,
        message: "Return completed successfully! No Razorpay refund required as order was ₹0 (Marketing / Promo Code).",
        data: order
      });
    }

    // Check payout method requested by customer
    const refundMethodStr = (targetReturn?.refundMethod || order.refundDetails?.refundMethod || order.returnExchange?.refundMethod || "").toLowerCase();

    // Check if customer explicitly requested 100% store credit / wallet payout (e.g. "BacStory Wallet / Store Credit")
    const isExplicitWalletPayout = (refundMethodStr.includes("wallet") || refundMethodStr.includes("store credit")) && !refundMethodStr.includes("original");

    const orderWalletDeduction = typeof order.walletDeduction === "number"
      ? order.walletDeduction
      : (parseFloat(String(order.walletDeduction || 0).replace(/[^0-9.]/g, "")) || 0);

    const orderRazorpayPaid = Math.max(0, orderPaidAmount - orderWalletDeduction);

    let walletRefundAmount = 0;
    let razorpayRefundAmount = 0;

    if (isExplicitWalletPayout) {
      // Customer explicitly chose BacStory Wallet / Store Credit
      walletRefundAmount = refundAmountRs;
      razorpayRefundAmount = 0;
    } else {
      // Customer selected "Original Payment Method" (or default):
      // If order was a split payment (both wallet deduction and razorpay payment):
      if (orderWalletDeduction > 0 && orderRazorpayPaid > 0 && orderPaidAmount > 0) {
        walletRefundAmount = Math.round(Math.min(orderWalletDeduction, refundAmountRs * (orderWalletDeduction / orderPaidAmount)) * 100) / 100;
        razorpayRefundAmount = Math.min(orderRazorpayPaid, Math.max(0, Math.round((refundAmountRs - walletRefundAmount) * 100) / 100));
      } else if (orderWalletDeduction > 0 && orderRazorpayPaid <= 0) {
        // 100% wallet paid order
        walletRefundAmount = refundAmountRs;
        razorpayRefundAmount = 0;
      } else {
        // 100% Razorpay / prepaid order
        walletRefundAmount = 0;
        razorpayRefundAmount = refundAmountRs;
      }
    }

    // Prevent double refund if already marked as Refunded
    if (targetReturn?.status === "Refunded" || order.refundDetails?.refundStatus === "Refunded") {
      if (targetReturn && targetReturn.status !== "Refunded") {
        updateReturnRequestStatus(order, "Refunded", {
          refundAmount: order.refundDetails?.refundAmount || refundAmountRs,
          refundId: order.refundDetails?.refundId || order.refundDetails?.razorpayRefundId,
          refundMethod: order.refundDetails?.refundMethod || "Original Payment Method",
          note: "Refund already processed for this return request."
        }, requestId);
        await order.save();
      }
      return res.status(400).json({
        success: false,
        message: "Refund for this return request has already been completed.",
        data: order
      });
    }

    const User = require("../../models/user");
    let customer = null;
    if (order.user) {
      customer = await User.findById(order.user);
    }
    if (!customer && order.shippingAddress?.email) {
      customer = await User.findOne({ email: order.shippingAddress.email.toLowerCase().trim() });
    }

    const getRazorpayInstance = () => {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keyId || !keySecret) {
        throw new Error("Razorpay credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) missing in server environment (.env).");
      }
      const Razorpay = require("razorpay");
      return new Razorpay({ key_id: keyId, key_secret: keySecret });
    };

    let paymentId = req.body?.razorpayPaymentId || order.razorpayPaymentId || order.paymentInfo?.razorpayPaymentId || order.paymentDetails?.razorpay_payment_id;

    // CASE 1: SPLIT REFUND (Part to BacStory Wallet, Part via Razorpay API)
    if (walletRefundAmount > 0 && razorpayRefundAmount > 0) {
      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: "Razorpay Payment ID (pay_...) is missing on this order. Please provide razorpayPaymentId to refund the online payment portion."
        });
      }

      let rzp;
      try {
        rzp = getRazorpayInstance();
      } catch (envErr) {
        return res.status(500).json({ success: false, message: envErr.message });
      }

      let refundResult;
      try {
        let paiseToRefund = Math.round(razorpayRefundAmount * 100);
        try {
          const paymentData = await rzp.payments.fetch(paymentId);
          if (paymentData && typeof paymentData.amount === "number") {
            const maxRefundablePaise = Math.max(0, paymentData.amount - (paymentData.amount_refunded || 0));
            if (paiseToRefund > maxRefundablePaise) {
              paiseToRefund = maxRefundablePaise;
            }
          }
        } catch (fetchErr) {
          console.warn("[Split Refund] Warning fetching payment before refund:", fetchErr?.message);
        }

        refundResult = await rzp.payments.refund(paymentId, {
          amount: paiseToRefund,
          notes: {
            orderId: order.orderId,
            reason: targetReturn?.reason || "Return split refund post inspection",
            splitDetails: `Wallet: Rs ${walletRefundAmount}, Razorpay: Rs ${razorpayRefundAmount}`
          }
        });
      } catch (rzpErr) {
        console.error("Razorpay Split Refund Error:", rzpErr);
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

      // Razorpay successful! Now credit the wallet portion:
      if (customer) {
        customer.walletBalance = (customer.walletBalance || 0) + walletRefundAmount;
        if (!customer.walletTransactions) customer.walletTransactions = [];
        customer.walletTransactions.push({
          type: "credit",
          amount: walletRefundAmount,
          description: `Refund credited for Order #${order.orderId} (Wallet portion: ₹${walletRefundAmount.toLocaleString()})`,
          orderId: order.orderId,
          createdAt: new Date()
        });
        await customer.save();
      }

      const walletRefundId = `WLT-${Math.floor(100000 + Math.random() * 900000)}`;
      const combinedRefundId = `${walletRefundId} / ${refundResult.id}`;

      order.razorpayPaymentId = paymentId;
      order.orderStatus = "Return In Progress";
      order.paymentStatus = "Refund Processing";
      order.refundDetails.refundStatus = "Refund Processing";
      order.refundDetails.refundAmount = refundAmountRs;
      order.refundDetails.refundId = combinedRefundId;
      order.refundDetails.razorpayRefundId = refundResult.id;
      order.refundDetails.walletRefundId = walletRefundId;
      order.refundDetails.walletRefundAmount = walletRefundAmount;
      order.refundDetails.razorpayRefundAmount = razorpayRefundAmount;
      order.refundDetails.refundMethod = "Original Payment Method (Split)";
      order.refundDetails.estimatedCreditWindow = `₹${walletRefundAmount.toLocaleString()} Instant to Wallet (Credited) + ₹${razorpayRefundAmount.toLocaleString()} via Razorpay (5-7 Working Days)`;
      order.refundDetails.initiatedAt = new Date();
      order.refundDetails.updatedAt = new Date();

      updateReturnRequestStatus(order, "Refund Initiated", {
        refundAmount: refundAmountRs,
        walletRefundAmount,
        razorpayRefundAmount,
        refundId: combinedRefundId,
        razorpayRefundId: refundResult.id,
        walletRefundId: walletRefundId,
        refundMethod: "Original Payment Method (Split)",
        note: `Split refund: Rs ${walletRefundAmount.toLocaleString()} credited instantly to BacStory Wallet. Rs ${razorpayRefundAmount.toLocaleString()} processing via Razorpay (5-7 Working Days).`
      }, requestId);

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          item.orderStatus = "Return In Progress";
          item.paymentStatus = "Refund Processing";
        });
      }

      if (typeof order.markModified === "function") {
        order.markModified("returnRequestsHistory");
        order.markModified("returnExchange");
        order.refundDetails && order.markModified("refundDetails");
        order.items && order.markModified("items");
      }

      await order.save();

      sendOrderStatusUpdateEmail({
        order,
        statusType: "refund",
        newStatus: "Refund Processing",
        notes: `₹${walletRefundAmount.toLocaleString()} credited instantly to BacStory Wallet. ₹${razorpayRefundAmount.toLocaleString()} processing via Razorpay (5-7 Working Days).`,
        meta: {
          refundAmount: refundAmountRs,
          refundMethod: `Original Payment Method (Split: ₹${walletRefundAmount.toLocaleString()} Wallet + ₹${razorpayRefundAmount.toLocaleString()} Razorpay)`,
        },
      }).catch((err) => console.error("[Order Email] Split refund email error:", err));

      const { syncUserWalletBalance } = require("../../config/walletHelper");
      await syncUserWalletBalance(order.user, order.shippingAddress?.email, order.shippingAddress?.phoneNumber);

      return res.status(200).json({
        success: true,
        message: `Split refund completed successfully! Rs ${walletRefundAmount.toLocaleString()} credited to BacStory Wallet and Rs ${razorpayRefundAmount.toLocaleString()} refunded via Razorpay (Refund ID: ${refundResult.id}).`,
        data: order
      });
    }

    // CASE 2: 100% BACSTORY WALLET REFUND
    if (walletRefundAmount > 0 && razorpayRefundAmount === 0) {
      if (customer) {
        customer.walletBalance = (customer.walletBalance || 0) + walletRefundAmount;
        if (!customer.walletTransactions) customer.walletTransactions = [];
        customer.walletTransactions.push({
          type: "credit",
          amount: walletRefundAmount,
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
      order.refundDetails.walletRefundId = walletRefundId;
      order.refundDetails.walletRefundAmount = walletRefundAmount;
      order.refundDetails.razorpayRefundAmount = 0;
      order.refundDetails.refundMethod = isExplicitWalletPayout ? "Bacstory Wallet" : "Original Payment Method (Wallet)";
      order.refundDetails.estimatedCreditWindow = "Instant Credit to BacStory Wallet";
      order.refundDetails.updatedAt = new Date();

      updateReturnRequestStatus(order, "Refunded", {
        refundAmount: walletRefundAmount,
        walletRefundAmount,
        razorpayRefundAmount: 0,
        refundId: walletRefundId,
        refundMethod: isExplicitWalletPayout ? "Bacstory Wallet" : "Original Payment Method",
        note: "Refund credited directly to customer's BacStory Wallet balance."
      }, requestId);

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          item.orderStatus = "Returned";
          item.paymentStatus = "Refunded";
        });
      }

      if (typeof order.markModified === "function") {
        order.markModified("returnRequestsHistory");
        order.markModified("returnExchange");
        order.refundDetails && order.markModified("refundDetails");
        order.items && order.markModified("items");
      }

      await order.save();
      await unclaimOrderQRCodes(order.orderId || order._id);

      sendOrderStatusUpdateEmail({
        order,
        statusType: "refund",
        newStatus: "Refunded",
        meta: {
          refundAmount: walletRefundAmount,
          refundMethod: "BacStory Wallet",
        },
      }).catch((err) => console.error("[Order Email] Wallet refund email error:", err));

      const { syncUserWalletBalance } = require("../../config/walletHelper");
      await syncUserWalletBalance(order.user, order.shippingAddress?.email, order.shippingAddress?.phoneNumber);

      return res.status(200).json({
        success: true,
        message: `Rs ${walletRefundAmount.toLocaleString()} credited directly to customer's BacStory Wallet!`,
        data: order
      });
    }

    // CASE 3: 100% RAZORPAY REFUND
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Razorpay Payment ID (pay_...) is missing on this order. Please provide razorpayPaymentId."
      });
    }

    let rzp;
    try {
      rzp = getRazorpayInstance();
    } catch (envErr) {
      return res.status(500).json({ success: false, message: envErr.message });
    }

    let refundResult;
    try {
      let paiseToRefund = Math.round(razorpayRefundAmount * 100);
      try {
        const paymentData = await rzp.payments.fetch(paymentId);
        if (paymentData && typeof paymentData.amount === "number") {
          const maxRefundablePaise = Math.max(0, paymentData.amount - (paymentData.amount_refunded || 0));
          if (paiseToRefund > maxRefundablePaise) {
            paiseToRefund = maxRefundablePaise;
          }
        }
      } catch (fetchErr) {
        console.warn("[Razorpay Refund] Warning fetching payment before refund:", fetchErr?.message);
      }

      refundResult = await rzp.payments.refund(paymentId, {
        amount: paiseToRefund,
        notes: {
          orderId: order.orderId,
          reason: targetReturn?.reason || "Return refund post inspection"
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
    order.refundDetails.razorpayRefundAmount = razorpayRefundAmount;
    order.refundDetails.walletRefundAmount = 0;
    order.refundDetails.estimatedCreditWindow = "5-7 Working Days";

    updateReturnRequestStatus(order, "Refund Initiated", { razorpayRefundId: refundResult.id, refundAmount: razorpayRefundAmount }, requestId);

    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item) => {
        item.orderStatus = "Return In Progress";
        item.paymentStatus = "Refund Processing";
      });
    }

    if (typeof order.markModified === "function") {
      order.markModified("returnRequestsHistory");
      order.markModified("returnExchange");
      order.refundDetails && order.markModified("refundDetails");
      order.items && order.markModified("items");
    }

    await order.save();
    await unclaimOrderQRCodes(order, targetReturn);

    sendOrderStatusUpdateEmail({
      order,
      statusType: "refund",
      newStatus: "Refund Processing",
      notes: "5-7 Working Days",
      meta: {
        refundAmount: razorpayRefundAmount,
        refundMethod: "Original Payment Method",
      },
    }).catch((err) => console.error("[Order Email] Razorpay refund email error:", err));

    return res.status(200).json({
      success: true,
      message: `Razorpay refund of Rs ${razorpayRefundAmount.toLocaleString()} initiated successfully (Refund ID: ${refundResult.id})!`,
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
    const { rejectionReason, requestId } = req.body || {};

    const isMongoId = id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
    const order = await Order.findOne({
      $or: [{ _id: isMongoId ? id : null }, { orderId: id.trim() }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    let targetReturn = null;
    if (requestId && Array.isArray(order.returnRequestsHistory)) {
      targetReturn = order.returnRequestsHistory.find(r => r.requestId === requestId || (r._id && r._id.toString() === requestId));
    }
    if (!targetReturn && Array.isArray(order.returnRequestsHistory) && order.returnRequestsHistory.length > 0) {
      targetReturn = order.returnRequestsHistory[order.returnRequestsHistory.length - 1];
    }
    if (!targetReturn) {
      targetReturn = order.returnExchange;
    }

    const hasAnyReturn = (targetReturn && (targetReturn.isRequested || targetReturn.status)) ||
      (order.returnExchange && (order.returnExchange.isRequested || order.returnExchange.status)) ||
      (Array.isArray(order.returnRequestsHistory) && order.returnRequestsHistory.length > 0);

    if (!hasAnyReturn) {
      return res.status(400).json({ success: false, message: "No return request found for this order." });
    }

    updateReturnRequestStatus(order, "Rejected", {
      rejectionReason: rejectionReason || "Request does not meet return policy criteria.",
      rejectedAt: new Date()
    }, requestId);

    if (order.orderStatus === "Return Requested" || order.orderStatus === "Exchange Requested") {
      order.orderStatus = "Delivered";
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          item.orderStatus = "Delivered";
        });
      }
    }

    await order.save();

    sendOrderStatusUpdateEmail({
      order,
      statusType: targetReturn?.requestType || "return",
      newStatus: "Return Rejected",
      notes: rejectionReason || "Request does not meet return policy criteria.",
    }).catch((err) => console.error("[Order Email] Reject return email error:", err));

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

    await unclaimOrderQRCodes(order);

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully."
    });
  } catch (error) {
    console.error("Admin delete order error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to delete order" });
  }
};

// Update Exchange status step-by-step
const updateExchangeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { requestId, status } = req.body || {};
    const isMongoId = id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
    const order = await Order.findOne({
      $or: [{ _id: isMongoId ? id : null }, { orderId: id.trim() }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const validExchangeStatuses = [
      "Product Picked Up",
      "Replacement Ready to Pack & Ship",
      "Replacement Dispatched",
      "Exchange Completed"
    ];

    if (!status || !validExchangeStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid exchange status." });
    }

    let additionalData = {};
    if (status === "Product Picked Up") additionalData.pickedUpAt = new Date();
    if (status === "Replacement Ready to Pack & Ship") additionalData.readyToShipAt = new Date();
    if (status === "Replacement Dispatched") additionalData.dispatchedAt = new Date();
    if (status === "Exchange Completed") additionalData.completedAt = new Date();

    updateReturnRequestStatus(order, status, additionalData, requestId);

    if (status === "Exchange Completed") {
      order.orderStatus = "Exchanged";
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => { item.orderStatus = "Exchanged"; });
      }
    } else {
      order.orderStatus = "Exchange In Progress";
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => { item.orderStatus = "Exchange In Progress"; });
      }
    }

    await order.save();

    sendOrderStatusUpdateEmail({
      order,
      statusType: "exchange",
      newStatus: status,
    }).catch((err) => console.error("[Order Email] Update exchange status email error:", err));

    if (status === "Exchange Completed" || status === "Product Picked Up") {
      await unclaimOrderQRCodes(order, order.returnExchange);
    }

    return res.status(200).json({
      success: true,
      message: `Exchange status updated to '${status}' successfully!`,
      data: order
    });
  } catch (error) {
    console.error("Admin update exchange status error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update exchange status" });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateRefundStatus,
  approveReturnRequest,
  markProductReceived,
  updateExchangeStatus,
  processReturnRefund,
  rejectReturnRequest,
  deleteOrder,
};
