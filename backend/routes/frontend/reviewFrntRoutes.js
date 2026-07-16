const express = require("express");
const router = express.Router();

const {
  createReview,
  getReviewsByProduct,
} = require("../../controllers/frontend/reviewFrntCtrl");

router.post("/", createReview);
router.get("/product/:productId", getReviewsByProduct);

module.exports = router;
