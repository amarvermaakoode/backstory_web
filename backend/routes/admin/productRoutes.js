const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../../controllers/admin/productController");

const upload = require("../../middlewares/upload");
const { protect, adminOnly } = require("../../middlewares/auth");

// Create Product (with upload.any() middleware to handle color specific multiple image fields dynamically)
router.post("/", protect, adminOnly, upload.any(), createProduct);

// Get All Products
router.get("/", protect, adminOnly, getProducts);

// Get Product By ID
router.get("/:id", protect, adminOnly, getProductById);

// Update Product (with upload.any() to handle dynamic image updates per color)
router.put("/:id", protect, adminOnly, upload.any(), updateProduct);

// Delete Product
router.delete("/:id", protect, adminOnly, deleteProduct);

module.exports = router;
