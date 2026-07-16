const Product = require("../../models/product");

// Get Active Products
const getProducts = async (req, res) => {
  try {
    const { category, collection, subCategory } = req.query;
    let query = { status: true };

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

    const products = await Product.find(query)
      .populate("category", "Name image slug")
      .populate("subCategory", "name image slug")
      .populate("collection", "Name image slug")
      .populate("sizeGuide", "name chart")
      .populate("colors.color", "name hexCode")
      .sort({ createdAt: -1 });

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

// Get Featured Products (Limit of 3)
const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: true, featured: true })
      .populate("category", "Name image slug")
      .populate("subCategory", "name image slug")
      .populate("collection", "Name image slug")
      .populate("sizeGuide", "name chart")
      .populate("colors.color", "name hexCode")
      .sort({ createdAt: -1 })
      .limit(3);

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
      query = { slug: id.toLowerCase() };
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
      author: r.author,
      rating: r.rating,
      text: r.text,
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

module.exports = {
  getProducts,
  getFeaturedProducts,
  getProductById,
};

