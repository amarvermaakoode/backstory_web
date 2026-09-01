const express = require("express");
const router = express.Router();
const {
  getShippingSettings,
  updateShippingSettings,
} = require("../../controllers/admin/shippingAdminCtrl");
const { protect, adminOnly } = require("../../middlewares/auth");

router
  .route("/")
  .get(protect, adminOnly, getShippingSettings)
  .put(protect, adminOnly, updateShippingSettings);

module.exports = router;
