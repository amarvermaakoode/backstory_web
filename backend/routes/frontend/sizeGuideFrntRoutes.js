const express = require("express");
const router = express.Router();
const { getSizeGuides } = require("../../controllers/frontend/sizeGuideFrntCtrl");

router.get("/", getSizeGuides);

module.exports = router;
