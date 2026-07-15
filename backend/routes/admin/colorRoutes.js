const express = require("express");
const router = express.Router();

const {
  createColor,
  getColors,
  getColorById,
  updateColor,
  deleteColor,
} = require("../../controllers/admin/colorController");

const { protect, adminOnly } = require("../../middlewares/auth");

// Create Color
router.post("/", protect, adminOnly, createColor);

// Get All Colors
router.get("/", protect, adminOnly, getColors);

// Get Color By ID
router.get("/:id", protect, adminOnly, getColorById);

// Update Color
router.put("/:id", protect, adminOnly, updateColor);

// Delete Color
router.delete("/:id", protect, adminOnly, deleteColor);

module.exports = router;
