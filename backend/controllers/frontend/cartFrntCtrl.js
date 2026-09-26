const User = require("../../models/user");
const Product = require("../../models/product");

const populateOptions = [
  { path: "category", select: "Name image slug" },
  { path: "subCategory", select: "name image slug" },
  { path: "collection", select: "Name image slug" },
  { path: "sizeGuide", select: "name chart" },
  { path: "colors.color", select: "name hexCode" }
];

// Helper to get populated user cart
const getPopulatedUserCart = async (userId) => {
  const user = await User.findById(userId).populate({
    path: "cart.product",
    populate: populateOptions
  });
  return user ? user.cart : [];
};

// 1. Get cart
const getCart = async (req, res) => {
  try {
    const cart = await getPopulatedUserCart(req.user.id);
    return res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("Get cart error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Add to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity, size, color } = req.body;
    if (!productId || !size || !color || !color.name || !color.hex) {
      return res.status(400).json({ success: false, message: "Missing required cart fields." });
    }

    const qty = Number(quantity) || 1;

    // Check product exists
    const productExists = await Product.exists({ _id: productId });
    if (!productExists) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Find if exact item already in cart
    const existingIndex = user.cart.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.size === size &&
        item.color.name === color.name
    );

    if (existingIndex > -1) {
      user.cart[existingIndex].quantity += qty;
    } else {
      user.cart.push({
        product: productId,
        size,
        color: {
          name: color.name,
          hex: color.hex
        },
        quantity: qty
      });
    }

    // Automatically remove from wishlist if present
    if (user.wishlist && user.wishlist.length > 0) {
      user.wishlist = user.wishlist.filter(
        (id) => id && id.toString() !== productId.toString()
      );
    }

    await user.save();
    const cart = await getPopulatedUserCart(req.user.id);

    return res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("Add to cart error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Remove from cart
const removeFromCart = async (req, res) => {
  try {
    const { productId, size, colorName } = req.body;
    if (!productId || !size || !colorName) {
      return res.status(400).json({ success: false, message: "Missing required fields to identify cart item." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Filter out the item
    user.cart = user.cart.filter(
      (item) =>
        !(item.product.toString() === productId &&
          item.size === size &&
          item.color.name === colorName)
    );

    await user.save();
    const cart = await getPopulatedUserCart(req.user.id);

    return res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("Remove from cart error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update quantity
const updateQuantity = async (req, res) => {
  try {
    const { productId, size, colorName, quantity } = req.body;
    if (!productId || !size || !colorName || quantity === undefined) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const qty = Number(quantity);
    if (qty < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const index = user.cart.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.size === size &&
        item.color.name === colorName
    );

    if (index > -1) {
      user.cart[index].quantity = qty;
      await user.save();
    } else {
      return res.status(404).json({ success: false, message: "Cart item not found." });
    }

    const cart = await getPopulatedUserCart(req.user.id);
    return res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("Update cart quantity error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Sync cart
const syncCart = async (req, res) => {
  try {
    const { cartItems } = req.body; // Array of guest cart items
    if (!Array.isArray(cartItems)) {
      return res.status(400).json({ success: false, message: "cartItems must be an array." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    let changed = false;
    for (const item of cartItems) {
      const pId = item.productId || item.product;
      const size = item.size;
      const color = item.color;
      const qty = Number(item.quantity) || 1;

      if (!pId || !size || !color || !color.name || !color.hex) continue;

      // Verify product exists
      const productExists = await Product.exists({ _id: pId });
      if (!productExists) continue;

      // Find if exact item already in database cart
      const databaseIndex = user.cart.findIndex(
        (dbItem) =>
          dbItem.product.toString() === pId &&
          dbItem.size === size &&
          dbItem.color.name === color.name
      );

      if (databaseIndex > -1) {
        user.cart[databaseIndex].quantity += qty;
        changed = true;
      } else {
        user.cart.push({
          product: pId,
          size,
          color: {
            name: color.name,
            hex: color.hex
          },
          quantity: qty
        });
        changed = true;
      }
    }

    if (changed) {
      // Automatically remove synchronized items from user's wishlist
      if (user.wishlist && user.wishlist.length > 0) {
        user.wishlist = user.wishlist.filter((id) => {
          return !cartItems.some(
            (ci) => (ci.productId || ci.product || ci.id || ci._id)?.toString() === id.toString()
          );
        });
      }
      await user.save();
    }

    const cart = await getPopulatedUserCart(req.user.id);
    return res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("Sync cart error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Clear cart
const clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.cart = [];
    await user.save();

    return res.status(200).json({ success: true, cart: [] });
  } catch (error) {
    console.error("Clear cart error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  updateQuantity,
  syncCart,
  clearCart
};
