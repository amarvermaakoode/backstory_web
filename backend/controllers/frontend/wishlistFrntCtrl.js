const User = require("../../models/user");
const Product = require("../../models/product");

const populateOptions = [
  { path: "category", select: "Name image slug" },
  { path: "subCategory", select: "name image slug" },
  { path: "collection", select: "Name image slug" },
  { path: "sizeGuide", select: "name chart" },
  { path: "colors.color", select: "name hexCode" }
];

// Get wishlist items
const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "wishlist",
      populate: populateOptions
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      wishlist: user.wishlist || []
    });
  } catch (error) {
    console.error("Get wishlist error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle wishlist item
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required." });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const index = user.wishlist.indexOf(productId);
    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(productId);
    }
    await user.save();

    const updatedUser = await User.findById(req.user.id).populate({
      path: "wishlist",
      populate: populateOptions
    });

    return res.status(200).json({
      success: true,
      wishlist: updatedUser.wishlist || []
    });
  } catch (error) {
    console.error("Toggle wishlist error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Sync guest wishlist items (from local storage) into DB
const syncWishlist = async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!Array.isArray(productIds)) {
      return res.status(400).json({ success: false, message: "productIds must be an array." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    let changed = false;
    for (const id of productIds) {
      if (id && !user.wishlist.includes(id)) {
        // Confirm if the product actually exists before adding
        const exists = await Product.exists({ _id: id });
        if (exists) {
          user.wishlist.push(id);
          changed = true;
        }
      }
    }

    if (changed) {
      await user.save();
    }

    const updatedUser = await User.findById(req.user.id).populate({
      path: "wishlist",
      populate: populateOptions
    });

    return res.status(200).json({
      success: true,
      wishlist: updatedUser.wishlist || []
    });
  } catch (error) {
    console.error("Sync wishlist error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Remove wishlist item
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const initialLength = user.wishlist.length;
    user.wishlist = user.wishlist.filter(
      (id) => id && id.toString() !== productId.toString()
    );

    if (user.wishlist.length !== initialLength) {
      await user.save();
    }

    const updatedUser = await User.findById(req.user.id).populate({
      path: "wishlist",
      populate: populateOptions
    });

    return res.status(200).json({
      success: true,
      wishlist: updatedUser.wishlist || []
    });
  } catch (error) {
    console.error("Remove from wishlist error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getWishlist,
  toggleWishlist,
  removeFromWishlist,
  syncWishlist
};
