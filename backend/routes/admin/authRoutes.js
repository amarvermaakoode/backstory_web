const express = require("express");
const router = express.Router();
const { loginAdmin, logoutAdmin } = require("../../controllers/admin/authController");
const { protect, adminOnly } = require("../../middlewares/auth");

// Admin Login
router.post("/login", loginAdmin);

// Admin Logout
router.post("/logout", protect, adminOnly, logoutAdmin);

module.exports = router;
