const express = require("express");
const router = express.Router();

const {
  getProducts,
  getFeaturedProducts,
} = require("../../controllers/frontend/productFrntCtrl");

// Public API
router.get("/", getProducts);
router.get("/featured", getFeaturedProducts);

module.exports = router;
