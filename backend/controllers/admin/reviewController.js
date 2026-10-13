const Review = require("../../models/review");
const mongoose = require("mongoose");

// Get Reviews of Product (for Admin - includes inactive status if any)
const getReviewsForProductAdmin = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const reviews = await Review.find({ product: productId }).sort({ createdAt: -1 });

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

// Delete Review
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID.",
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(id);

    // Update Product average rating & count
    try {
      const Product = require("../../models/product");
      const activeReviews = await Review.find({ product: productId, status: true });
      if (activeReviews.length > 0) {
        const totalRating = activeReviews.reduce((sum, r) => sum + r.rating, 0);
        const avg = (totalRating / activeReviews.length).toFixed(1);
        await Product.findByIdAndUpdate(productId, {
          rating: Number(avg),
          reviewsCount: activeReviews.length,
        });
      } else {
        await Product.findByIdAndUpdate(productId, {
          rating: 0,
          reviewsCount: 0,
        });
      }
    } catch (prodErr) {
      console.error("Error updating product rating summary after admin review deletion:", prodErr);
    }

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getReviewsForProductAdmin,
  deleteReview,
};
