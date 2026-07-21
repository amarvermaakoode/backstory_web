const mongoose = require("mongoose");

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Promo code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [50, "Promo code cannot exceed 50 characters"],
    },
    discountType: {
      type: String,
      required: [true, "Discount type is required"],
      enum: {
        values: ["percentage", "flat"],
        message: "Discount type must be either percentage or flat",
      },
      default: "percentage",
    },
    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value cannot be negative"],
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: [0, "Minimum order amount cannot be negative"],
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PromoCode", promoCodeSchema);
