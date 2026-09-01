const mongoose = require("mongoose");

const shippingSettingSchema = new mongoose.Schema(
  {
    standard: {
      rate: {
        type: Number,
        default: 0,
        min: 0,
      },
      deliveryDays: {
        type: String,
        default: "3–5 business days",
        trim: true,
      },
      freeThreshold: {
        type: Number,
        default: 999,
        min: 0,
      },
    },
    express: {
      rate: {
        type: Number,
        default: 150,
        min: 0,
      },
      deliveryDays: {
        type: String,
        default: "1–2 business days",
        trim: true,
      },
    },
    international: {
      rate: {
        type: Number,
        default: 638,
        min: 0,
      },
      deliveryDays: {
        type: String,
        default: "7–14 business days",
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.ShippingSetting ||
  mongoose.model("ShippingSetting", shippingSettingSchema);
