const express = require("express");
const router = express.Router();
const {
  createOrderRecord,
  getUserOrders,
  getTrackOrderStatus,
  getOrderDetails,
  cancelUserOrder,
  submitReturnExchange,
  findOrderForReturn,
  uploadReturnProofMedia
} = require("../../controllers/frontend/orderFrntCtrl");
const { protect } = require("../../middlewares/auth");
const upload = require("../../middlewares/upload");

// Optional auth middleware helper
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    return protect(req, res, next);
  }
  next();
};

router.post("/upload-proof", upload.array("files", 10), uploadReturnProofMedia);
router.post("/", optionalAuth, createOrderRecord);
router.get("/my-orders", optionalAuth, getUserOrders);
router.get("/find-order", findOrderForReturn);
router.get("/track/:orderId", getTrackOrderStatus);
router.get("/:orderId", optionalAuth, getOrderDetails);
router.post("/:orderId/cancel", optionalAuth, cancelUserOrder);
router.post("/return-exchange", optionalAuth, submitReturnExchange);

module.exports = router;
