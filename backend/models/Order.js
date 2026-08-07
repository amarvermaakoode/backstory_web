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
        orderStatus: {
          type: String,
          enum: [
            "Placed",
            "Order Confirmed",
            "Ready to Pack & Ship",
            "Dispatched & In Transit",
            "Out for Delivery",
            "Delivered",
            "Return In Progress",
            "Returned",
            "Cancelled",
            "Processing"
          ],
          default: "Placed",
        },
        paymentStatus: { type: String, default: "Paid" },
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
      enum: [
        "Paid",
        "Confirmed",
        "Pending",
        "Failed",
        "Refund Processing",
        "Refunded",
        "Cancelled (Unpaid)",
        "COD"
      ],
      default: "Paid",
    },
    orderStatus: {
      type: String,
      enum: [
        "Placed",
        "Order Confirmed",
        "Ready to Pack & Ship",
        "Dispatched & In Transit",
        "Out for Delivery",
        "Delivered",
        "Return In Progress",
        "Returned",
        "Cancelled",
        "Processing"
      ],
      default: "Placed",
    },
    cancellation: {
      isCancelled: { type: Boolean, default: false },
      cancelledAt: { type: Date },
      cancellationReason: { type: String, default: "" },
      cancellationFee: { type: Number, default: 0 },
      refundAmount: { type: Number, default: 0 }
    },
    returnExchange: {
      isRequested: { type: Boolean, default: false },
      requestType: { type: String, default: "none" },
      reason: { type: String, default: "" },
      additionalNotes: { type: String, default: "" },
      requestedSize: { type: String, default: "" },
      requestedColor: { type: String, default: "" },
      proofPhotos: [{ type: String }],
      unboxingVideo: { type: String, default: "" },
      reportedWithin48Hours: { type: Boolean, default: false },
      requestedAt: { type: Date },
      status: {
        type: String,
        enum: [
          "None",
          "Return Requested",
          "Return Approved",
          "Product Received",
          "Refund Initiated",
          "Refunded",
          "Rejected",
          "Pending Verification",
          "Exchange Requested",
          "Exchange Approved"
        ],
        default: "None"
      }
    },
    refundDetails: {
      refundMethod: {
        type: String,
        default: "None"
      },
      bankHolderName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      upiId: { type: String, default: "" },
      refundStatus: {
        type: String,
        enum: [
          "None",
          "Paid",
          "Refund Processing",
          "Refunded",
          "Processed / Credited",
          "Initiated / Refund Pending",
          "Return Pending Approval",
          "Not Applicable"
        ],
        default: "None"
      },
      refundAmount: { type: Number, default: 0 },
      refundId: { type: String, default: "" },
      razorpayRefundId: { type: String, default: "" },
      initiatedAt: { type: Date },
      updatedAt: { type: Date },
      estimatedCreditWindow: { type: String, default: "5-7 Business Days" }
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
