const express = require("express");
const router = express.Router();
const { createSupportTicket, getUserSupportTickets } = require("../../controllers/frontend/supportFrntCtrl");
const { protect, optionalAuth } = require("../../middlewares/auth");

// Submit support ticket message
router.post("/", optionalAuth, createSupportTicket);

// Get user's submitted support tickets
router.get("/my-tickets", protect, getUserSupportTickets);

module.exports = router;
