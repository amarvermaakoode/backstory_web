const PromoCode = require("../../models/promoCode");

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
    const promoCode = await PromoCode.findOne({ code: cleanCode });

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
  validatePromoCode,
};
