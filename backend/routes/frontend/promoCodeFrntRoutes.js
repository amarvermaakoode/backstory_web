const express = require("express");
const router = express.Router();

const { validatePromoCode } = require("../../controllers/frontend/promoCodeFrntCtrl");

router.post("/validate", validatePromoCode);

module.exports = router;
