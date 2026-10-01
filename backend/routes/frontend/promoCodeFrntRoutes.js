const express = require("express");
const router = express.Router();

const { getActivePromoCodes, validatePromoCode, consumeClaimCode } = require("../../controllers/frontend/promoCodeFrntCtrl");

// Get active promo codes
router.get("/", getActivePromoCodes);

// Validate promo code at checkout
router.post("/validate", validatePromoCode);

// Consume claim code on checkout completion
router.post("/consume-claim", consumeClaimCode);

module.exports = router;
