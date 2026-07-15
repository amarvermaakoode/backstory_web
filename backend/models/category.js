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

    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
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

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

categorySchema.pre("save", async function () {
  if (this.isModified("Name") || this.isModified("slug") || !this.slug) {
    const baseText = this.slug ? this.slug : this.Name;
    this.slug = slugify(baseText);
  }
});

module.exports = mongoose.model("Category", categorySchema);
