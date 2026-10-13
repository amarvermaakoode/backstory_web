const Product = require("../../models/product");

// Get Active Products
const getProducts = async (req, res) => {
  try {
    const { category, collection, subCategory, featured } = req.query;
    let query = { status: true };

    if (featured === "true" || featured === true) {
      query.featured = true;
    }

    const mongoose = require("mongoose");

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      } else {
        // Find category by slug (exact match) or by Name (regex case-insensitive)
        const Category = require("../../models/category");
        const foundCategory = await Category.findOne({
          $or: [
            { slug: category.toLowerCase() },
            { Name: { $regex: new RegExp(`^${category}$`, "i") } }
          ]
        });
        if (foundCategory) {
          query.category = foundCategory._id;
        } else {
          // If category not found, return empty array
          return res.status(200).json({
            success: true,
            count: 0,
            data: [],
          });
        }
      }
    }

    if (collection) {
      if (mongoose.Types.ObjectId.isValid(collection)) {
        query.collection = collection;
      } else {
        // Find collection by slug (exact match) or by Name (regex case-insensitive)
        const Collection = require("../../models/collection");
        const foundCollection = await Collection.findOne({
          $or: [
            { slug: collection.toLowerCase() },
            { Name: { $regex: new RegExp(`^${collection}$`, "i") } }
          ]
        });
        if (foundCollection) {
          query.collection = foundCollection._id;
        } else {
          // If collection not found, return empty array
          return res.status(200).json({
            success: true,
            count: 0,
            data: [],
          });
        }
      }
    }

    if (subCategory) {
      if (mongoose.Types.ObjectId.isValid(subCategory)) {
        query.subCategory = subCategory;
      } else {
        // Find subCategory by slug (exact match) or by name (regex case-insensitive)
        const SubCategory = require("../../models/SubCategory");
        const foundSubCategory = await SubCategory.findOne({
          $or: [
            { slug: subCategory.toLowerCase() },
            { name: { $regex: new RegExp(`^${subCategory}$`, "i") } }
          ]
        });
        if (foundSubCategory) {
          query.subCategory = foundSubCategory._id;
        } else {
          // If subcategory not found, return empty array
          return res.status(200).json({
            success: true,
            count: 0,
            data: [],
          });
        }
      }
    }

    const Review = require("../../models/review");

    const products = await Product.find(query)
      .populate("category", "Name image slug")
      .populate("subCategory", "name image slug")
      .populate("collection", "Name image slug")
      .populate("sizeGuide", "name chart")
      .populate("colors.color", "name hexCode")
      .sort({ createdAt: -1 });

    const productsWithRatings = await Promise.all(
      products.map(async (p) => {
        const reviews = await Review.find({ product: p._id, status: true });
        let rating = "5.0";
        let reviewsCount = reviews.length;
        if (reviews.length > 0) {
          const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
          rating = (sum / reviews.length).toFixed(1);
        }
        const pObj = p.toObject();
        pObj.rating = rating;
        pObj.reviewsCount = reviewsCount;
        return pObj;
      })
    );

    return res.status(200).json({
      success: true,
      count: productsWithRatings.length,
      data: productsWithRatings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Featured Products
const getFeaturedProducts = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 0;
    let query = Product.find({ status: true, featured: true })
      .populate("category", "Name image slug")
      .populate("subCategory", "name image slug")
      .populate("collection", "Name image slug")
      .populate("sizeGuide", "name chart")
      .populate("colors.color", "name hexCode")
      .sort({ createdAt: -1 });

    if (limit > 0) {
      query = query.limit(limit);
    }

    const products = await query;

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Product by ID / Slug
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require("mongoose");

    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      const cleanSlug = id.toLowerCase().trim();
      const titleGuess = cleanSlug.replace(/-/g, " ");
      query = {
        $or: [
          { slug: cleanSlug },
          { title: { $regex: new RegExp(`^${titleGuess}$`, "i") } },
          { title: { $regex: new RegExp(`^${cleanSlug}$`, "i") } },
        ]
      };
    }

    const product = await Product.findOne(query)
      .populate("category", "Name image slug")
      .populate("subCategory", "name image slug")
      .populate("collection", "Name image slug")
      .populate("sizeGuide", "name chart")
      .populate("colors.color", "name hexCode");

    if (!product || !product.status) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const Review = require("../../models/review");
    const reviews = await Review.find({ product: product._id, status: true }).sort({ createdAt: -1 });

    let rating = "5.0";
    let reviewsCount = reviews.length;

    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      rating = (sum / reviews.length).toFixed(1);
    }

    const productObj = product.toObject();
    productObj.reviews = reviews.map(r => ({
      id: r._id,
      userId: r.user ? r.user.toString() : "",
      author: r.author,
      rating: r.rating,
      text: r.text,
      photos: r.photos || [],
      videos: r.videos || [],
      date: new Date(r.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    }));
    productObj.rating = rating;
    productObj.reviewsCount = reviewsCount;

    return res.status(200).json({
      success: true,
      data: productObj,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Reduce Stock on Checkout
const reduceStock = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Items array is required." });
    }

    for (const item of items) {
      const pId = item.productId || item.product || item.id;
      const size = item.size;
      const colorName = typeof item.color === "object" ? item.color?.name : item.color;
      const qty = Number(item.quantity) || 1;

      if (!pId || !size || !colorName) continue;

      const product = await Product.findById(pId);
      if (!product) continue;

      const key = `${size.toUpperCase().trim()}_${colorName.toLowerCase().trim()}`;
      if (!product.variantStock) {
        product.variantStock = {};
      }
      const curStock = typeof product.variantStock[key] === "number" ? product.variantStock[key] : 10;
      product.variantStock[key] = Math.max(0, curStock - qty);
      product.markModified("variantStock");
      await product.save();
    }

    return res.status(200).json({ success: true, message: "Stock reduced successfully." });
  } catch (error) {
    console.error("Reduce stock error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getFeaturedProducts,
  getProductById,
  reduceStock,
};

