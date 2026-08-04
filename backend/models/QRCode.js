const mongoose = require("mongoose");

const qrCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QRCodeBatch",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["unlinked", "claimed", "active"],
      default: "unlinked",
      index: true,
    },
    orderId: {
      type: String,
      trim: true,
      default: null,
    },
    linkedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    linkedAt: {
      type: Date,
      default: null,
    },
    profileData: {
      title: { type: String, default: "" },
      bio: { type: String, default: "" },
      socialLinks: {
        instagram: { type: String, default: "" },
        twitter: { type: String, default: "" },
        spotify: { type: String, default: "" },
        customUrl: { type: String, default: "" },
      },
      avatarUrl: { type: String, default: "" },
      coverUrl: { type: String, default: "" },
      themeColor: { type: String, default: "#000000" },
      customText: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("QRCode", qrCodeSchema);
