const mongoose = require("mongoose");
const Product = require("../../models/product");
const Category = require("../../models/category");
const SubCategory = require("../../models/SubCategory");
const SizeGuide = require("../../models/sizeGuide");
const Color = require("../../models/color");

// Create Product
const createProduct = async (req, res) => {
  try {
    const {
      title,
      price,
      category,
      subCategory,
      collection,
      sizeGuide,
      description,
      material,
      fit,
      weight,
      care,
      status,
      featured,
      variantStock,
    } = req.body;

    // Standard validations
    if (!title || !price || !category || !subCategory || !sizeGuide) {
      return res.status(400).json({
        success: false,
        message: "Title, price, category, subCategory, and sizeGuide are required.",
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ success: false, message: "Invalid category ID." });
    }
    if (!mongoose.Types.ObjectId.isValid(subCategory)) {
      return res.status(400).json({ success: false, message: "Invalid subcategory ID." });
    }
    if (collection && !mongoose.Types.ObjectId.isValid(collection)) {
      return res.status(400).json({ success: false, message: "Invalid collection ID." });
    }
    if (!mongoose.Types.ObjectId.isValid(sizeGuide)) {
      return res.status(400).json({ success: false, message: "Invalid size guide ID." });
    }

    // Check if referenced items exist
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({ success: false, message: "Category not found." });
    }

    const subCategoryExists = await SubCategory.findById(subCategory);
    if (!subCategoryExists) {
      return res.status(404).json({ success: false, message: "Subcategory not found." });
    }

    if (collection) {
      const collectionExists = await mongoose.model("Collection").findById(collection);
      if (!collectionExists) {
        return res.status(404).json({ success: false, message: "Collection not found." });
      }
    }

    const sizeGuideExists = await SizeGuide.findById(sizeGuide);
    if (!sizeGuideExists) {
      return res.status(404).json({ success: false, message: "Size guide not found." });
    }

    // Parse and validate colors
    let parsedColors = [];
    if (req.body.colors) {
      try {
        const parsed = JSON.parse(req.body.colors);
        if (Array.isArray(parsed)) {
          parsedColors = parsed.map(c => {
            if (typeof c === "string") {
              return { color: c, images: [] };
            } else if (c && typeof c === "object" && c.color) {
              return { color: c.color, images: c.images || [] };
            }
            return null;
          }).filter(Boolean);
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid colors array JSON format.",
        });
      }
    }

    // Check if all color IDs are valid and exist
    for (const colorItem of parsedColors) {
      if (!mongoose.Types.ObjectId.isValid(colorItem.color)) {
        return res.status(400).json({
          success: false,
          message: `Invalid color ID: ${colorItem.color}`,
        });
      }
      const colorExists = await Color.findById(colorItem.color);
      if (!colorExists) {
        return res.status(404).json({
          success: false,
          message: `Color not found with ID: ${colorItem.color}`,
        });
      }
    }

    // Map uploaded files to color specific images
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        if (file.fieldname.startsWith("color_images_")) {
          const colorId = file.fieldname.replace("color_images_", "");
          const match = parsedColors.find(c => c.color.toString() === colorId);
          if (match) {
            match.images.push(`/uploads/${file.filename}`);
          }
        }
      });
    }

    // Parse and validate faqs
    let parsedFaqs = [];
    if (req.body.faqs) {
      try {
        const parsed = JSON.parse(req.body.faqs);
        if (Array.isArray(parsed)) {
          parsedFaqs = parsed.map(f => {
            if (f && typeof f === "object" && f.question && f.answer) {
              return { question: f.question.trim(), answer: f.answer.trim() };
            }
            return null;
          }).filter(Boolean);
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid faqs array JSON format.",
        });
      }
    }

    const slugify = (text) => {
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
    };

    let slug = req.body.slug ? slugify(req.body.slug) : slugify(title);
    let slugExists = await Product.findOne({ slug });

    if (req.body.slug && slugExists) {
      return res.status(400).json({
        success: false,
        message: "Product slug is already in use. Please choose a different one.",
      });
    }

    let counter = 1;
    const baseSlug = slug;
    while (slugExists) {
      slug = `${baseSlug}-${counter}`;
      slugExists = await Product.findOne({ slug });
      counter++;
    }

    const product = await Product.create({
      title: title.trim(),
      slug,
      price: Number(price),
      category,
      subCategory,
      collection: collection || undefined,
      sizeGuide,
      colors: parsedColors,
      faqs: parsedFaqs,
      description: description ? description.trim() : undefined,
      material: material ? material.trim() : undefined,
      fit: fit ? fit.trim() : undefined,
      weight: weight ? weight.trim() : undefined,
      care: care ? care.trim() : undefined,
      status: status === undefined ? true : status,
      featured: featured === 'true' || featured === true,
      variantStock: variantStock ? (typeof variantStock === 'string' ? JSON.parse(variantStock) : variantStock) : {},
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category", "Name image")
      .populate("subCategory", "name image")
      .populate("collection", "Name image")
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

// Get Product By ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findById(id)
      .populate("category", "Name image")
      .populate("subCategory", "name image")
      .populate("collection", "Name image")
      .populate("sizeGuide", "name chart")
      .populate("colors.color", "name hexCode");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const {
      title,
      price,
      category,
      subCategory,
      collection,
      sizeGuide,
      description,
      material,
      fit,
      weight,
      care,
      status,
      featured,
      variantStock,
    } = req.body;

    // Validate new updates if provided
    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({ success: false, message: "Invalid category ID." });
      }
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(404).json({ success: false, message: "Category not found." });
      }
      product.category = category;
    }

    if (subCategory) {
      if (!mongoose.Types.ObjectId.isValid(subCategory)) {
        return res.status(400).json({ success: false, message: "Invalid subcategory ID." });
      }
      const subCategoryExists = await SubCategory.findById(subCategory);
      if (!subCategoryExists) {
        return res.status(404).json({ success: false, message: "Subcategory not found." });
      }
      product.subCategory = subCategory;
    }

    if (collection) {
      if (!mongoose.Types.ObjectId.isValid(collection)) {
        return res.status(400).json({ success: false, message: "Invalid collection ID." });
      }
      const collectionExists = await mongoose.model("Collection").findById(collection);
      if (!collectionExists) {
        return res.status(404).json({ success: false, message: "Collection not found." });
      }
      product.collection = collection;
    } else if (collection === "") {
      product.collection = undefined;
    }

    if (sizeGuide) {
      if (!mongoose.Types.ObjectId.isValid(sizeGuide)) {
        return res.status(400).json({ success: false, message: "Invalid size guide ID." });
      }
      const sizeGuideExists = await SizeGuide.findById(sizeGuide);
      if (!sizeGuideExists) {
        return res.status(404).json({ success: false, message: "Size guide not found." });
      }
      product.sizeGuide = sizeGuide;
    }

    if (req.body.slug !== undefined) {
      const slugify = (text) => {
        return text
          .toString()
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^\w\-]+/g, "")
          .replace(/\-\-+/g, "-")
          .replace(/^-+/, "")
          .replace(/-+$/, "");
      };

      let slug = req.body.slug ? slugify(req.body.slug) : slugify(title || product.title);
      if (slug !== product.slug) {
        let slugExists = await Product.findOne({ slug, _id: { $ne: id } });
        if (req.body.slug && slugExists) {
          return res.status(400).json({
            success: false,
            message: "Product slug is already in use. Please choose a different one.",
          });
        }

        let counter = 1;
        const baseSlug = slug;
        while (slugExists) {
          slug = `${baseSlug}-${counter}`;
          slugExists = await Product.findOne({ slug, _id: { $ne: id } });
          counter++;
        }
        product.slug = slug;
      }
    } else if (title !== undefined && title.trim() !== product.title) {
      const slugify = (text) => {
        return text
          .toString()
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^\w\-]+/g, "")
          .replace(/\-\-+/g, "-")
          .replace(/^-+/, "")
          .replace(/-+$/, "");
      };

      let slug = slugify(title);
      let slugExists = await Product.findOne({ slug, _id: { $ne: id } });
      let counter = 1;
      const baseSlug = slug;
      while (slugExists) {
        slug = `${baseSlug}-${counter}`;
        slugExists = await Product.findOne({ slug, _id: { $ne: id } });
        counter++;
      }
      product.slug = slug;
    }

    if (title !== undefined) {
      product.title = title.trim();
    }

    if (price !== undefined) {
      product.price = Number(price);
    }

    if (description !== undefined) {
      product.description = description.trim();
    }

    if (material !== undefined) {
      product.material = material.trim();
    }

    if (fit !== undefined) {
      product.fit = fit.trim();
    }

    if (weight !== undefined) {
      product.weight = weight.trim();
    }

    if (care !== undefined) {
      product.care = care.trim();
    }

    if (status !== undefined) {
      product.status = status;
    }

    if (featured !== undefined) {
      product.featured = featured === 'true' || featured === true;
    }

    if (variantStock !== undefined) {
      try {
        product.variantStock = typeof variantStock === 'string' ? JSON.parse(variantStock) : variantStock;
        product.markModified("variantStock");
      } catch (error) {
        console.error("Invalid variantStock JSON format:", error);
      }
    }

    // If colors are supplied, update them
    if (req.body.colors) {
      let parsedColors = [];
      try {
        const parsed = JSON.parse(req.body.colors);
        if (Array.isArray(parsed)) {
          parsedColors = parsed.map(c => {
            if (typeof c === "string") {
              return { color: c, images: [] };
            } else if (c && typeof c === "object" && c.color) {
              return { color: c.color, images: c.images || [] };
            }
            return null;
          }).filter(Boolean);
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid colors array JSON format.",
        });
      }

      // Check colors validity
      for (const colorItem of parsedColors) {
        if (!mongoose.Types.ObjectId.isValid(colorItem.color)) {
          return res.status(400).json({
            success: false,
            message: `Invalid color ID: ${colorItem.color}`,
          });
        }
        const colorExists = await Color.findById(colorItem.color);
        if (!colorExists) {
          return res.status(404).json({
            success: false,
            message: `Color not found with ID: ${colorItem.color}`,
          });
        }
      }

      // Merge newly uploaded files with the parsed colors
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach(file => {
          if (file.fieldname.startsWith("color_images_")) {
            const colorId = file.fieldname.replace("color_images_", "");
            const match = parsedColors.find(c => c.color.toString() === colorId);
            if (match) {
              match.images.push(`/uploads/${file.filename}`);
            }
          }
        });
      }

      product.colors = parsedColors;
    } else if (req.files && Array.isArray(req.files)) {
      // If colors were not updated but new images were uploaded to existing colors
      req.files.forEach(file => {
        if (file.fieldname.startsWith("color_images_")) {
          const colorId = file.fieldname.replace("color_images_", "");
          const match = product.colors.find(c => c.color.toString() === colorId);
          if (match) {
            match.images.push(`/uploads/${file.filename}`);
          }
        }
      });
    }

    // Parse and validate faqs
    if (req.body.faqs !== undefined) {
      let parsedFaqs = [];
      try {
        const parsed = JSON.parse(req.body.faqs);
        if (Array.isArray(parsed)) {
          parsedFaqs = parsed.map(f => {
            if (f && typeof f === "object" && f.question && f.answer) {
              return { question: f.question.trim(), answer: f.answer.trim() };
            }
            return null;
          }).filter(Boolean);
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid faqs array JSON format.",
        });
      }
      product.faqs = parsedFaqs;
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
