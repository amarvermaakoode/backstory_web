const Product = require("../../models/product");

// Get Active Products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: true })
      .populate("category", "Name image")
      .populate("subCategory", "name image")
      .populate("sizeGuide", "name chart")
      .populate("colors.color", "name hexCode")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getProducts,
};
