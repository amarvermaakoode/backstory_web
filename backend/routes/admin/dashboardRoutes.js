const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../../controllers/admin/dashboardController");
const { protect, adminOnly } = require("../../middlewares/auth");

// Admin Dashboard routes (Protected & Admin Only)
router.use(protect);
router.use(adminOnly);

router.get("/stats", getDashboardStats);

module.exports = router;
