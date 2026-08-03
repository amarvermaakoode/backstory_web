const PromoCode = require("../../models/promoCode");

const defaultPromoCodes = [
  {
    code: "WELCOME10",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 1000,
    status: true,
  },
  {
    code: "BACSTORY15",
    discountType: "percentage",
    discountValue: 15,
    minOrderAmount: 2000,
    status: true,
  },
  {
    code: "FLAT500",
    discountType: "flat",
    discountValue: 500,
    minOrderAmount: 3000,
    status: true,
  },
];

// @desc    Get all active promo codes for frontend
// @route   GET /api/frontend/promo-codes
// @access  Public
const getActivePromoCodes = async (req, res) => {
  try {
    let promoCodes = await PromoCode.find({ status: true }).sort({ createdAt: -1 });

    // If no active promo codes exist in database, seed initial default promo codes
    if (!promoCodes || promoCodes.length === 0) {
      try {
        const totalInDb = await PromoCode.countDocuments();
        if (totalInDb === 0) {
          await PromoCode.insertMany(defaultPromoCodes);
          promoCodes = await PromoCode.find({ status: true }).sort({ createdAt: -1 });
        }
      } catch (seedErr) {
        console.error("Auto seed promo codes error:", seedErr.message);
        promoCodes = defaultPromoCodes;
      }
    }

    return res.status(200).json({
      success: true,
      count: promoCodes.length,
      data: promoCodes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Validate a promo code for checkout
// @route   POST /api/frontend/promo-codes/validate
// @access  Public
const validatePromoCode = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Promo code is required.",
      });
    }

    const cleanCode = code.trim().toUpperCase();
    let promoCode = await PromoCode.findOne({ code: cleanCode });

    if (!promoCode) {
      const defaultMatch = defaultPromoCodes.find((p) => p.code === cleanCode);
      if (defaultMatch) {
        promoCode = await PromoCode.create(defaultMatch);
      }
    }

    if (!promoCode || promoCode.status === false) {
      return res.status(404).json({
        success: false,
        message: "Invalid promo code.",
      });
    }

    // Check if order amount is sufficient
    const subtotal = Number(orderAmount) || 0;
    if (subtotal < promoCode.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `This promo code requires a minimum order amount of Rs ${promoCode.minOrderAmount}.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Promo code applied successfully.",
      data: {
        code: promoCode.code,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        minOrderAmount: promoCode.minOrderAmount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getActivePromoCodes,
  validatePromoCode,
};
