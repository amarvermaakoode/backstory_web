const express = require("express");
const router = express.Router();

const {
  getProducts,
  getFeaturedProducts,
  getProductById,
  reduceStock,
} = require("../../controllers/frontend/productFrntCtrl");

const { checkReviewEligibility } = require("../../controllers/frontend/reviewFrntCtrl");
const { optionalAuth } = require("../../middlewares/auth");

// Public API
router.get("/", getProducts);
router.get("/featured", getFeaturedProducts);
router.get("/:productId/check-purchase", optionalAuth, checkReviewEligibility);
router.get("/:productId/review-eligibility", optionalAuth, checkReviewEligibility);
router.get("/:id", getProductById);
router.post("/reduce-stock", reduceStock);

module.exports = router;
