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
    darkColor: {
      type: String,
      default: "#000000",
      trim: true,
    },
    lightColor: {
      type: String,
      default: "#FFFFFF",
      trim: true,
    },
    profileData: {
      title: { type: String, default: "" },
      storyType: { type: String, default: "" },
      signature: { type: String, default: "" },
      customText: { type: String, default: "" },
      bio: { type: String, default: "" },
      avatarUrl: { type: String, default: "" },
      coverUrl: { type: String, default: "" },
      themeColor: { type: String, default: "#000000" },
      askMeAbout: { type: String, default: "" },
      rightNow: {
        building: { type: String, default: "" },
        learning: { type: String, default: "" },
        obsessedWith: { type: String, default: "" },
        chasing: { type: String, default: "" },
        dreamingAbout: { type: String, default: "" },
      },
      storyPrompts: {
        whoAmI: { type: String, default: "" },
        unexpectedPart: { type: String, default: "" },
        nextChapter: { type: String, default: "" },
      },
      socialLinks: { type: mongoose.Schema.Types.Mixed, default: {} },
      isPublic: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("QRCode", qrCodeSchema);
