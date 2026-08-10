const Product = require("../../models/product");
const Category = require("../../models/category");
const SubCategory = require("../../models/SubCategory");
const Collection = require("../../models/collection");
const Color = require("../../models/color");
const SizeGuide = require("../../models/sizeGuide");
const Review = require("../../models/review");

// Escape user input before using it inside a RegExp
const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const MAX_TOKENS = 8;
const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 48;

// Parse a comma separated query param into a clean array
const parseList = (value) => {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
};

/**
 * Build the $or clause for a single search token.
 * Product fields are matched directly, referenced documents
 * (category / sub category / collection / colour) are resolved to ids first.
 */
const buildTokenClause = async (token) => {
  const rx = new RegExp(escapeRegex(token), "i");
  // Gender is a short enum ("Men" is a substring of "Women"), so match from the start
  const genderRx = new RegExp(`^${escapeRegex(token)}`, "i");

  const [categoryIds, subCategoryIds, collectionIds, colorIds] = await Promise.all([
    Category.find({ Name: rx, status: true }).distinct("_id"),
    SubCategory.find({ name: rx, status: true }).distinct("_id"),
    Collection.find({ Name: rx, status: true }).distinct("_id"),
    Color.find({ name: rx, status: true }).distinct("_id"),
  ]);

  const clauses = [
    { title: rx },
    { description: rx },
    { slug: rx },
    { material: rx },
    { fit: rx },
    { care: rx },
    { weight: rx },
    { gender: genderRx },
  ];

  if (categoryIds.length) clauses.push({ category: { $in: categoryIds } });
  if (subCategoryIds.length) clauses.push({ subCategory: { $in: subCategoryIds } });
  if (collectionIds.length) clauses.push({ collection: { $in: collectionIds } });
  if (colorIds.length) clauses.push({ "colors.color": { $in: colorIds } });

  return { $or: clauses };
};

/**
 * Build the filter clauses (gender / price / sizes / colours / series /
 * category / collection / sub category) exactly as they arrive from the
 * existing listing filter architecture.
 */
const buildFilterClauses = async (query) => {
  const clauses = [];

  const { gender, minPrice, maxPrice, sizes, colors, series, category, collection, subCategory } = query;

  if (gender && gender.toUpperCase() !== "ALL") {
    clauses.push({ gender: new RegExp(`^${escapeRegex(gender)}$`, "i") });
  }

  const priceClause = {};
  const min = Number(minPrice);
  const max = Number(maxPrice);
  if (minPrice !== undefined && minPrice !== "" && !Number.isNaN(min)) priceClause.$gte = min;
  if (maxPrice !== undefined && maxPrice !== "" && !Number.isNaN(max)) priceClause.$lte = max;
  if (Object.keys(priceClause).length) clauses.push({ price: priceClause });

  const sizeList = parseList(sizes);
  if (sizeList.length) {
    const sizeRegexes = sizeList.map((s) => new RegExp(`^${escapeRegex(s)}$`, "i"));
    const sizeGuideIds = await SizeGuide.find({ "chart.size": { $in: sizeRegexes } }).distinct("_id");
    clauses.push({ sizeGuide: { $in: sizeGuideIds } });
  }

  const colorList = parseList(colors);
  if (colorList.length) {
    const colorRegexes = colorList.map((c) => new RegExp(`^${escapeRegex(c)}$`, "i"));
    const colorIds = await Color.find({
      $or: [{ hexCode: { $in: colorRegexes } }, { name: { $in: colorRegexes } }],
    }).distinct("_id");
    clauses.push({ "colors.color": { $in: colorIds } });
  }

  const seriesList = parseList(series);
  if (seriesList.length) {
    // The listing UI labels these "<name> Series" but stores them as sub categories
    const seriesRegexes = seriesList.map(
      (s) => new RegExp(escapeRegex(s.replace(/\s*series\s*$/i, "").trim()), "i")
    );
    const seriesSubIds = await SubCategory.find({ name: { $in: seriesRegexes } }).distinct("_id");
    clauses.push({ subCategory: { $in: seriesSubIds } });
  }

  if (category && category.toUpperCase() !== "ALL") {
    const ids = await Category.find({
      $or: [{ slug: category.toLowerCase() }, { Name: new RegExp(`^${escapeRegex(category)}$`, "i") }],
    }).distinct("_id");
    clauses.push({ category: { $in: ids } });
  }

  if (collection && collection.toUpperCase() !== "ALL") {
    const ids = await Collection.find({
      $or: [{ slug: collection.toLowerCase() }, { Name: new RegExp(`^${escapeRegex(collection)}$`, "i") }],
    }).distinct("_id");
    clauses.push({ collection: { $in: ids } });
  }

  if (subCategory && subCategory.toUpperCase() !== "ALL") {
    const ids = await SubCategory.find({
      $or: [{ slug: subCategory.toLowerCase() }, { name: new RegExp(`^${escapeRegex(subCategory)}$`, "i") }],
    }).distinct("_id");
    clauses.push({ subCategory: { $in: ids } });
  }

  return clauses;
};

