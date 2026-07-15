const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./config/db");

const adminAuthRoutes = require("./routes/admin/authRoutes");
const categoryRoutes = require("./routes/admin/categoryRoutes");
const subCategoryRoutes = require("./routes/admin/subCategoryRoutes");
const collectionRoutes = require("./routes/admin/collectionRoutes");
const colorRoutes = require("./routes/admin/colorRoutes");
const sizeGuideRoutes = require("./routes/admin/sizeGuideRoutes");
const productRoutes = require("./routes/admin/productRoutes");
const frontendCategoryRoutes = require("./routes/frontend/categoryFrntRoutes");
const frontendSubCategoryRoutes = require("./routes/frontend/subcategoryFrntRoutes");
const frontendCollectionRoutes = require("./routes/frontend/collectionFrntRoutes");
const frontendProductRoutes = require("./routes/frontend/productFrntRoutes");

dotenv.config();

const app = express();

// Connect Database
connectDB().then(() => {
  // Run migration to auto-slug existing docs
  const migrationAutoSlug = async () => {
    try {
      const Category = require("./models/category");
      const SubCategory = require("./models/SubCategory");
      const Collection = require("./models/collection");

      // categories
      const categories = await Category.find({ $or: [{ slug: { $exists: false } }, { slug: "" }, { slug: null }] });
      for (let cat of categories) {
        await cat.save();
      }

      // subcategories
      const subcategories = await SubCategory.find({ $or: [{ slug: { $exists: false } }, { slug: "" }, { slug: null }] });
      for (let sub of subcategories) {
        await sub.save();
      }

      // collections
      const collections = await Collection.find({ $or: [{ slug: { $exists: false } }, { slug: "" }, { slug: null }] });
      for (let col of collections) {
        await col.save();
      }

      console.log("✅ Slug migration completed successfully.");
    } catch (err) {
      console.error("❌ Slug migration error:", err.message);
    }
  };
  migrationAutoSlug();
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

//frontend routes
//app.use("/api/categories", categoryFrntRoutes);

app.use("/api/frontend/categories", frontendCategoryRoutes);
app.use("/api/frontend/sub-categories", frontendSubCategoryRoutes);
app.use("/api/frontend/collections", frontendCollectionRoutes);
app.use("/api/frontend/products", frontendProductRoutes);

// Health Check
app.get("/", (req, res) => {
  res.send("Backend is running successfully");
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});