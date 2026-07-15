const express = require("express");
const router = express.Router();

const {
  getCollections,
} = require("../../controllers/frontend/collectionFrntCtrl");

// Public API
router.get("/", getCollections);

module.exports = router;
