const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");

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
const frontendColorRoutes = require("./routes/frontend/colorFrntRoutes");
const frontendSizeGuideRoutes = require("./routes/frontend/sizeGuideFrntRoutes");
const frontendProductRoutes = require("./routes/frontend/productFrntRoutes");
const frontendSearchRoutes = require("./routes/frontend/searchFrntRoutes");
const frontendReviewRoutes = require("./routes/frontend/reviewFrntRoutes");
const frontendAuthRoutes = require("./routes/frontend/authFrntRoutes");
const frontendWishlistRoutes = require("./routes/frontend/wishlistFrntRoutes");
const frontendCartRoutes = require("./routes/frontend/cartFrntRoutes");
const adminPromoCodeRoutes = require("./routes/admin/promoCodeRoutes");
const frontendPromoCodeRoutes = require("./routes/frontend/promoCodeFrntRoutes");
const adminSupportRoutes = require("./routes/admin/supportAdminRoutes");
const frontendSupportRoutes = require("./routes/frontend/supportFrntRoutes");
const adminQRCodeRoutes = require("./routes/admin/qrCodeRoutes");
const adminClaimCodeRoutes = require("./routes/admin/claimCodeRoutes");
const adminOrderRoutes = require("./routes/admin/orderAdminRoutes");
const adminDashboardRoutes = require("./routes/admin/dashboardRoutes");
const frontendQRRoutes = require("./routes/frontend/qrFrntRoutes");
const frontendOrderRoutes = require("./routes/frontend/orderFrntRoutes");
const walletRoutes = require("./routes/frontend/walletRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminShippingRoutes = require("./routes/admin/shippingAdminRoutes");
const frontendShippingRoutes = require("./routes/frontend/shippingFrntRoutes");

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
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Payment routes (supports POST /api/create-order, POST /api/verify-payment, etc.)
app.use("/api", paymentRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/frontend/payment", paymentRoutes);

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
app.use("/api/admin/coupons", adminPromoCodeRoutes);
app.use("/api/admin/support-tickets", adminSupportRoutes);
app.use("/api/admin/qr-codes", adminQRCodeRoutes);
app.use("/api/admin/claim-codes", adminClaimCodeRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/shipping-rates", adminShippingRoutes);

//frontend routes
app.use("/api/frontend/categories", frontendCategoryRoutes);
app.use("/api/frontend/sub-categories", frontendSubCategoryRoutes);
app.use("/api/frontend/collections", frontendCollectionRoutes);
app.use("/api/frontend/colors", frontendColorRoutes);
app.use("/api/frontend/size-guides", frontendSizeGuideRoutes);
app.use("/api/frontend/products", frontendProductRoutes);
app.use("/api/frontend/search", frontendSearchRoutes);
app.use("/api/frontend/reviews", frontendReviewRoutes);
app.use("/api/frontend/auth", frontendAuthRoutes);
app.use("/api/frontend/wishlist", frontendWishlistRoutes);
app.use("/api/frontend/cart", frontendCartRoutes);
app.use("/api/frontend/promo-codes", frontendPromoCodeRoutes);
app.use("/api/frontend/coupons", frontendPromoCodeRoutes);
app.use("/api/frontend/support", frontendSupportRoutes);
app.use("/api/frontend/qr", frontendQRRoutes);
app.use("/api/frontend/orders", frontendOrderRoutes);
app.use("/api/frontend/user/wallet", walletRoutes);
app.use("/api/frontend/shipping-rates", frontendShippingRoutes);

// Health Check
app.get("/", (req, res) => {
  res.send("Backend is running successfully");
});

// JSON 404 Handler for undefined API routes (prevents HTML doctype response errors)
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler Middleware
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});