const mongoose = require("mongoose");

const sizeGuideSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Size guide name is required"],
      trim: true,
      unique: true,
      maxlength: [100, "Size guide name cannot exceed 100 characters"],
    },
    chart: [
      {
        size: {
          type: String,
          required: [true, "Size label is required (e.g. S, M, L)"],
          trim: true,
        },
        chest: {
          type: String,
          trim: true,
        },
        length: {
          type: String,
          trim: true,
        },
        shoulder: {
          type: String,
          trim: true,
        },
      },
    ],
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SizeGuide", sizeGuideSchema);
