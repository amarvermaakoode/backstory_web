const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
      maxlength: [200, "Product title cannot exceed 200 characters"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Product price cannot be negative"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required"],
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: [true, "Product subcategory is required"],
    },
    sizeGuide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SizeGuide",
      required: [true, "Product size guide is required"],
    },
    colors: [
      {
        color: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Color",
          required: true,
        },
        images: [
          {
            type: String,
            trim: true,
          },
        ],
      },
    ],
    description: {
      type: String,
      trim: true,
    },
    material: {
      type: String,
      trim: true,
    },
    fit: {
      type: String,
      trim: true,
    },
    weight: {
      type: String,
      trim: true,
    },
    care: {
      type: String,
      trim: true,
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

module.exports = mongoose.model("Product", productSchema);
