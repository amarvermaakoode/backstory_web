const express = require("express");
const router = express.Router();

const {
  getSubCategories,
} = require("../../controllers/frontend/subcategoryFrntCtrl");

// Public API
router.get("/", getSubCategories);

module.exports = router;
