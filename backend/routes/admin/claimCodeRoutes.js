const express = require("express");
const router = express.Router();
const {
  generateClaimCodes,
  getAllClaimCodes,
  revokeClaimCode,
} = require("../../controllers/admin/claimCodeController");
const { protect, adminOnly } = require("../../middlewares/auth");

router.post("/generate", protect, adminOnly, generateClaimCodes);
router.get("/", protect, adminOnly, getAllClaimCodes);
router.put("/:id/revoke", protect, adminOnly, revokeClaimCode);

module.exports = router;
