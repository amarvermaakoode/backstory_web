const express = require("express");
const router = express.Router();
const { getCart, addToCart, removeFromCart, updateQuantity, syncCart, clearCart } = require("../../controllers/frontend/cartFrntCtrl");
const { protect } = require("../../middlewares/auth");

router.get("/", protect, getCart);
router.post("/add", protect, addToCart);
router.post("/remove", protect, removeFromCart);
router.post("/update-quantity", protect, updateQuantity);
router.post("/sync", protect, syncCart);
router.post("/clear", protect, clearCart);

module.exports = router;
