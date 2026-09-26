const SubCategory = require("../../models/SubCategory");

// Get Active Sub Categories
const getSubCategories = async (req, res) => {
  try {
    const subCategories = await SubCategory.find(
      { status: true },
      {
        category: 1,
        name: 1,
        image: 1,
        slug: 1,
        createdAt: 1,
      }
    ).sort({ createdAt: -1 });

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

module.exports = {
  getSubCategories,
};
