const express = require("express");
const router = express.Router();

const {
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
} = require("../../controllers/admin/promoCodeController");

const { protect, adminOnly } = require("../../middlewares/auth");

router.get("/", protect, adminOnly, getPromoCodes);
router.post("/", protect, adminOnly, createPromoCode);
router.put("/:id", protect, adminOnly, updatePromoCode);
router.delete("/:id", protect, adminOnly, deletePromoCode);

module.exports = router;
