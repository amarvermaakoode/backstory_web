const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
    },
    razorpayPaymentId: {
      type: String,
      required: true,
    },
    razorpaySignature: {
      type: String,
      default: "",
    },
    shippingAddress: {
      firstName: { type: String, default: "" },
      lastName: { type: String, default: "" },
      email: { type: String, default: "" },
      phoneNumber: { type: String, default: "" },
      streetAddress: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pinCode: { type: String, default: "" },
      country: { type: String, default: "India" },
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: false,
        },
        name: { type: String, required: true },
        category: { type: String, default: "COLLECTION" },
        size: { type: String, default: "M" },
        color: { type: String, default: "Standard" },
        colorHex: { type: String, default: "#000000" },
        price: { type: String, required: true },
        priceNum: { type: Number, required: true },
        quantity: { type: Number, required: true, default: 1 },
        image: { type: String, default: "" },
        orderStatus: { type: String, default: "Processing" },
        paymentStatus: { type: String, default: "Confirmed" },
        deliveryDate: { type: String, default: "Estimated Delivery: 3-5 Business Days" },
      },
    ],
    subtotal: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Confirmed", "Failed"],
      default: "Confirmed",
    },
    orderStatus: {
      type: String,
      enum: ["Processing", "Dispatched", "In Transit", "Out for Delivery", "Delivered", "Cancelled", "Returned"],
      default: "Processing",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
