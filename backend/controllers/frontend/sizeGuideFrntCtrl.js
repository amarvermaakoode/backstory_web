const SizeGuide = require("../../models/sizeGuide");

// Get Active Size Guides & Unique Sizes for Frontend
const getSizeGuides = async (req, res) => {
  try {
    const sizeGuides = await SizeGuide.find({ status: { $ne: false } }).sort({ name: 1 });

    const sizeSet = new Set();
    sizeGuides.forEach(sg => {
      if (sg.chart && Array.isArray(sg.chart)) {
        sg.chart.forEach(item => {
          if (item.size && item.size.trim()) {
            sizeSet.add(item.size.trim().toUpperCase());
          }
        });
      }
    });

    const standardOrder = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
    const uniqueSizes = Array.from(sizeSet).sort((a, b) => {
      const ia = standardOrder.indexOf(a);
      const ib = standardOrder.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });

    return res.status(200).json({
      success: true,
      count: sizeGuides.length,
      sizes: uniqueSizes,
      data: sizeGuides,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getSizeGuides,
};
