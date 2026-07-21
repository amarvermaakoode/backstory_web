const express = require("express");
const router = express.Router();
const { sendOtp, verifyOtp, getCurrentUser } = require("../../controllers/frontend/authFrntCtrl");
const { protect } = require("../../middlewares/auth");

// Send OTP
router.post("/send-otp", sendOtp);

// Verify OTP (Login / Signup)
router.post("/verify-otp", verifyOtp);

// Get current user profile (Protected)
router.get("/me", protect, getCurrentUser);

module.exports = router;
