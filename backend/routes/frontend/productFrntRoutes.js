const express = require("express");
const router = express.Router();

const {
  getProducts,
  getFeaturedProducts,
  getProductById,
  reduceStock,
} = require("../../controllers/frontend/productFrntCtrl");

// Public API
router.get("/", getProducts);
router.get("/featured", getFeaturedProducts);
router.get("/:id", getProductById);
router.post("/reduce-stock", reduceStock);

module.exports = router;
