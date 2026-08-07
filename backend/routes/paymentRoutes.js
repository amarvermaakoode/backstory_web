const express = require("express");
const router = express.Router();
const { createOrder, verifyPayment, processRefund, handleRazorpayWebhook } = require("../controllers/paymentController");

// Payment endpoints
router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment);
router.post("/refund", processRefund);
router.post("/webhook", handleRazorpayWebhook);

module.exports = router;
