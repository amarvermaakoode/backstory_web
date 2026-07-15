const Category = require("../../models/category");

// Get Active Categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find(
    { status: true },
      {
        Name: 1,
        image: 1,
      }
    ).sort({ createdAt: -1 });

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

module.exports = {
  getCategories,
};