const Order = require("../../models/Order");
const ShippingSetting = require("../../models/shippingSetting");
const { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } = require("../../services/emailService");

// Dynamic resolver for delivery days based on shipping method and database settings
const resolveOrderDeliveryEstimate = (shippingMethod, itemDeliveryDate, settings) => {
  const normMethod = String(shippingMethod || "").toLowerCase();
  let defaultDays = "3–5 business days";
  if (normMethod.includes("express")) {
    defaultDays = settings?.express?.deliveryDays || "1–2 business days";
  } else if (normMethod.includes("international")) {
    defaultDays = settings?.international?.deliveryDays || "7–14 business days";
  } else {
    defaultDays = settings?.standard?.deliveryDays || "3–5 business days";
  }

  // If itemDeliveryDate is valid and doesn't conflict with shipping method
  if (
    itemDeliveryDate &&
    !((normMethod.includes("express") || normMethod.includes("international")) && (itemDeliveryDate.includes("3-5") || itemDeliveryDate.includes("3–5")))
  ) {
    return itemDeliveryDate.toLowerCase().startsWith("estimated")
      ? itemDeliveryDate
      : `Estimated Delivery: ${itemDeliveryDate}`;
  }

  return defaultDays.toLowerCase().startsWith("estimated")
    ? defaultDays
    : `Estimated Delivery: ${defaultDays}`;
};

const formatOrderResponse = (order, settings) => {
  if (!order) return order;
  const plainOrder = order.toObject ? order.toObject() : { ...order };
  const resolvedDelivery = resolveOrderDeliveryEstimate(
    plainOrder.shippingMethod,
    plainOrder.estimatedDelivery || (plainOrder.items && plainOrder.items[0]?.deliveryDate),
    settings
  );
  plainOrder.estimatedDelivery = resolvedDelivery;
  if (Array.isArray(plainOrder.items)) {
    plainOrder.items = plainOrder.items.map((i) => ({
      ...i,
      deliveryDate: resolveOrderDeliveryEstimate(plainOrder.shippingMethod, i.deliveryDate, settings),
    }));
  }
  return plainOrder;
};

