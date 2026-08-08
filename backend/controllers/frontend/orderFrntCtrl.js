const Order = require("../../models/Order");

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
      shippingCost,
      taxAmount,
      totalAmount,
      walletDeduction,
      paymentMethod,
    } = req.body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: "Missing required order details",
      });
    }

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

    const newOrder = await Order.create({
      user: userId,
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
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
        paymentStatus: "Paid",
        deliveryDate: "Estimated Delivery: 3-5 Business Days",
      })),
      subtotal: subtotal || 0,
      discountAmount: discountAmount || 0,
      shippingCost: shippingCost || 0,
      taxAmount: taxAmount || 0,
      totalAmount: totalAmount || 0,
      walletDeduction: Number(walletDeduction) || 0,
      paymentMethod: paymentMethod || "Razorpay / Prepaid",
      paymentStatus: "Paid",
      orderStatus: "Order Confirmed",
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

    const orders = await Order.find({ $or: queryConditions }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: orders,
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

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.orderId,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items,
        shippingAddress: order.shippingAddress,
        cancellation: order.cancellation,
        returnExchange: order.returnExchange,
        returnRequestsHistory: order.returnRequestsHistory || [],
        refundDetails: order.refundDetails,
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

    if (!order) {
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
    } else {
      order.paymentStatus = "Cancelled (Unpaid)";
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          item.paymentStatus = "Cancelled (Unpaid)";
        });
      }
    }

    await order.save();

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

    if (!order) {
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
    const isDelivered = order.orderStatus === "Delivered";
    const deliveryDateMs = order.updatedAt ? new Date(order.updatedAt).getTime() : new Date(order.createdAt).getTime();
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
        canReturn: isWithin7Days,
        canExchange: isWithin7Days && !hasAlreadyExchanged
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
    const deliveryDateMs = order.updatedAt ? new Date(order.updatedAt).getTime() : new Date(order.createdAt).getTime();
    const daysSinceDelivery = Math.floor((Date.now() - deliveryDateMs) / (1000 * 60 * 60 * 24));
    if (order.orderStatus === "Delivered" && daysSinceDelivery > 7) {
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

    // Calculate Return Shipping Fee: Bacstory pays for our fault, customer pays ₹99 for change of mind
    const returnShippingFee = isDamagedOrWrong ? 0 : 99;

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

      const orderTotalNum = parseNumericPrice(order.totalAmount || order.orderTotal, 1100);

      if (Array.isArray(items) && items.length > 0) {
        items.forEach(reqItem => {
          const origItem = order.items?.find(i => (i._id?.toString() === reqItem.itemId || i.id === reqItem.itemId || i.name === reqItem.name));
          const unitPrice = origItem
            ? parseNumericPrice(origItem.price, parseNumericPrice(origItem.priceNum, orderTotalNum / (order.items?.length || 1)))
            : (orderTotalNum / (items.length || 1));
          const qty = parseNumericPrice(reqItem.returnQuantity, 1);
          itemsSubtotal += (unitPrice * qty);
        });
      } else {
        itemsSubtotal = orderTotalNum;
      }

      const calculatedRefund = Math.max(0, itemsSubtotal - returnShippingFee);
      refundAmount = parseNumericPrice(calculatedRefund, Math.max(0, orderTotalNum - returnShippingFee));

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

    if (order.paymentStatus !== "COD" && order.paymentStatus !== "Cancelled (Unpaid)") {
      order.paymentStatus = "Paid";
    }

    await order.save();

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

module.exports = {
  createOrderRecord,
  getUserOrders,
  getTrackOrderStatus,
  cancelUserOrder,
  submitReturnExchange,
  findOrderForReturn,
};

