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

module.exports = {
  createOrder,
  verifyPayment,
};
