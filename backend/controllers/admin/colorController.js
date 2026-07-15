const mongoose = require("mongoose");
const Color = require("../../models/color");

// Create Color
const createColor = async (req, res) => {
  try {
    const { name, hexCode, status } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Color name is required.",
      });
    }

    const existingColor = await Color.findOne({
      name: name.trim(),
    });

    if (existingColor) {
      return res.status(409).json({
        success: false,
        message: "Color already exists.",
      });
    }

    const color = await Color.create({
      name: name.trim(),
      hexCode: hexCode ? hexCode.trim() : undefined,
      status: status === undefined ? true : status,
    });

    return res.status(201).json({
      success: true,
      message: "Color created successfully.",
      data: color,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Colors
const getColors = async (req, res) => {
  try {
    const colors = await Color.find().sort({ createdAt: -1 });

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

// Get Color By ID
const getColorById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid color ID.",
      });
    }

    const color = await Color.findById(id);

    if (!color) {
      return res.status(404).json({
        success: false,
        message: "Color not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: color,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Color
const updateColor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, hexCode, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid color ID.",
      });
    }

    const color = await Color.findById(id);

    if (!color) {
      return res.status(404).json({
        success: false,
        message: "Color not found.",
      });
    }

    if (name && name.trim().toLowerCase() !== color.name.toLowerCase()) {
      const existingColor = await Color.findOne({
        name: name.trim(),
      });

      if (existingColor) {
        return res.status(409).json({
          success: false,
          message: "Color name already exists.",
        });
      }

      color.name = name.trim();
    }

    if (hexCode !== undefined) {
      color.hexCode = hexCode ? hexCode.trim() : undefined;
    }

    if (status !== undefined) {
      color.status = status;
    }

    await color.save();

    return res.status(200).json({
      success: true,
      message: "Color updated successfully.",
      data: color,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Color
const deleteColor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid color ID.",
      });
    }

    const color = await Color.findById(id);

    if (!color) {
      return res.status(404).json({
        success: false,
        message: "Color not found.",
      });
    }

    await Color.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Color deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createColor,
  getColors,
  getColorById,
  updateColor,
  deleteColor,
};
