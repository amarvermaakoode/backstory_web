const express = require("express");
const router = express.Router();

const { searchProducts } = require("../../controllers/frontend/searchFrntCtrl");

// Public API
router.get("/", searchProducts);

module.exports = router;
