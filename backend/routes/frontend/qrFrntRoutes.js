const express = require("express");
const router = express.Router();
const {
  getQRCodeByCode,
  sendClaimOTP,
  verifyClaimOTP,
  updateQRProfile,
  getMyQRCodes,
  getOrderProducts,
  validateGiftClaimCode,
  sendGiftClaimOTP,
  verifyGiftClaimOTP,
} = require("../../controllers/frontend/qrFrntController");
const { protect } = require("../../middlewares/auth");

// Public route to scan QR code
router.get("/my-qrs", protect, getMyQRCodes);
router.get("/:code", getQRCodeByCode);

// Order ID + Email OTP claiming flow (Purchase)
router.post("/order-products", getOrderProducts);
router.post("/send-otp", sendClaimOTP);
router.post("/verify-claim-otp", verifyClaimOTP);

// Gift / Marketing Claim Code claiming flow
router.post("/validate-claim-code", validateGiftClaimCode);
router.post("/send-gift-otp", sendGiftClaimOTP);
router.post("/verify-gift-otp", verifyGiftClaimOTP);

// Protected route (called from user's Account/Profile section to edit story)
router.put("/profile", protect, updateQRProfile);

module.exports = router;
