const mongoose = require("mongoose");

const colorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Color name is required"],
      trim: true,
      unique: true,
      maxlength: [50, "Color name cannot exceed 50 characters"],
    },
    hexCode: {
      type: String,
      trim: true,
      maxlength: [10, "Hex code cannot exceed 10 characters"],
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Color", colorSchema);
