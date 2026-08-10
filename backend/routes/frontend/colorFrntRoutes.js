const express = require("express");
const router = express.Router();
const { getColors } = require("../../controllers/frontend/colorFrntCtrl");

router.get("/", getColors);

module.exports = router;
