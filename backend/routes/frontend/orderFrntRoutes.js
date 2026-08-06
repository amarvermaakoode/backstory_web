const express = require("express");
const router = express.Router();
const { createOrderRecord, getUserOrders, getTrackOrderStatus } = require("../../controllers/frontend/orderFrntCtrl");
const { protect } = require("../../middlewares/auth");

// Optional auth middleware helper
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    return protect(req, res, next);
  }
  next();
};

router.post("/", optionalAuth, createOrderRecord);
router.get("/my-orders", optionalAuth, getUserOrders);
router.get("/track/:orderId", getTrackOrderStatus);

module.exports = router;
