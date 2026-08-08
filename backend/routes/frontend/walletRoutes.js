const express = require("express");
const router = express.Router();
const { getWalletDetails } = require("../../controllers/frontend/walletCtrl");
const { protect } = require("../../middlewares/auth");

router.get("/", protect, getWalletDetails);

module.exports = router;
