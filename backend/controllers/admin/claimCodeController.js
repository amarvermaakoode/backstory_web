const ClaimCode = require("../../models/ClaimCode");
const crypto = require("crypto");

// Helper to generate unique claim code string
const generateCodeString = (type = "MARKETING") => {
  const prefix = (type || "MARKETING").toUpperCase() === "GIFT" ? "GIFT" : "MKT";
  const part1 = crypto.randomBytes(2).toString("hex").toUpperCase();
  const part2 = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${part1}-${part2}`;
};

// Admin: Generate 1 or bulk Claim Codes
exports.generateClaimCodes = async (req, res) => {
  try {
    const { type = "MARKETING", quantity = 1, expiresAt, note = "" } = req.body || {};

    const codeType = ["GIFT", "MARKETING"].includes((type || "").toUpperCase())
      ? type.toUpperCase()
      : "MARKETING";

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1 || qty > 100) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be between 1 and 100",
      });
    }

    let parsedExpiry = null;
    if (expiresAt) {
      parsedExpiry = new Date(expiresAt);
      if (isNaN(parsedExpiry.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid expiration date",
        });
      }
    }

    const createdCodesSet = new Set();
    const claimCodeDocs = [];

    for (let i = 0; i < qty; i++) {
      let code = generateCodeString(codeType);
      let attempts = 0;
      while ((createdCodesSet.has(code) || (await ClaimCode.exists({ code }))) && attempts < 10) {
        code = generateCodeString(codeType);
        attempts++;
      }

      createdCodesSet.add(code);
      claimCodeDocs.push({
        code,
        type: codeType,
        status: "unused",
        note: (note || "").trim(),
        expiresAt: parsedExpiry,
        createdBy: req.user ? req.user._id : null,
      });
    }

    const createdCodes = await ClaimCode.insertMany(claimCodeDocs);

    return res.status(201).json({
      success: true,
      message: `Successfully generated ${qty} ${codeType} claim code(s).`,
      claimCodes: createdCodes,
    });
  } catch (error) {
    console.error("Error generating claim codes:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate claim codes",
      error: error.message,
    });
  }
};

// Admin: Get all Claim Codes with pagination & filtering
exports.getAllClaimCodes = async (req, res) => {
  try {
    const { type, status, search, page = 1, limit = 50 } = req.query;

    const query = {};

    if (type && ["GIFT", "MARKETING"].includes(type.toUpperCase())) {
      query.type = type.toUpperCase();
    }

    if (status && ["unused", "used", "revoked", "expired"].includes(status)) {
      query.status = status;
    }

    if (search && search.trim()) {
      query.$or = [
        { code: { $regex: search.trim(), $options: "i" } },
        { note: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;

    // Auto-update expired codes before fetching
    await ClaimCode.updateMany(
      { status: "unused", expiresAt: { $ne: null, $lt: new Date() } },
      { status: "expired" }
    );

    const total = await ClaimCode.countDocuments(query);
    const claimCodes = await ClaimCode.find(query)
      .populate("claimedBy", "name email phoneNumber")
      .populate("claimedQR", "code status")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      claimCodes,
    });
  } catch (error) {
    console.error("Error fetching claim codes:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch claim codes",
      error: error.message,
    });
  }
};

// Admin: Revoke an unused Claim Code
exports.revokeClaimCode = async (req, res) => {
  try {
    const { id } = req.params;

    const claimCodeDoc = await ClaimCode.findById(id);
    if (!claimCodeDoc) {
      return res.status(404).json({
        success: false,
        message: "Claim code not found",
      });
    }

    if (claimCodeDoc.status === "used") {
      return res.status(400).json({
        success: false,
        message: "Cannot revoke a claim code that has already been used",
      });
    }

    if (claimCodeDoc.status === "revoked") {
      return res.status(400).json({
        success: false,
        message: "Claim code is already revoked",
      });
    }

    claimCodeDoc.status = "revoked";
    await claimCodeDoc.save();

    return res.status(200).json({
      success: true,
      message: `Claim code '${claimCodeDoc.code}' has been revoked successfully.`,
      claimCode: claimCodeDoc,
    });
  } catch (error) {
    console.error("Error revoking claim code:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to revoke claim code",
      error: error.message,
    });
  }
};
