const Review = require("../../models/review");
const Product = require("../../models/product");
const Order = require("../../models/Order");
const mongoose = require("mongoose");

// Helper function to verify if user has purchased a product
const checkUserPurchasedProduct = async (userId, userEmail, productId) => {
  if (!userId || !productId) return false;

  const validOrderStatuses = [
    "Placed",
    "Order Confirmed",
    "Ready to Pack & Ship",
    "Dispatched & In Transit",
    "Out for Delivery",
    "Delivered",
    "Return In Progress",
    "Returned",
    "Exchange In Progress",
    "Exchanged",
    "Processing",
  ];

  const invalidPaymentStatuses = ["Failed", "Cancelled (Unpaid)"];

  const queryConditions = [
    { user: userId }
  ];

  if (userEmail) {
    queryConditions.push({ "shippingAddress.email": new RegExp(`^${userEmail.trim()}$`, "i") });
  }

  const orders = await Order.find({
    $or: queryConditions,
    orderStatus: { $in: validOrderStatuses },
    paymentStatus: { $nin: invalidPaymentStatuses },
    "cancellation.isCancelled": { $ne: true }
  }).lean();

  const pIdStr = productId.toString();

  for (const order of orders) {
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        if (
          (item.product && item.product.toString() === pIdStr) ||
          (item.productId && item.productId.toString() === pIdStr)
        ) {
          return true;
        }
      }
    }
  }

  return false;
};

// Check Review Eligibility Endpoint
const checkReviewEligibility = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    if (!req.user) {
      return res.status(200).json({
        success: true,
        canReview: false,
        hasPurchased: false,
        message: "Please log in to write a review.",
      });
    }

    const userId = req.user._id || req.user.id;
    const userEmail = req.user.email || "";

    const hasPurchased = await checkUserPurchasedProduct(userId, userEmail, productId);

    return res.status(200).json({
      success: true,
      canReview: hasPurchased,
      hasPurchased: hasPurchased,
    });
  } catch (error) {
    console.error("Error checking review eligibility:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Upload Review Media (Photos & Videos)
const uploadReviewMedia = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded.",
      });
    }

    const mediaList = req.files.map((file) => {
      const isVideo = file.mimetype.startsWith("video/");
      return {
        url: `/uploads/${file.filename}`,
        type: isVideo ? "video" : "photo",
        originalName: file.originalname,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Media uploaded successfully.",
      data: mediaList,
    });
  } catch (error) {
    console.error("Error uploading review media:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create Review (Verified Purchaser Only)
const createReview = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to submit a review.",
      });
    }

    const userId = req.user._id || req.user.id;
    const userEmail = req.user.email || "";
    const { product: productId, author, rating, text, photos, videos } = req.body;

    if (!productId || !rating || !text) {
      return res.status(400).json({
        success: false,
        message: "Product, rating, and review text are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Backend Purchase Verification
    const hasPurchased = await checkUserPurchasedProduct(userId, userEmail, productId);
    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: "You can only review products you have purchased.",
      });
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a number between 1 and 5.",
      });
    }

    const authorName = (author && author.trim()) || req.user.name || "Verified Purchaser";

    const review = await Review.create({
      product: productId,
      user: userId,
      author: authorName,
      rating: ratingNum,
      text: text.trim(),
      photos: Array.isArray(photos) ? photos : [],
      videos: Array.isArray(videos) ? videos : [],
    });

    // Update Product average rating & count
    try {
      const activeReviews = await Review.find({ product: productId, status: true });
      if (activeReviews.length > 0) {
        const totalRating = activeReviews.reduce((sum, r) => sum + r.rating, 0);
        const avg = (totalRating / activeReviews.length).toFixed(1);
        await Product.findByIdAndUpdate(productId, {
          rating: Number(avg),
          reviewsCount: activeReviews.length,
        });
      }
    } catch (prodErr) {
      console.error("Error updating product rating summary:", prodErr);
    }

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      data: review,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Reviews of Product
const getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const reviews = await Review.find({ product: productId, status: true }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createReview,
  getReviewsByProduct,
  checkReviewEligibility,
  uploadReviewMedia,
};
