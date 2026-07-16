const express = require("express");
const router = express.Router();

const {
  getProducts,
  getFeaturedProducts,
  getProductById,
} = require("../../controllers/frontend/productFrntCtrl");

// Public API
router.get("/", getProducts);
router.get("/featured", getFeaturedProducts);
router.get("/:id", getProductById);

module.exports = router;
