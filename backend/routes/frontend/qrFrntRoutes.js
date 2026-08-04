const express = require("express");
const router = express.Router();
const {
  getQRCodeByCode,
  claimQRCode,
  updateQRProfile,
  getMyQRCodes,
} = require("../../controllers/frontend/qrFrntController");
const { protect } = require("../../middlewares/auth");

// Public route to scan QR code
router.get("/my-qrs", protect, getMyQRCodes);
router.get("/:code", getQRCodeByCode);

// Protected routes to claim and update QR profile
router.post("/claim", protect, claimQRCode);
router.put("/profile", protect, updateQRProfile);

module.exports = router;
