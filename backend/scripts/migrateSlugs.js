const Category = require("../models/category");
const SubCategory = require("../models/SubCategory");
const Collection = require("../models/collection");
const Product = require("../models/product");

/**
 * Migration script to auto-generate slugs for existing database items.
 */
const migrationAutoSlug = async () => {
  try {
    // Categories
    const categories = await Category.find({
      $or: [{ slug: { $exists: false } }, { slug: "" }, { slug: null }],
    });
    for (let cat of categories) {
      await cat.save();
    }

    // Subcategories (Tribes)
    const subcategories = await SubCategory.find({
      $or: [{ slug: { $exists: false } }, { slug: "" }, { slug: null }],
    });
    for (let sub of subcategories) {
      await sub.save();
    }

    // Collections
    const collections = await Collection.find({
      $or: [{ slug: { $exists: false } }, { slug: "" }, { slug: null }],
    });
    for (let col of collections) {
      await col.save();
    }

    // Products
    const products = await Product.find({
      $or: [
        { slug: { $exists: false } },
        { slug: "" },
        { slug: null },
        { slug: "undefined" },
      ],
    });
    for (let prod of products) {
      await prod.save();
    }

    console.log("✅ Slug migration completed successfully.");
  } catch (err) {
    console.error("❌ Slug migration error:", err.message);
  }
};

module.exports = migrationAutoSlug;
