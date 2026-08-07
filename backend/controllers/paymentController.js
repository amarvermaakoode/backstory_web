const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay instance lazily
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error("Razorpay credentials are missing in environment variables.");
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
};

// Create Razorpay Order (POST /api/create-order or /api/payment/create-order)
const createOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;

    if (amount === undefined || amount === null || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing amount",
      });
    }

    const numericAmount = Number(amount);

    if (numericAmount < 100) {
      return res.status(400).json({
        success: false,
        message: "Amount must be at least 100 paise (1 INR)",
      });
    }

    const instance = getRazorpayInstance();

    const options = {
      amount: Math.round(numericAmount),
      currency: currency || "INR",
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await instance.orders.create(options);

    return res.status(200).json({
      success: true,
      order_id: order.id,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    if (error.statusCode === 401 || (error.error && error.error.code === "BAD_REQUEST_ERROR")) {
      return res.status(401).json({
        success: false,
        message: error.description || "Authentication failure with Razorpay API",
      });
    }
    return res.status(500).json({
      success: false,
      message: error.description || error.message || "Failed to create Razorpay order",
    });
  }
};

// Verify Razorpay Payment Signature (POST /api/verify-payment or /api/payment/verify-payment)
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id, payment_id } = req.body;

    const finalOrderId = razorpay_order_id || order_id;
    const finalPaymentId = razorpay_payment_id || payment_id;

    if (!finalOrderId || !finalPaymentId || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification fields (razorpay_order_id, razorpay_payment_id, razorpay_signature)",
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({
        success: false,
        message: "Razorpay secret key not configured on server",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${finalOrderId}|${finalPaymentId}`)
      .digest("hex");

    if (generatedSignature === razorpay_signature) {
      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        order_id: finalOrderId,
        payment_id: finalPaymentId,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed: Signature mismatch",
      });
    }
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error during payment verification",
    });
  }
};

// Process Refund via Razorpay API (POST /api/payment/refund)
const processRefund = async (req, res) => {
  try {
    const { paymentId, amount, notes } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID (razorpay_payment_id) is required to process refund.",
      });
    }

    const instance = getRazorpayInstance();
    const refundOptions = {};
    if (amount && !isNaN(amount)) {
      // Amount in paise
      refundOptions.amount = Math.round(Number(amount) * 100);
    }
    if (notes) {
      refundOptions.notes = notes;
    }

    const refund = await instance.payments.refund(paymentId, refundOptions);

    return res.status(200).json({
      success: true,
      message: "Razorpay refund initiated successfully",
      refund,
    });
  } catch (error) {
    console.error("Error processing Razorpay refund:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.description || error.message || "Failed to process Razorpay refund",
    });
  }
};

// Razorpay Webhook Listener (POST /api/payment/webhook)
// Automatically receives real-time events from Razorpay (refund.processed, refund.failed)
const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    if (signature && webhookSecret) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (signature !== expectedSignature) {
        console.warn("Razorpay Webhook signature mismatch notification");
      }
    }

    const { event, payload } = req.body;

    if (event === "refund.credited") {
      const paymentId = payload?.refund?.entity?.payment_id || payload?.payment?.entity?.id;
      if (paymentId) {
        const Order = require("../models/Order");
        const order = await Order.findOne({ razorpayPaymentId: paymentId });
        if (order) {
          if (!order.refundDetails) order.refundDetails = {};
          order.refundDetails.refundStatus = "Refunded";
          order.refundDetails.updatedAt = new Date();
          order.paymentStatus = "Refunded";
          order.orderStatus = "Returned";
          if (!order.returnExchange) order.returnExchange = {};
          order.returnExchange.status = "Refunded";
          if (Array.isArray(order.returnRequestsHistory) && order.returnRequestsHistory.length > 0) {
            order.returnRequestsHistory[order.returnRequestsHistory.length - 1].status = "Refunded";
          }
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item) => {
              item.orderStatus = "Returned";
              item.paymentStatus = "Refunded";
            });
          }
          await order.save();
          console.log(`Razorpay Webhook: Automatically updated order ${order.orderId} refund status to 'Refunded'`);
        }
      }
    } else if (event === "refund.processed" || event === "payment.refunded") {
      const paymentId = payload?.refund?.entity?.payment_id || payload?.payment?.entity?.id;
      if (paymentId) {
        const Order = require("../models/Order");
        const order = await Order.findOne({ razorpayPaymentId: paymentId });
        if (order && order.returnExchange?.status !== "Refunded") {
          if (!order.refundDetails) order.refundDetails = {};
          order.refundDetails.refundStatus = "Refund Processing";
          order.refundDetails.updatedAt = new Date();
          order.paymentStatus = "Refund Processing";
          order.orderStatus = "Return In Progress";
          if (!order.returnExchange) order.returnExchange = {};
          order.returnExchange.status = "Refund Initiated";
          if (Array.isArray(order.returnRequestsHistory) && order.returnRequestsHistory.length > 0) {
            order.returnRequestsHistory[order.returnRequestsHistory.length - 1].status = "Refund Initiated";
          }
          await order.save();
          console.log(`Razorpay Webhook: Order ${order.orderId} marked as Refund Processing (Credited in 5-7 days)`);
        }
      }
    } else if (event === "refund.failed") {
      const paymentId = payload?.refund?.entity?.payment_id;
      if (paymentId) {
        const Order = require("../models/Order");
        const order = await Order.findOne({ razorpayPaymentId: paymentId });
        if (order) {
          if (!order.refundDetails) order.refundDetails = {};
          order.refundDetails.refundStatus = "Failed";
          await order.save();
          console.log(`Razorpay Webhook: Order ${order.orderId} refund failed notification`);
        }
      }
    }

    return res.status(200).json({ success: true, message: "Webhook received" });
  } catch (error) {
    console.error("Error handling Razorpay webhook:", error);
    return res.status(500).json({ success: false, message: "Webhook processing error" });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  processRefund,
  handleRazorpayWebhook,
};