// Save new order to MongoDB
const createOrderRecord = async (req, res) => {
  try {
    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      shippingAddress,
      items,
      subtotal,
      discountAmount,
      prepaidDiscount,
      shippingCost,
      taxAmount,
      totalAmount,
      walletDeduction,
      paymentMethod,
      shippingMethod,
      paymentStatus,
      estimatedDelivery,
    } = req.body;

    const isCod = paymentMethod === "Cash on Delivery (COD)" || paymentMethod === "COD" || paymentStatus === "COD";
    const finalRazorpayOrderId = razorpayOrderId || (isCod ? `order_COD_${Date.now()}` : "");
    const finalRazorpayPaymentId = razorpayPaymentId || (isCod ? `pay_COD_${Date.now()}` : "");

    if (!orderId || !finalRazorpayOrderId || !finalRazorpayPaymentId || !items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: "Missing required order details",
      });
    }

    const finalPaymentStatus = isCod ? "COD" : (paymentStatus || "Paid");
    const userId = req.user ? (req.user.id || req.user._id) : null;

    // Handle wallet deduction if wallet payment was used
    if (walletDeduction && walletDeduction > 0) {
      try {
        const User = require("../../models/user");
        let customer = null;
        if (userId) customer = await User.findById(userId);
        if (!customer && shippingAddress?.email) customer = await User.findOne({ email: shippingAddress.email.toLowerCase().trim() });
        if (!customer && shippingAddress?.phoneNumber) customer = await User.findOne({ phoneNumber: shippingAddress.phoneNumber.trim() });

        if (customer) {
          const deductAmt = Math.min(customer.walletBalance || 0, Number(walletDeduction));
          customer.walletBalance = Math.max(0, (customer.walletBalance || 0) - deductAmt);
          if (!customer.walletTransactions) customer.walletTransactions = [];
          customer.walletTransactions.push({
            type: "debit",
            amount: deductAmt,
            description: `Payment for Order #${orderId}`,
            orderId: orderId,
            createdAt: new Date()
          });
          await customer.save();
        }
      } catch (wltErr) {
        console.error("Error debiting user wallet balance:", wltErr);
      }
    }

    const shippingSettings = await ShippingSetting.findOne().catch(() => null);
    const dynamicDeliveryDate = resolveOrderDeliveryEstimate(
      shippingMethod,
      estimatedDelivery || (items && items[0] && items[0].deliveryDate),
      shippingSettings
    );

    const newOrder = await Order.create({
      user: userId,
      orderId,
      razorpayOrderId: finalRazorpayOrderId,
      razorpayPaymentId: finalRazorpayPaymentId,
      razorpaySignature: razorpaySignature || "",
      shippingAddress: shippingAddress || {},
      items: items.map((item) => ({
        product: item.productId && item.productId.length === 24 ? item.productId : null,
        name: item.name || "Product",
        category: item.category || "COLLECTION",
        size: item.size || "M",
        color: item.color || "Standard",
        colorHex: item.colorHex || "#000000",
        price: item.price || `Rs ${item.priceNum || 0}`,
        priceNum: item.priceNum || 0,
        quantity: item.quantity || 1,
        image: item.image || "",
        orderStatus: "Order Confirmed",
        paymentStatus: finalPaymentStatus,
        deliveryDate: resolveOrderDeliveryEstimate(shippingMethod, item.deliveryDate, shippingSettings),
      })),
      subtotal: subtotal || 0,
      discountAmount: discountAmount || 0,
      prepaidDiscount: Number(prepaidDiscount) || 0,
      shippingCost: shippingCost || 0,
      taxAmount: taxAmount || 0,
      totalAmount: totalAmount || 0,
      walletDeduction: Number(walletDeduction) || 0,
      paymentMethod: paymentMethod || (isCod ? "Cash on Delivery (COD)" : "Razorpay / Prepaid"),
      shippingMethod: shippingMethod || "Standard Delivery",
      estimatedDelivery: dynamicDeliveryDate,
      paymentStatus: finalPaymentStatus,
      orderStatus: "Order Confirmed",
      statusTimeline: [
        {
          status: "Order Confirmed",
          timestamp: new Date(),
          note: "Order placed and payment confirmed"
        }
      ],
    });

    // Auto-save/update shipping address in user's saved addresses in database
    if (userId && shippingAddress && shippingAddress.streetAddress) {
      try {
        const User = require("../../models/user");
        const userObj = await User.findById(userId);
        if (userObj) {
          const recipient = `${shippingAddress.firstName || ""} ${shippingAddress.lastName || ""}`.trim() || userObj.name || "Customer";
          const cityStatePinStr = `${shippingAddress.city || ""}, ${shippingAddress.state || ""} - ${shippingAddress.pinCode || ""}`.trim();
          const targetLine1 = (shippingAddress.streetAddress || "").trim().toLowerCase();
          const targetCityStatePin = cityStatePinStr.toLowerCase();

          const existingIndex = userObj.addresses.findIndex((addr) => {
            const matchLine1 = (addr.addressLine1 || "").trim().toLowerCase() === targetLine1;
            const matchCityStatePin = (addr.cityStatePin || "").trim().toLowerCase() === targetCityStatePin;
            return matchLine1 && matchCityStatePin;
          });

          if (existingIndex !== -1) {
            userObj.addresses[existingIndex].recipientName = recipient;
            if (shippingAddress.phoneNumber) userObj.addresses[existingIndex].phone = shippingAddress.phoneNumber;
          } else {
            const isFirst = userObj.addresses.length === 0;
            if (isFirst) {
              userObj.addresses.forEach(a => a.isDefault = false);
            }
            userObj.addresses.push({
              name: "Home",
              recipientName: recipient,
              addressLine1: shippingAddress.streetAddress.trim(),
              addressLine2: "",
              cityStatePin: cityStatePinStr,
              phone: shippingAddress.phoneNumber || userObj.phoneNumber || "",
              isDefault: isFirst || userObj.addresses.length === 0,
            });
          }
          await userObj.save();
        }
      } catch (addrErr) {
        console.error("Error auto-saving order address to user profile:", addrErr);
      }
    }

    // Send order confirmation email to customer
    try {
      let recipientEmail = (shippingAddress?.email || "").trim().toLowerCase();
      if (!recipientEmail && userId) {
        const User = require("../../models/user");
        const userDoc = await User.findById(userId).select("email");
        if (userDoc?.email) {
          recipientEmail = userDoc.email.trim().toLowerCase();
        }
      }

      if (recipientEmail) {
        sendOrderConfirmationEmail({
          order: newOrder,
          recipientEmail,
        })
          .then((mailRes) => {
            if (mailRes.success) {
              console.log(`[Order] Confirmation email dispatched successfully to ${recipientEmail} for order #${newOrder.orderId}`);
            } else {
              console.warn(`[Order] Confirmation email dispatch notice for ${recipientEmail}:`, mailRes.error || mailRes.message);
            }
          })
          .catch((mailErr) => {
            console.error(`[Order] Background error sending confirmation email to ${recipientEmail}:`, mailErr.message || mailErr);
          });
      } else {
        console.warn(`[Order] No recipient email provided for order #${newOrder.orderId}; confirmation email skipped.`);
      }
    } catch (triggerErr) {
      console.error("[Order] Error triggering confirmation email:", triggerErr);
    }

    return res.status(201).json({
      success: true,
      message: "Order recorded successfully in database",
      data: newOrder,
    });
  } catch (error) {
    console.error("Error creating order record in DB:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save order to database",
    });
  }
};

