const mongoose = require("mongoose");
const Category = require("../../models/category");

// create category
const createCategory = async (req, res) => {
  try {
    const { Name, slug, status } = req.body;

    if (!Name) {
      return res.status(400).json({
        success: false,
        message: "Name of the category is required.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Category image is required.",
      });
    }

    const existingCategory = await Category.findOne({
      Name: Name.trim(),
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "Category already exists.",
      });
    }

    const category = await Category.create({
      Name: Name.trim(),
      slug: slug ? slug.trim() : undefined,
      image: `/uploads/${req.file.filename}`,
      status: status === undefined ? true : status,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully.",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


//Get All Categories

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Category By ID

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID.",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


//Update Category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { Name, slug, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID.",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    const currentName = category.Name || "";

    if (
      Name &&
      Name.trim().toLowerCase() !== currentName.toLowerCase()
    ) {
      const existingCategory = await Category.findOne({
        Name: Name.trim(),
      });

      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message: "Category name already exists.",
        });
      }

      category.Name = Name.trim();
    }

    if (slug !== undefined) {
      category.slug = slug.trim() || undefined;
    }

    if (status !== undefined) {
      category.status = status;
    }

    if (req.file) {
      category.image = `/uploads/${req.file.filename}`;
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully.",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


//Delete Category

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID.",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    await Category.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
