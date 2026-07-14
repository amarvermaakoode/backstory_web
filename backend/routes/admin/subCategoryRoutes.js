const express = require("express");
const router = express.Router();

const {
  createSubCategory,
  getSubCategories,
  getSubCategoryById,
  getSubCategoryByCategory,
  updateSubCategory,
  deleteSubCategory,
} = require("../../controllers/admin/subCategoryController");

const upload = require("../../middlewares/upload");
const { protect, adminOnly } = require("../../middlewares/auth");

// Create Sub Category

router.post(  "/",  protect,  adminOnly, upload.single("image"),  createSubCategory);

// Get All Sub Categories

router.get(  "/",  protect,  adminOnly,  getSubCategories);

//Get Sub Categories By Category ID

router.get(  "/category/:categoryId",  protect,    adminOnly,  getSubCategoryByCategory);

// Get Sub Category By ID

router.get(  "/:id",  protect,  adminOnly,  getSubCategoryById);

// Update Sub Category

router.put(  "/:id",  protect,  adminOnly,  upload.single("image"),  updateSubCategory);

// Delete Sub Category
 
router.delete(  "/:id",  protect,  adminOnly,  deleteSubCategory);

module.exports = router;