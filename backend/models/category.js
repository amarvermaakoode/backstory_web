const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    Name: {
      type: String,
      required: [true, "Name of the category is required"],
      trim: true,
      unique: true,
      maxlength: [100, "Name of the category cannot exceed 100 characters"],
    },

    image: {
      type: String,
      required: [true, "Category image is required"],
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

module.exports = mongoose.model("Category", categorySchema);