// Get orders for current user or guest (returns real-time orderStatus from DB)
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user ? (req.user.id || req.user._id) : null;
    const userEmail = req.user ? req.user.email : null;
    const userPhone = req.user ? req.user.phoneNumber : null;
    const { email, phone } = req.query;

    const targetEmail = (userEmail || email || "").toLowerCase().trim();
    const targetPhone = (userPhone || phone || "").trim();

    let queryConditions = [];

    if (userId) {
      queryConditions.push({ user: userId });
    }
    if (targetEmail) {
      queryConditions.push({ "shippingAddress.email": targetEmail });
    }
    if (targetPhone) {
      queryConditions.push({ "shippingAddress.phoneNumber": targetPhone });
    }

    if (queryConditions.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const orders = await Order.find({
      $or: queryConditions,
      userDeleted: { $ne: true }
    })
      .populate("items.product", "title slug _id price colors")
      .sort({ createdAt: -1 });

    const shippingSettings = await ShippingSetting.findOne().catch(() => null);
    const formattedOrders = orders.map((o) => formatOrderResponse(o, shippingSettings));

    return res.status(200).json({
      success: true,
      data: formattedOrders,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch orders",
    });
  }
};

// Get real-time status of a specific order by orderId (e.g. BSC-985578)
const getTrackOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID is required" });
    }

    const isMongoId = orderId.length === 24 && /^[0-9a-fA-F]{24}$/.test(orderId);
    const order = await Order.findOne({
      $or: [{ orderId: orderId.trim() }, { _id: isMongoId ? orderId : null }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const shippingSettings = await ShippingSetting.findOne().catch(() => null);
    const formattedOrder = formatOrderResponse(order, shippingSettings);

    return res.status(200).json({
      success: true,
      data: {
        orderId: formattedOrder.orderId,
        orderStatus: formattedOrder.orderStatus,
        paymentStatus: formattedOrder.paymentStatus,
        paymentMethod: formattedOrder.paymentMethod,
        shippingMethod: formattedOrder.shippingMethod,
        estimatedDelivery: formattedOrder.estimatedDelivery,
        createdAt: formattedOrder.createdAt,
        updatedAt: formattedOrder.updatedAt,
        items: formattedOrder.items,
        shippingAddress: formattedOrder.shippingAddress,
        subtotal: formattedOrder.subtotal,
        discountAmount: formattedOrder.discountAmount,
        prepaidDiscount: formattedOrder.prepaidDiscount,
        shippingCost: formattedOrder.shippingCost,
        taxAmount: formattedOrder.taxAmount,
        totalAmount: formattedOrder.totalAmount,
        walletDeduction: formattedOrder.walletDeduction,
        cancellation: formattedOrder.cancellation,
        returnExchange: formattedOrder.returnExchange,
        returnRequestsHistory: formattedOrder.returnRequestsHistory || [],
        refundDetails: formattedOrder.refundDetails,
        statusTimeline: formattedOrder.statusTimeline || [],
      },
    });
  } catch (error) {
    console.error("Error tracking order status:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to track order status",
    });
  }
};

// Get complete order details by orderId or _id
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID is required" });
    }

    const mongoose = require("mongoose");
    const isMongoId = orderId.length === 24 && /^[0-9a-fA-F]{24}$/.test(orderId);
    const order = await Order.findOne({
      $or: [
        { orderId: orderId.trim() },
        { orderId: { $regex: new RegExp(`^${orderId.trim()}$`, "i") } },
        { _id: isMongoId ? orderId : null }
      ]
    }).populate("items.product", "title slug _id price colors");

    if (!order || order.userDeleted) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const shippingSettings = await ShippingSetting.findOne().catch(() => null);

    return res.status(200).json({
      success: true,
      data: formatOrderResponse(order, shippingSettings),
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch order details",
    });
  }
};

