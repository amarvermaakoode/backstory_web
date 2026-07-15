const express = require("express");
const router = express.Router();

const {
  getProducts,
} = require("../../controllers/frontend/productFrntCtrl");

// Public API
router.get("/", getProducts);

module.exports = router;
