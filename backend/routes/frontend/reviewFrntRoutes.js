const express = require("express");
const router = express.Router();

const {
  createReview,
  getReviewsByProduct,
  checkReviewEligibility,
  uploadReviewMedia,
} = require("../../controllers/frontend/reviewFrntCtrl");

const { protect, optionalAuth } = require("../../middlewares/auth");
const upload = require("../../middlewares/upload");

router.post("/", protect, createReview);
router.post("/upload-media", protect, upload.array("files", 10), uploadReviewMedia);
router.get("/product/:productId", getReviewsByProduct);
router.get("/check-purchase/:productId", optionalAuth, checkReviewEligibility);

module.exports = router;
