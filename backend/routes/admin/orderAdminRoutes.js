const express = require("express");
const router = express.Router();
const {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateRefundStatus,
  approveReturnRequest,
  markProductReceived,
  processReturnRefund,
  rejectReturnRequest,
  deleteOrder,
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
router.put("/:id/product-received", markProductReceived);
router.put("/:id/process-refund", processReturnRefund);
router.put("/:id/reject-return", rejectReturnRequest);
router.delete("/:id", deleteOrder);

module.exports = router;
