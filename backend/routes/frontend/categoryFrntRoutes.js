const express = require("express");

const router = express.Router();

const {
    getCategories,
} = require("../../controllers/frontend/categoryFrntCtrl");

// Public API
router.get("/", getCategories);

module.exports = router;