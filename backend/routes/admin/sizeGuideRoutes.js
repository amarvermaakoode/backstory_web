const express = require("express");
const router = express.Router();

const {
  createSizeGuide,
  getSizeGuides,
  getSizeGuideById,
  updateSizeGuide,
  deleteSizeGuide,
} = require("../../controllers/admin/sizeGuideController");

const { protect, adminOnly } = require("../../middlewares/auth");

// Create Size Guide
router.post("/", protect, adminOnly, createSizeGuide);

// Get All Size Guides
router.get("/", protect, adminOnly, getSizeGuides);

// Get Size Guide By ID
router.get("/:id", protect, adminOnly, getSizeGuideById);

// Update Size Guide
router.put("/:id", protect, adminOnly, updateSizeGuide);

// Delete Size Guide
router.delete("/:id", protect, adminOnly, deleteSizeGuide);

module.exports = router;
