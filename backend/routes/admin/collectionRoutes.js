const express = require("express");
const router = express.Router();

const {
  createCollection,
  getCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
} = require("../../controllers/admin/collectionController");

const upload = require("../../middlewares/upload");
const { protect, adminOnly } = require("../../middlewares/auth");

// Create Collection
router.post("/", protect, adminOnly, upload.single("image"), createCollection);

// Get All Collections
router.get("/", protect, adminOnly, getCollections);

// Get Collection By ID
router.get("/:id", protect, adminOnly, getCollectionById);

// Update Collection
router.put("/:id", protect, adminOnly, upload.single("image"), updateCollection);

// Delete Collection
router.delete("/:id", protect, adminOnly, deleteCollection);

module.exports = router;
