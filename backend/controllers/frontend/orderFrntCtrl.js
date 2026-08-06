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
        orderStatus: "Processing",
        paymentStatus: "Confirmed",
        deliveryDate: "Estimated Delivery: 3-5 Business Days",
      })),
      subtotal: subtotal || 0,
      discountAmount: discountAmount || 0,
      shippingCost: shippingCost || 0,
      taxAmount: taxAmount || 0,
      totalAmount: totalAmount || 0,
      paymentStatus: "Confirmed",
      orderStatus: "Processing",
    });

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

// Get orders for current user or guest
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user ? (req.user.id || req.user._id) : null;
    const { email } = req.query;

    let query = {};
    if (userId) {
      query.user = userId;
    } else if (email) {
      query["shippingAddress.email"] = email.toLowerCase().trim();
    } else {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

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

module.exports = {
  createOrderRecord,
  getUserOrders,
};
