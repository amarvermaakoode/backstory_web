const mongoose = require("mongoose");

const claimCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["GIFT", "MARKETING"],
      default: "GIFT",
      required: true,
    },
    status: {
      type: String,
      enum: ["unused", "used", "revoked", "expired"],
      default: "unused",
      index: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    claimedQR: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QRCode",
      default: null,
    },
    claimedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Helper method to check if code is currently active & valid
claimCodeSchema.methods.isValid = function () {
  if (this.status !== "unused") return false;
  if (this.expiresAt && new Date() > new Date(this.expiresAt)) return false;
  return true;
};

module.exports = mongoose.model("ClaimCode", claimCodeSchema);
