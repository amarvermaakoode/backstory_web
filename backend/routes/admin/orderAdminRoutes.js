const express = require("express");
const router = express.Router();
const {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateRefundStatus,
  approveReturnRequest,
  rejectReturnRequest,
} = require("../../controllers/admin/orderAdminCtrl");
const { protect, adminOnly } = require("../../middlewares/auth");

// Admin order routes (Protected & Admin Only)
router.use(protect);
router.use(adminOnly);

router.get("/", getAllOrders);
router.get("/:id", getOrderById);
router.put("/:id/status", updateOrderStatus);
router.put("/:id/refund-status", updateRefundStatus);
router.put("/:id/approve-return", approveReturnRequest);
router.put("/:id/reject-return", rejectReturnRequest);

module.exports = router;
