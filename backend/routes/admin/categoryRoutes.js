const express = require("express");
const router = express.Router();

const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../../controllers/admin/categoryController");

const upload = require("../../middlewares/upload");
const { protect, adminOnly } = require("../../middlewares/auth");

//Create Category

router.post("/", protect, adminOnly, upload.single("image"), createCategory);

//Get All Categories
router.get("/", protect,adminOnly,getCategories);

//Get Category By ID
 
router.get("/:id", protect, adminOnly, getCategoryById);


//Update Category

router.put("/:id", protect, adminOnly,upload.single("image"), updateCategory);


 // Delete Category

router.delete( "/:id", protect,  adminOnly,  deleteCategory);

module.exports = router;