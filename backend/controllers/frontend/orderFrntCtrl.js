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
    } = req.body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: "Missing required order details",
      });
    }

    const userId = req.user ? (req.user.id || req.user._id) : null;

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
        paymentStatus: "Confirmed",
        deliveryDate: "Estimated Delivery: 3-5 Business Days",
      })),
      subtotal: subtotal || 0,
      discountAmount: discountAmount || 0,
      shippingCost: shippingCost || 0,
      taxAmount: taxAmount || 0,
      totalAmount: totalAmount || 0,
      paymentStatus: "Confirmed",
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

module.exports = {
  createOrderRecord,
  getUserOrders,
  getTrackOrderStatus,
};
