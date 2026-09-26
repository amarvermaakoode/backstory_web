const express = require("express");
const router = express.Router();
const { getWishlist, toggleWishlist, removeFromWishlist, syncWishlist } = require("../../controllers/frontend/wishlistFrntCtrl");
const { protect } = require("../../middlewares/auth");

router.get("/", protect, getWishlist);
router.post("/toggle", protect, toggleWishlist);
router.post("/remove", protect, removeFromWishlist);
router.post("/sync", protect, syncWishlist);

module.exports = router;