// Cancel order before packing (Free of charge before dispatch)
const cancelUserOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID is required" });
    }

    const isMongoId = orderId.length === 24 && /^[0-9a-fA-F]{24}$/.test(orderId);
    const order = await Order.findOne({
      $or: [{ _id: isMongoId ? orderId : null }, { orderId: orderId.trim() }]
    });

    if (!order || order.userDeleted) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Check packing/dispatch status policy rule:
    // "Customers may cancel their order free of charge before it has been packed for dispatch. Once packed or shipped, orders cannot be cancelled."
    const nonCancellableStatuses = [
      "Ready to Pack & Ship",
      "Dispatched & In Transit",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
      "Returned"
    ];

    if (nonCancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled. Status is '${order.orderStatus}'. Orders can only be cancelled before being packed for dispatch.`
      });
    }

    // Free cancellation before dispatch -> 100% refund for prepaid orders, 0 fee
    const isPrepaid = order.paymentStatus === "Confirmed" || order.paymentStatus === "Paid" || order.paymentMethod === "Prepaid" || (order.paymentStatus !== "COD" && order.paymentStatus !== "Cancelled (Unpaid)" && order.paymentStatus !== "Failed");
    const fullRefundAmount = isPrepaid ? order.totalAmount : 0;

    order.orderStatus = "Cancelled";
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item) => {
        item.orderStatus = "Cancelled";
      });
    }

    order.cancellation = {
      isCancelled: true,
      cancelledAt: new Date(),
      cancellationReason: reason || "Cancelled by customer before dispatch",
      cancellationFee: 0, // No cancellation fee charged
      refundAmount: fullRefundAmount
    };

    if (!Array.isArray(order.statusTimeline)) {
      order.statusTimeline = [];
    }
    order.statusTimeline.push({
      status: "Cancelled",
      timestamp: new Date(),
      note: reason || "Cancelled by customer before dispatch"
    });

    if (isPrepaid) {
      let razorpayRefundId = "";
      let isRefundProcessed = false;
      if (order.razorpayPaymentId && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        try {
          const Razorpay = require("razorpay");
          const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
          });
          const refundRes = await razorpay.payments.refund(order.razorpayPaymentId, {
            amount: Math.round(order.totalAmount * 100),
            notes: { orderId: order.orderId, reason: reason || "Customer Order Cancellation" }
          });
          if (refundRes && refundRes.id) {
            razorpayRefundId = refundRes.id;
            isRefundProcessed = refundRes.status === "processed" || true;
          }
        } catch (rzpErr) {
          console.error("Razorpay API refund call notice:", rzpErr.message || rzpErr);
        }
      }

      const finalPayStatus = (isRefundProcessed || razorpayRefundId) ? "Refunded" : "Refund Pending";
      const finalRefundStatus = (isRefundProcessed || razorpayRefundId) ? "Processed / Credited" : "Refund Pending";

      order.paymentStatus = finalPayStatus;
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          item.paymentStatus = finalPayStatus;
        });
      }

      order.refundDetails = {
        refundMethod: "Original Payment Method",
        refundStatus: finalRefundStatus,
        refundAmount: fullRefundAmount,
        refundId: razorpayRefundId,
        razorpayRefundId,
        initiatedAt: new Date(),
        updatedAt: new Date(),
        estimatedCreditWindow: "5-7 Business Days"
      };

      if (finalPayStatus === "Refunded") {
        order.statusTimeline.push({
          status: "Refunded",
          timestamp: new Date(),
          note: `Refund of Rs ${fullRefundAmount} credited via Original Payment Method`
        });
      }
    } else {
      order.paymentStatus = "Cancelled (Unpaid)";
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          item.paymentStatus = "Cancelled (Unpaid)";
        });
      }
    }

    await order.save();

    sendOrderStatusUpdateEmail({
      order,
      statusType: "cancellation",
      newStatus: "Cancelled",
      notes: reason || "Cancelled by customer before dispatch",
      meta: {
        refundAmount: isPrepaid ? order.totalAmount : 0,
      },
    }).catch((emailErr) => console.error("[Order Email] Cancel notification error:", emailErr));

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully. 100% refund initiated for prepaid orders (no cancellation fee).",
      data: order
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel order"
    });
  }
};

// Helper to calculate eligible replacement variants for an item being exchanged
const getEligibleExchangeVariants = (productDoc, orderedSize, orderedColor) => {
  if (!productDoc) return [];

  const normOrdSize = (orderedSize || "").toUpperCase().trim();
  const normOrdColor = (orderedColor || "").toLowerCase().trim();

  const variantMap = new Map();
  const colorsSet = new Set();
  const sizesSet = new Set();

  if (Array.isArray(productDoc.colors)) {
    productDoc.colors.forEach(c => {
      const cName = c.color?.name || (typeof c.color === "string" ? c.color : null);
      if (cName) colorsSet.add(cName.trim());
    });
  }

  if (productDoc.sizeGuide?.chart && Array.isArray(productDoc.sizeGuide.chart)) {
    productDoc.sizeGuide.chart.forEach(sz => {
      if (sz.size) sizesSet.add(sz.size.trim().toUpperCase());
    });
  }

  if (productDoc.variantStock && typeof productDoc.variantStock === "object") {
    const keys = Object.keys(productDoc.variantStock);
    const validSizes = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "FREE", "ONESIZE"];

    keys.forEach(k => {
      const parts = k.split("_");
      if (parts.length >= 2) {
        const first = parts[0].toUpperCase().trim();
        const rest = parts.slice(1).join("_").trim();
        if (validSizes.includes(first)) {
          sizesSet.add(first);
          if (rest) colorsSet.add(rest);
        } else {
          colorsSet.add(first);
          if (validSizes.includes(rest.toUpperCase())) {
            sizesSet.add(rest.toUpperCase());
          }
        }
      }
    });
  }

  const allColors = Array.from(colorsSet);
  const allSizes = Array.from(sizesSet);

  const getStock = (sz, col) => {
    const szUpper = sz.toUpperCase().trim();
    const colLower = col.toLowerCase().trim();

    if (Array.isArray(productDoc.inventory) && productDoc.inventory.length > 0) {
      const match = productDoc.inventory.find(
        inv => inv.size?.toUpperCase().trim() === szUpper && inv.color?.toLowerCase().trim() === colLower
      );
      if (match && typeof match.stock === "number") return Math.max(0, match.stock);
    }

    if (productDoc.variantStock && typeof productDoc.variantStock === "object") {
      const exactKey = `${szUpper}_${colLower}`;
      if (typeof productDoc.variantStock[exactKey] === "number") {
        return Math.max(0, productDoc.variantStock[exactKey]);
      }
      const vsKeys = Object.keys(productDoc.variantStock);
      const targetNorm = exactKey.replace(/[\s\-_]/g, "");
      const targetRev = `${colLower}_${szUpper}`.replace(/[\s\-_]/g, "");
      const matchKey = vsKeys.find(k => {
        const kNorm = k.toLowerCase().replace(/[\s\-_]/g, "");
        return kNorm === targetNorm || kNorm === targetRev;
      });
      if (matchKey && typeof productDoc.variantStock[matchKey] === "number") {
        return Math.max(0, productDoc.variantStock[matchKey]);
      }
    }
    return 0;
  };

  allColors.forEach(col => {
    allSizes.forEach(sz => {
      const stock = getStock(sz, col);
      const szNorm = sz.toUpperCase().trim();
      const colNorm = col.toLowerCase().trim();

      const isOriginalVariant = (szNorm === normOrdSize && colNorm === normOrdColor);

      // Must have stock > 0 AND must NOT be the exact original ordered variant
      if (stock > 0 && !isOriginalVariant) {
        const variantKey = `${colNorm}:::${szNorm}`;
        if (!variantMap.has(variantKey)) {
          variantMap.set(variantKey, {
            color: col,
            size: sz,
            stock
          });
        }
      }
    });
  });

  return Array.from(variantMap.values());
};

// Find order details for return/exchange lookup step
const findOrderForReturn = async (req, res) => {
  try {
    const { orderId, email } = req.query;
    if (!orderId && !email) {
      return res.status(400).json({ success: false, message: "Order number or email address is required" });
    }

    let queryConditions = [];
    if (orderId) {
      const isMongoId = orderId.length === 24 && /^[0-9a-fA-F]{24}$/.test(orderId);
      queryConditions.push({ $or: [{ orderId: orderId.trim() }, { _id: isMongoId ? orderId : null }] });
    }
    if (email) {
      queryConditions.push({ "shippingAddress.email": email.trim().toLowerCase() });
    }

    const order = await Order.findOne({ $and: queryConditions })
      .populate({
        path: "items.product",
        populate: { path: "colors.color", select: "name hexCode" }
      })
      .sort({ createdAt: -1 });

    if (!order || order.userDeleted) {
      return res.status(404).json({ success: false, message: "No matching order found. Please check your order number and email." });
    }

    const formattedOrder = order.toObject();
    if (formattedOrder.items && Array.isArray(formattedOrder.items)) {
      formattedOrder.items = formattedOrder.items.map((item) => {
        const eligibleExchangeVariants = getEligibleExchangeVariants(item.product, item.size, item.color);
        const availableColors = Array.from(new Set(eligibleExchangeVariants.map(v => v.color)));
        const availableSizes = Array.from(new Set(eligibleExchangeVariants.map(v => v.size)));

        return {
          ...item,
          eligibleExchangeVariants,
          availableColors,
          availableSizes
        };
      });
    }

    // Eligibility check according to Bacstory policy
    const isDelivered = (order.orderStatus || "").toLowerCase().trim() === "delivered" ||
      (Array.isArray(order.items) && order.items.some(i => (i.orderStatus || "").toLowerCase().trim() === "delivered"));
    const deliveredTimelineEntry = (order.statusTimeline || []).find(e => (e.status || "").toLowerCase().includes("delivered"));
    const deliveryDateMs = deliveredTimelineEntry?.timestamp
      ? new Date(deliveredTimelineEntry.timestamp).getTime()
      : (order.updatedAt ? new Date(order.updatedAt).getTime() : new Date(order.createdAt).getTime());
    const daysSinceDelivery = Math.floor((Date.now() - deliveryDateMs) / (1000 * 60 * 60 * 24));
    const isWithin7Days = daysSinceDelivery <= 7;
    const isWithin48Hours = (Date.now() - deliveryDateMs) <= (48 * 60 * 60 * 1000);
    const hasAlreadyExchanged = order.returnExchange?.isRequested && order.returnExchange?.requestType === "exchange";

    return res.status(200).json({
      success: true,
      data: formattedOrder,
      eligibility: {
        isDelivered,
        daysSinceDelivery,
        isWithin7Days,
        isWithin48Hours,
        hasAlreadyExchanged,
        canReturn: isDelivered && isWithin7Days,
        canExchange: isDelivered && isWithin7Days && !hasAlreadyExchanged
      }
    });
  } catch (error) {
    console.error("Error finding order for return:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to find order" });
  }
};

// Submit Return or Exchange Request
const submitReturnExchange = async (req, res) => {
  try {
    const {
      orderId,
      requestType, // "return" | "exchange"
      reason,
      additionalNotes,
      requestedSize,
      requestedColor,
      proofPhotos,
      unboxingVideo,
      reportedWithin48Hours,
      refundMethod, // "Original Payment Method" | "Bacstory Wallet" | "Bank Transfer" | "UPI"
      bankHolderName,
      accountNumber,
      ifscCode,
      upiId,
      items // Array of { itemId, name, size, color, returnQuantity, image }
    } = req.body;

    if (!orderId || !requestType || !reason) {
      return res.status(400).json({
        success: false,
        message: "Order ID, request type, and reason are required."
      });
    }

    const isMongoId = orderId.length === 24 && /^[0-9a-fA-F]{24}$/.test(orderId);
    const order = await Order.findOne({
      $or: [{ _id: isMongoId ? orderId : null }, { orderId: orderId.trim() }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Policy Check 1: One exchange allowed per order
    if (requestType === "exchange" && order.returnExchange?.isRequested && order.returnExchange?.requestType === "exchange") {
      return res.status(400).json({
        success: false,
        message: "Only one exchange is allowed per order."
      });
    }

    // Policy Check 1b: Exchange replacement variant validation
    if (requestType === "exchange") {
      if (!requestedSize || !requestedColor) {
        return res.status(400).json({
          success: false,
          message: "Please select a replacement size and color for exchange."
        });
      }

      const reqItemsList = Array.isArray(items) ? items : [];
      for (const reqItem of reqItemsList) {
        const origItem = order.items?.find(i => (i._id?.toString() === reqItem.itemId || i.id === reqItem.itemId || i.name === reqItem.name));
        if (origItem) {
          const origSize = (origItem.size || "").toUpperCase().trim();
          const origColor = (origItem.color || "").toLowerCase().trim();
          const reqSize = (requestedSize || "").toUpperCase().trim();
          const reqColor = (requestedColor || "").toLowerCase().trim();

          if (origSize === reqSize && origColor === reqColor) {
            return res.status(400).json({
              success: false,
              message: `The replacement variant (${requestedSize} / ${requestedColor}) cannot be identical to the originally ordered variant.`
            });
          }
        }
      }
    }

    // Policy Check 2: 7-day return & exchange window
    const deliveredTimelineEntry = (order.statusTimeline || []).find(e => (e.status || "").toLowerCase().includes("delivered"));
    const deliveryDateMs = deliveredTimelineEntry?.timestamp
      ? new Date(deliveredTimelineEntry.timestamp).getTime()
      : (order.updatedAt ? new Date(order.updatedAt).getTime() : new Date(order.createdAt).getTime());
    const daysSinceDelivery = Math.floor((Date.now() - deliveryDateMs) / (1000 * 60 * 60 * 24));
    const isOrderDelivered = (order.orderStatus || "").toLowerCase().trim() === "delivered" ||
      (Array.isArray(order.items) && order.items.some(i => (i.orderStatus || "").toLowerCase().trim() === "delivered"));
    if (!isOrderDelivered) {
      return res.status(400).json({
        success: false,
        message: "Return or exchange cannot be requested for orders that have not yet been delivered."
      });
    }
    if (isOrderDelivered && daysSinceDelivery > 7) {
      return res.status(400).json({
        success: false,
        message: "The 7-day return and exchange policy window has expired for this order."
      });
    }

    // Policy Check 3: Damaged or Wrong Product Policy Verification Check
    // Unboxing video is mandatory ONLY for "Item defective or damaged" and "Received wrong item" reports
    const isDamagedOrWrong = ["Item defective or damaged", "Received wrong item", "Damaged product", "Incorrect product"].some(r =>
      reason.toLowerCase().includes(r.toLowerCase())
    );

    const isWithin48Hours = (Date.now() - deliveryDateMs) <= (48 * 60 * 60 * 1000);

    if (isDamagedOrWrong) {
      if (!isWithin48Hours) {
        return res.status(400).json({
          success: false,
          message: "Damaged, defective, or wrong products must be reported within 48 hours of delivery. The 48-hour reporting deadline has passed."
        });
      }
      if (!unboxingVideo || !unboxingVideo.trim()) {
        return res.status(400).json({
          success: false,
          message: "A complete unboxing video is mandatory for damaged or incorrect product reports."
        });
      }
    }

    // Calculate Return Shipping Fee:
    // Applicable (₹99) ONLY if customer selects "Changed my mind" or "Other".
    // For all other reasons, return shipping is free (₹0).
    const normalizedReason = (reason || "").trim().toLowerCase();
    const isFeeApplicableReason = requestType === "return" && (
      normalizedReason.includes("mind") ||
      normalizedReason === "other" ||
      normalizedReason.startsWith("other")
    );
    const returnShippingFee = isFeeApplicableReason ? 99 : 0;

    let finalRefundMethod = "Original Payment Method";
    let refundAmount = 0;

    if (requestType === "return") {
      const isCodOrder = order.paymentMethod === "COD" || order.paymentStatus === "COD";
      finalRefundMethod = refundMethod || (isCodOrder ? "Bank Transfer" : "Original Payment Method");

      if (isCodOrder && finalRefundMethod === "Original Payment Method") {
        return res.status(400).json({
          success: false,
          message: "Original payment method is not applicable for Cash on Delivery orders. Please select Bank Transfer, UPI, or Bacstory Wallet."
        });
      }

      let itemsSubtotal = 0;
      const parseNumericPrice = (val, fallback = 0) => {
        if (typeof val === "number") return isNaN(val) ? fallback : val;
        if (!val) return fallback;
        const cleaned = String(val).replace(/[^0-9.]/g, "");
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? fallback : parsed;
      };

      const orderPaidAmount = parseNumericPrice(order.totalAmount !== undefined ? order.totalAmount : order.orderTotal, 0);

      // Total catalog subtotal of all items in the original order
      const orderOriginalSubtotal = order.subtotal > 0
        ? parseNumericPrice(order.subtotal, 0)
        : (order.items && Array.isArray(order.items)
            ? order.items.reduce((s, it) => s + (parseNumericPrice(it.priceNum ?? it.price, 0) * (it.quantity || 1)), 0)
            : orderPaidAmount);

      if (Array.isArray(items) && items.length > 0) {
        items.forEach(reqItem => {
          const origItem = order.items?.find(i => (reqItem.itemId && (i._id?.toString() === reqItem.itemId || i.id === reqItem.itemId)) || (reqItem.name && i.name === reqItem.name));
          const unitPrice = origItem
            ? parseNumericPrice(origItem.priceNum ?? origItem.price, 0)
            : 0;
          const qty = parseNumericPrice(reqItem.returnQuantity, 1);
          itemsSubtotal += (unitPrice * qty);
        });
      } else {
        itemsSubtotal = orderOriginalSubtotal;
      }

      // Proportional discount calculation:
      // Exclude order-level shipping and tax so shipping is NOT refunded for partial returns.
      const orderShippingCost = parseNumericPrice(order.shippingCost, 0);
      const orderTaxAmount = parseNumericPrice(order.taxAmount, 0);
      const netItemsPaid = Math.max(0, orderPaidAmount - orderShippingCost - orderTaxAmount);

      const storedPrepaidDiscount = parseNumericPrice(order.prepaidDiscount, 0);
      const totalItemDiscount = orderOriginalSubtotal > 0
        ? Math.max(0, orderOriginalSubtotal - netItemsPaid)
        : 0;

      // Determine proportional discount rate applied to items:
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

      const discountShareForReturned = Math.round(itemsSubtotal * itemDiscountRate * 100) / 100;

      // If customer paid ₹0 (e.g. promo code, marketing giveaway, gift), refund is ₹0.
      // Otherwise, refund the proportional amount actually paid for the returned items.
      const effectivePaidForReturned = orderPaidAmount === 0 
        ? 0 
        : Math.max(0, Math.min(netItemsPaid, Math.round((itemsSubtotal - discountShareForReturned) * 100) / 100));

      const calculatedRefund = Math.max(0, Math.round((effectivePaidForReturned - returnShippingFee) * 100) / 100);
      refundAmount = parseNumericPrice(calculatedRefund, 0);

      order.refundDetails = {
        refundMethod: finalRefundMethod,
        refundAmount,
        returnShippingFee,
        bankHolderName: bankHolderName || "",
        accountNumber: accountNumber || "",
        ifscCode: ifscCode || "",
        upiId: upiId || "",
        refundStatus: "None",
        estimatedCreditWindow: "5-7 Business Days"
      };
    }

    const initialStatus = requestType === "exchange" ? "Exchange Requested" : "Return Requested";
    const requestId = `RET-${Date.now()}`;

    const newReturnEntry = {
      requestId,
      requestType,
      reason,
      additionalNotes: additionalNotes || "",
      requestedSize: requestedSize || "",
      requestedColor: requestedColor || "",
      proofPhotos: Array.isArray(proofPhotos) ? proofPhotos : [],
      unboxingVideo: unboxingVideo || "",
      reportedWithin48Hours: !!reportedWithin48Hours,
      requestedItems: Array.isArray(items) ? items : [],
      returnShippingFee,
      refundAmount,
      refundMethod: finalRefundMethod,
      bankHolderName: bankHolderName || "",
      accountNumber: accountNumber || "",
      ifscCode: ifscCode || "",
      upiId: upiId || "",
      requestedAt: new Date(),
      status: initialStatus
    };

    order.returnExchange = {
      isRequested: true,
      requestType,
      reason,
      additionalNotes: additionalNotes || "",
      requestedSize: requestedSize || "",
      requestedColor: requestedColor || "",
      proofPhotos: Array.isArray(proofPhotos) ? proofPhotos : [],
      unboxingVideo: unboxingVideo || "",
      reportedWithin48Hours: !!reportedWithin48Hours,
      requestedItems: Array.isArray(items) ? items : [],
      returnShippingFee,
      requestedAt: new Date(),
      status: initialStatus
    };

    if (!Array.isArray(order.returnRequestsHistory)) {
      order.returnRequestsHistory = [];
    }
    order.returnRequestsHistory.push(newReturnEntry);

    // Update main order status to Return Requested / Exchange Requested
    order.orderStatus = initialStatus;

    // Update matching items status
    if (order.items && Array.isArray(order.items)) {
      const reqItemIds = Array.isArray(items) ? items.map(it => it.itemId) : [];
      order.items.forEach(it => {
        const itemIdStr = it._id?.toString() || it.id;
        if (reqItemIds.length === 0 || reqItemIds.includes(itemIdStr) || reqItemIds.includes(it.name)) {
          it.orderStatus = initialStatus;
        }
      });
    }

    // Add entry to statusTimeline
    if (!Array.isArray(order.statusTimeline)) {
      order.statusTimeline = [];
    }
    order.statusTimeline.push({
      status: initialStatus,
      timestamp: new Date(),
      note: reason ? `${reason}` : `${initialStatus} by customer`
    });

    if (order.paymentStatus !== "COD" && order.paymentStatus !== "Cancelled (Unpaid)") {
      order.paymentStatus = "Paid";
    }

    await order.save();

    sendOrderStatusUpdateEmail({
      order,
      statusType: requestType,
      newStatus: initialStatus,
      notes: reason || "",
      meta: {
        refundAmount,
      },
    }).catch((emailErr) => console.error("[Order Email] Return/Exchange submit notification error:", emailErr));

    return res.status(200).json({
      success: true,
      message: `${requestType === "return" ? "Return" : "Exchange"} request submitted successfully! Refunds/exchanges are processed after quality inspection within 2 business days.`,
      data: order
    });
  } catch (error) {
    console.error("Error submitting return/exchange request:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit request"
    });
  }
};

// Upload Return/Exchange Proof Photos or Video
const uploadReturnProofMedia = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded.",
      });
    }

    const uploaded = req.files.map((file) => ({
      url: `/uploads/${file.filename}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      type: file.mimetype.startsWith("video/") ? "video" : "image"
    }));

    return res.status(200).json({
      success: true,
      message: "Proof files uploaded successfully.",
      data: uploaded,
    });
  } catch (error) {
    console.error("Error uploading return proof files:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload proof files.",
    });
  }
};

module.exports = {
  createOrderRecord,
  getUserOrders,
  getTrackOrderStatus,
  getOrderDetails,
  cancelUserOrder,
  submitReturnExchange,
  findOrderForReturn,
  uploadReturnProofMedia,
};

