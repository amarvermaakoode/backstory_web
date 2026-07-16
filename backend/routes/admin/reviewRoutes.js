const express = require("express");
const router = express.Router();

const {
  getReviewsForProductAdmin,
  deleteReview,
} = require("../../controllers/admin/reviewController");

const { protect, adminOnly } = require("../../middlewares/auth");

router.get("/product/:productId", protect, adminOnly, getReviewsForProductAdmin);
router.delete("/:id", protect, adminOnly, deleteReview);

module.exports = router;
