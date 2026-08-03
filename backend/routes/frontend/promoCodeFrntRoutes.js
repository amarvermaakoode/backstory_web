const express = require("express");
const router = express.Router();

const { getActivePromoCodes, validatePromoCode } = require("../../controllers/frontend/promoCodeFrntCtrl");

// Get active promo codes
router.get("/", getActivePromoCodes);

// Validate promo code at checkout
router.post("/validate", validatePromoCode);

module.exports = router;
