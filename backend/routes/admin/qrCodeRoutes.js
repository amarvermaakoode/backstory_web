const express = require("express");
const router = express.Router();
const {
  generateBatch,
  getAllBatches,
  getBatchById,
  downloadBatchPDF,
  getAllQRCodes,
  deleteBatch,
} = require("../../controllers/admin/qrCodeController");
const { protect, adminOnly } = require("../../middlewares/auth");

// Batch routes
router.post("/generate", protect, adminOnly, generateBatch);
router.get("/batches", protect, adminOnly, getAllBatches);
router.get("/batches/:batchId", protect, adminOnly, getBatchById);
router.get("/batches/:batchId/pdf", protect, adminOnly, downloadBatchPDF);
router.delete("/batches/:batchId", protect, adminOnly, deleteBatch);

// Individual QR code list
router.get("/", protect, adminOnly, getAllQRCodes);

module.exports = router;
