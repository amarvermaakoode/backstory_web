const PromoCode = require("../../models/promoCode");

// get all promo codes
const getPromoCodes = async (req, res) => {
  try {
    const promoCodes = await PromoCode.find().sort({ createdAt: -1 });
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

// create a new promo code
const createPromoCode = async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, status } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({
        success: false,
        message: "Code, discount type, and discount value are required.",
      });
    }

    const cleanCode = code.trim().toUpperCase();

    const existingPromo = await PromoCode.findOne({ code: cleanCode });
    if (existingPromo) {
      return res.status(400).json({
        success: false,
        message: "Promo code already exists.",
      });
    }

    const promoCode = await PromoCode.create({
      code: cleanCode,
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: minOrderAmount !== undefined ? Number(minOrderAmount) : 0,
      status: status !== undefined ? status === true || status === "true" : true,
    });

    return res.status(201).json({
      success: true,
      message: "Promo code created successfully.",
      data: promoCode,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// update an existing promo code
const updatePromoCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, discountType, discountValue, minOrderAmount, status } = req.body;

    const promoCode = await PromoCode.findById(id);
    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: "Promo code not found.",
      });
    }

    if (code) {
      const cleanCode = code.trim().toUpperCase();
      if (cleanCode !== promoCode.code) {
        const existingPromo = await PromoCode.findOne({ code: cleanCode });
        if (existingPromo) {
          return res.status(400).json({
            success: false,
            message: "Promo code already exists.",
          });
        }
        promoCode.code = cleanCode;
      }
    }

    if (discountType) {
      promoCode.discountType = discountType;
    }

    if (discountValue !== undefined) {
      promoCode.discountValue = Number(discountValue);
    }

    if (minOrderAmount !== undefined) {
      promoCode.minOrderAmount = Number(minOrderAmount);
    }

    if (status !== undefined) {
      promoCode.status = status === true || status === "true";
    }

    await promoCode.save();

    return res.status(200).json({
      success: true,
      message: "Promo code updated successfully.",
      data: promoCode,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// delete a promo code
const deletePromoCode = async (req, res) => {
  try {
    const { id } = req.params;

    const promoCode = await PromoCode.findById(id);
    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: "Promo code not found.",
      });
    }

    await promoCode.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Promo code deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
};
