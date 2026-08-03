const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./config/db");
const migrationAutoSlug = require("./scripts/migrateSlugs");
const errorHandler = require("./middlewares/errorHandler");

const adminAuthRoutes = require("./routes/admin/authRoutes");
const categoryRoutes = require("./routes/admin/categoryRoutes");
const subCategoryRoutes = require("./routes/admin/subCategoryRoutes");
const collectionRoutes = require("./routes/admin/collectionRoutes");
const colorRoutes = require("./routes/admin/colorRoutes");
const sizeGuideRoutes = require("./routes/admin/sizeGuideRoutes");
const productRoutes = require("./routes/admin/productRoutes");
const adminReviewRoutes = require("./routes/admin/reviewRoutes");
const frontendCategoryRoutes = require("./routes/frontend/categoryFrntRoutes");
const frontendSubCategoryRoutes = require("./routes/frontend/subcategoryFrntRoutes");
const frontendCollectionRoutes = require("./routes/frontend/collectionFrntRoutes");
const frontendProductRoutes = require("./routes/frontend/productFrntRoutes");
const frontendReviewRoutes = require("./routes/frontend/reviewFrntRoutes");
const frontendAuthRoutes = require("./routes/frontend/authFrntRoutes");
const frontendWishlistRoutes = require("./routes/frontend/wishlistFrntRoutes");
const frontendCartRoutes = require("./routes/frontend/cartFrntRoutes");
const adminPromoCodeRoutes = require("./routes/admin/promoCodeRoutes");
const frontendPromoCodeRoutes = require("./routes/frontend/promoCodeFrntRoutes");
const adminSupportRoutes = require("./routes/admin/supportAdminRoutes");
const frontendSupportRoutes = require("./routes/frontend/supportFrntRoutes");

dotenv.config();

const app = express();

// Connect Database
connectDB().then(() => {
  migrationAutoSlug();

  const syncUserIndexes = async () => {
    try {
      const User = require("./models/user");
      await User.syncIndexes();
      console.log("✅ User indexes synchronized successfully.");
    } catch (err) {
      console.error("❌ User index synchronization error:", err.message);
    }
  };
  syncUserIndexes();
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin/categories", categoryRoutes);
app.use("/api/admin/sub-categories", subCategoryRoutes);
app.use("/api/admin/collections", collectionRoutes);
app.use("/api/admin/colors", colorRoutes);
app.use("/api/admin/size-guides", sizeGuideRoutes);
app.use("/api/admin/products", productRoutes);
app.use("/api/admin/reviews", adminReviewRoutes);
app.use("/api/admin/promo-codes", adminPromoCodeRoutes);
app.use("/api/admin/support-tickets", adminSupportRoutes);

//frontend routes
app.use("/api/frontend/categories", frontendCategoryRoutes);
app.use("/api/frontend/sub-categories", frontendSubCategoryRoutes);
app.use("/api/frontend/collections", frontendCollectionRoutes);
app.use("/api/frontend/products", frontendProductRoutes);
app.use("/api/frontend/reviews", frontendReviewRoutes);
app.use("/api/frontend/auth", frontendAuthRoutes);
app.use("/api/frontend/wishlist", frontendWishlistRoutes);
app.use("/api/frontend/cart", frontendCartRoutes);
app.use("/api/frontend/promo-codes", frontendPromoCodeRoutes);
app.use("/api/frontend/support", frontendSupportRoutes);

// Health Check
app.get("/", (req, res) => {
  res.send("Backend is running successfully");
});

// Global Error Handler Middleware
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});