// GET /api/frontend/search
const searchProducts = async (req, res) => {
  try {
    const rawQuery = typeof req.query.q === "string" ? req.query.q.trim() : "";

    if (!rawQuery) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const tokens = rawQuery.split(/\s+/).filter(Boolean).slice(0, MAX_TOKENS);

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_LIMIT));
    const skip = (page - 1) * limit;
    const sort = req.query.sort || "featured";

    // Every token must match at least one field (AND across tokens, OR across fields)
    const tokenClauses = await Promise.all(tokens.map(buildTokenClause));
    const filterClauses = await buildFilterClauses(req.query);

    const searchOnlyQuery = { status: true, $and: tokenClauses };
    const finalQuery = { status: true, $and: [...tokenClauses, ...filterClauses] };

    // Highest price within the matched set, used by the existing filter drawer slider
    const [total, priceStats] = await Promise.all([
      Product.countDocuments(finalQuery),
      Product.aggregate([{ $match: searchOnlyQuery }, { $group: { _id: null, max: { $max: "$price" } } }]),
    ]);

    const totalPages = Math.ceil(total / limit) || 0;

    // Rank + paginate in the database, then hydrate the page with the same
    // populated shape the existing product endpoints return.
    const fullRx = new RegExp(escapeRegex(rawQuery), "i");
    const anyTokenRx = new RegExp(tokens.map(escapeRegex).join("|"), "i");

    const pipeline = [{ $match: finalQuery }];
    let sortStage;

    if (sort === "price-asc") {
      sortStage = { price: 1, createdAt: -1 };
    } else if (sort === "price-desc") {
      sortStage = { price: -1, createdAt: -1 };
    } else if (sort === "rating") {
      pipeline.push(
        {
          $lookup: {
            from: "reviews",
            let: { productId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $and: [{ $eq: ["$product", "$$productId"] }, { $eq: ["$status", true] }] },
                },
              },
              { $project: { rating: 1 } },
            ],
            as: "reviewDocs",
          },
        },
        {
          $addFields: {
            avgRating: {
              $cond: [{ $gt: [{ $size: "$reviewDocs" }, 0] }, { $avg: "$reviewDocs.rating" }, 5],
            },
          },
        }
      );
      sortStage = { avgRating: -1, createdAt: -1 };
    } else {
      // Default ordering: title matches first, then newest (same order as the listing default)
      pipeline.push({
        $addFields: {
          relevance: {
            $add: [
              { $cond: [{ $regexMatch: { input: { $ifNull: ["$title", ""] }, regex: fullRx } }, 2, 0] },
              { $cond: [{ $regexMatch: { input: { $ifNull: ["$title", ""] }, regex: anyTokenRx } }, 1, 0] },
            ],
          },
        },
      });
      sortStage = { relevance: -1, createdAt: -1 };
    }

    pipeline.push({ $sort: sortStage }, { $skip: skip }, { $limit: limit }, { $project: { _id: 1 } });

    const rankedIds = (await Product.aggregate(pipeline)).map((doc) => doc._id);

    let productsWithRatings = [];

    if (rankedIds.length) {
      const products = await Product.find({ _id: { $in: rankedIds } })
        .populate("category", "Name image slug")
        .populate("subCategory", "name image slug")
        .populate("collection", "Name image slug")
        .populate("sizeGuide", "name chart")
        .populate("colors.color", "name hexCode");

      // Restore the ranking order lost by the $in lookup
      const byId = new Map(products.map((p) => [String(p._id), p]));
      const ordered = rankedIds.map((id) => byId.get(String(id))).filter(Boolean);

      productsWithRatings = await Promise.all(
        ordered.map(async (p) => {
          const reviews = await Review.find({ product: p._id, status: true });
          let rating = "5.0";
          const reviewsCount = reviews.length;
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
    }

    return res.status(200).json({
      success: true,
      query: rawQuery,
      count: productsWithRatings.length,
      total,
      page,
      limit,
      totalPages,
      maxPrice: priceStats[0]?.max || 0,
      data: productsWithRatings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  searchProducts,
};
