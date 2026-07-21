const express = require("express");
const router = express.Router();
const { getWishlist, toggleWishlist, syncWishlist } = require("../../controllers/frontend/wishlistFrntCtrl");
const { protect } = require("../../middlewares/auth");

router.get("/", protect, getWishlist);
router.post("/toggle", protect, toggleWishlist);
router.post("/sync", protect, syncWishlist);

module.exports = router;
