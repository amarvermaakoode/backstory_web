const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },

    name: {
      type: String,
      required: [true, "Sub category name is required"],
      trim: true,
      maxlength: [100, "Sub category name cannot exceed 100 characters"],
    },

    image: {
      type: String,
      required: [true, "Sub category image is required"],
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

// Prevent duplicate sub category inside the same category
subCategorySchema.index(
  { category: 1, name: 1 },
  { unique: true }
);

module.exports = mongoose.model("SubCategory", subCategorySchema);