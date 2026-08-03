const express = require("express");
const router = express.Router();
const {
  sendOtp,
  verifyOtp,
  getCurrentUser,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  deactivateAccount,
  deleteAccount,
} = require("../../controllers/frontend/authFrntCtrl");
const { protect } = require("../../middlewares/auth");

// Public authentication routes
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// Protected account & profile routes
router.get("/me", protect, getCurrentUser);
router.put("/profile", protect, updateProfile);

// Protected address CRUD routes
router.post("/addresses", protect, addAddress);
router.put("/addresses/:addressId", protect, updateAddress);
router.delete("/addresses/:addressId", protect, deleteAddress);
router.put("/addresses/:addressId/default", protect, setDefaultAddress);

// Account status routes
router.post("/deactivate", protect, deactivateAccount);
router.delete("/account", protect, deleteAccount);

module.exports = router;
