const mongoose = require("mongoose");
const Category = require("../../models/category");
const SubCategory = require("../../models/SubCategory");

// Create Sub Category
const createSubCategory = async (req, res) => {
  try {
    const { category, name, slug, status } = req.body;

    if (!category || !name) {
      return res.status(400).json({
        success: false,
        message: "Category and Name are required.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image is required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Category ID.",
      });
    }

    const categoryExists = await Category.findById(category);

    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    const existingSubCategory = await SubCategory.findOne({
      category,
      name: name.trim(),
    });

    if (existingSubCategory) {
      return res.status(409).json({
        success: false,
        message: "Sub Category already exists in this category.",
      });
    }

    const subCategory = await SubCategory.create({
      category,
      name: name.trim(),
      slug: slug ? slug.trim() : undefined,
      image: `/uploads/${req.file.filename}`,
      status: status === undefined ? true : status,
    });

    return res.status(201).json({
      success: true,
      message: "Sub Category created successfully.",
      data: subCategory,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Sub Categories
const getSubCategories = async (req, res) => {
  try {

    const subCategories = await SubCategory.find()
      .populate("category", "Name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: subCategories.length,
      data: subCategories,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// Get Sub Category By ID
const getSubCategoryById = async (req, res) => {

  try {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Sub Category ID.",
      });
    }

    const subCategory = await SubCategory.findById(id)
      .populate("category", "Name");

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Sub Category not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: subCategory,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// Get Sub Categories By Category ID
const getSubCategoryByCategory = async (req, res) => {

  try {

    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Category ID.",
      });
    }

    const subCategories = await SubCategory.find({
      category: categoryId,
    }).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: subCategories.length,
      data: subCategories,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// Update Sub Category

const updateSubCategory = async (req, res) => {

  try {

    const { id } = req.params;
    const { category, name, slug, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Sub Category ID.",
      });
    }

    const subCategory = await SubCategory.findById(id);

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Sub Category not found.",
      });
    }

    if (category) {

      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Category ID.",
        });
      }

      const categoryExists = await Category.findById(category);

      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: "Category not found.",
        });
      }

      subCategory.category = category;
    }

    if (name) {
      subCategory.name = name.trim();
    }

    if (slug !== undefined) {
      subCategory.slug = slug.trim() || undefined;
    }

    if (status !== undefined) {
      subCategory.status = status;
    }

    if (req.file) {
      subCategory.image = `/uploads/${req.file.filename}`;
    }

    await subCategory.save();

    return res.status(200).json({
      success: true,
      message: "Sub Category updated successfully.",
      data: subCategory,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// Delete Sub Category
const deleteSubCategory = async (req, res) => {

  try {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Sub Category ID.",
      });
    }

    const subCategory = await SubCategory.findById(id);

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Sub Category not found.",
      });
    }

    await SubCategory.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Sub Category deleted successfully.",
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

module.exports = {
  createSubCategory,
  getSubCategories,
  getSubCategoryById,
  getSubCategoryByCategory,
  updateSubCategory,
  deleteSubCategory,
};