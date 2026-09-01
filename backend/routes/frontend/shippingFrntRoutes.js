const express = require("express");
const router = express.Router();
const { getShippingSettings } = require("../../controllers/admin/shippingAdminCtrl");

// Public route for customer checkout page to fetch shipping rates
router.get("/", getShippingSettings);

module.exports = router;
