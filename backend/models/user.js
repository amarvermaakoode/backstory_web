const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    gender: {
      type: String,
      default: "",
    },
    dateOfBirth: {
      type: String,
      default: "",
    },
    isDeactivated: {
      type: Boolean,
      default: false,
    },
    addresses: [
      {
        name: { type: String, required: true },
        recipientName: { type: String, default: "" },
        addressLine1: { type: String, required: true },
        addressLine2: { type: String, default: "" },
        cityStatePin: { type: String, default: "" },
        phone: { type: String, default: "" },
        country: { type: String, default: "India" },
        isDefault: { type: Boolean, default: false },
      },
    ],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      }
    ],
    cart: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        size: {
          type: String,
          required: true,
        },
        color: {
          name: { type: String, required: true },
          hex: { type: String, required: true },
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        }
      }
    ],
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    walletTransactions: [
      {
        type: {
          type: String,
          enum: ["credit", "debit"],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        description: {
          type: String,
          default: "",
        },
        orderId: {
          type: String,
          default: "",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
