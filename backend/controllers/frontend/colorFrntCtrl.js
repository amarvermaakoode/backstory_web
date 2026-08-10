const Color = require("../../models/color");

// Get Active Colors for Frontend
const getColors = async (req, res) => {
  try {
    const colors = await Color.find({ status: true }).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: colors.length,
      data: colors,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getColors,
};
