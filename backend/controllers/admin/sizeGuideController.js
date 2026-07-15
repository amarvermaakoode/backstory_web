const mongoose = require("mongoose");
const SizeGuide = require("../../models/sizeGuide");

// Create Size Guide
const createSizeGuide = async (req, res) => {
  try {
    const { name, chart, status } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Size guide name is required.",
      });
    }

    if (!chart || !Array.isArray(chart) || chart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Chart must be a non-empty array of size definitions.",
      });
    }

    // Validate chart entries
    for (const item of chart) {
      if (!item.size) {
        return res.status(400).json({
          success: false,
          message: "Each chart item must contain a 'size' label.",
        });
      }
    }

    const existingSizeGuide = await SizeGuide.findOne({
      name: name.trim(),
    });

    if (existingSizeGuide) {
      return res.status(409).json({
        success: false,
        message: "Size guide already exists.",
      });
    }

    const sizeGuide = await SizeGuide.create({
      name: name.trim(),
      chart,
      status: status === undefined ? true : status,
    });

    return res.status(201).json({
      success: true,
      message: "Size guide created successfully.",
      data: sizeGuide,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Size Guides
const getSizeGuides = async (req, res) => {
  try {
    const sizeGuides = await SizeGuide.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: sizeGuides.length,
      data: sizeGuides,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Size Guide By ID
const getSizeGuideById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid size guide ID.",
      });
    }

    const sizeGuide = await SizeGuide.findById(id);

    if (!sizeGuide) {
      return res.status(404).json({
        success: false,
        message: "Size guide not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: sizeGuide,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Size Guide
const updateSizeGuide = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, chart, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid size guide ID.",
      });
    }

    const sizeGuide = await SizeGuide.findById(id);

    if (!sizeGuide) {
      return res.status(404).json({
        success: false,
        message: "Size guide not found.",
      });
    }

    if (name && name.trim().toLowerCase() !== sizeGuide.name.toLowerCase()) {
      const existingSizeGuide = await SizeGuide.findOne({
        name: name.trim(),
      });

      if (existingSizeGuide) {
        return res.status(409).json({
          success: false,
          message: "Size guide name already exists.",
        });
      }

      sizeGuide.name = name.trim();
    }

    if (chart !== undefined) {
      if (!Array.isArray(chart) || chart.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Chart must be a non-empty array of size definitions.",
        });
      }

      for (const item of chart) {
        if (!item.size) {
          return res.status(400).json({
            success: false,
            message: "Each chart item must contain a 'size' label.",
          });
        }
      }
      sizeGuide.chart = chart;
    }

    if (status !== undefined) {
      sizeGuide.status = status;
    }

    await sizeGuide.save();

    return res.status(200).json({
      success: true,
      message: "Size guide updated successfully.",
      data: sizeGuide,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Size Guide
const deleteSizeGuide = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid size guide ID.",
      });
    }

    const sizeGuide = await SizeGuide.findById(id);

    if (!sizeGuide) {
      return res.status(404).json({
        success: false,
        message: "Size guide not found.",
      });
    }

    await SizeGuide.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Size guide deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createSizeGuide,
  getSizeGuides,
  getSizeGuideById,
  updateSizeGuide,
  deleteSizeGuide,
};
