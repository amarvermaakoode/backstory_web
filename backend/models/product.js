const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
      maxlength: [200, "Product title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      required: [true, "Product slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
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
    collection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      required: false,
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
    faqs: [
      {
        question: {
          type: String,
          required: true,
          trim: true,
        },
        answer: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    status: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    variantStock: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true,
  }
);

productSchema.pre("save", async function () {
  if (!this.slug || this.slug === "undefined") {
    const slugify = (text) => {
      if (!text) return "";
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
    };

    let slug = slugify(this.title);
    const ProductModel = mongoose.model("Product");
    let slugExists = await ProductModel.findOne({ slug });
    let counter = 1;
    const baseSlug = slug;
    while (slugExists) {
      slug = `${baseSlug}-${counter}`;
      slugExists = await ProductModel.findOne({ slug });
      counter++;
    }
    this.slug = slug;
  }
});

module.exports = mongoose.model("Product", productSchema);
