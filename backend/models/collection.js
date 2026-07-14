const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema(
  {
    Name: {
      type: String,
      required: [true, "Collection name is required"],
      trim: true,
      unique: true,
      maxlength: [100, "Collection name cannot exceed 100 characters"],
    },

    image: {
      type: String,
      required: [true, "Collection image is required"],
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

module.exports = mongoose.model("Collection", collectionSchema);