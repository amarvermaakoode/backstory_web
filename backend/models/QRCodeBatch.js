const mongoose = require("mongoose");

const qrCodeBatchSchema = new mongoose.Schema(
  {
    batchName: {
      type: String,
      required: [true, "Batch name is required"],
      trim: true,
    },
    prefix: {
      type: String,
      default: "BAC",
      trim: true,
      uppercase: true,
    },
    totalQuantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    linkedCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("QRCodeBatch", qrCodeBatchSchema);
