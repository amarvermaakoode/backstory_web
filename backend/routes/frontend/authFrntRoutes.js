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
const { protect, userOnly } = require("../../middlewares/auth");

// Public authentication routes
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// Protected account & profile routes
router.get("/me", protect, userOnly, getCurrentUser);
router.put("/profile", protect, userOnly, updateProfile);

// Protected address CRUD routes
router.post("/addresses", protect, userOnly, addAddress);
router.put("/addresses/:addressId", protect, userOnly, updateAddress);
router.delete("/addresses/:addressId", protect, userOnly, deleteAddress);
router.put("/addresses/:addressId/default", protect, userOnly, setDefaultAddress);

// Account status routes
router.post("/deactivate", protect, userOnly, deactivateAccount);
router.delete("/account", protect, userOnly, deleteAccount);

module.exports = router;
