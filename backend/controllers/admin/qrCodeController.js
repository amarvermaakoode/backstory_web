const QRCodeBatch = require("../../models/QRCodeBatch");
const QRCodeModel = require("../../models/QRCode");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const SVGtoPDF = require("svg-to-pdfkit");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Helper to generate unique QR code string
const generateUniqueCodeString = (prefix = "BAC") => {
  const cleanPrefix = (prefix || "BAC").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const part1 = crypto.randomBytes(3).toString("hex").toUpperCase();
  const part2 = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${cleanPrefix}-${part1}-${part2}`;
};

// generate a batch of qr codes
exports.generateBatch = async (req, res) => {
  try {
    const { batchName, quantity, prefix = "BAC" } = req.body;

    if (!batchName || !batchName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Batch name is required",
      });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1 || qty > 1000) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be between 1 and 1000",
      });
    }

    // Create batch entry
    const batch = await QRCodeBatch.create({
      batchName: batchName.trim(),
      prefix: prefix.trim().toUpperCase() || "BAC",
      totalQuantity: qty,
      createdBy: req.user ? req.user._id : null,
    });

    // Generate unique QR codes
    const qrDocs = [];
    const createdCodesSet = new Set();

    for (let i = 0; i < qty; i++) {
      let code = generateUniqueCodeString(batch.prefix);
      let attempts = 0;
      // Ensure uniqueness within batch and DB
      while ((createdCodesSet.has(code) || (await QRCodeModel.exists({ code }))) && attempts < 10) {
        code = generateUniqueCodeString(batch.prefix);
        attempts++;
      }

      createdCodesSet.add(code);
      qrDocs.push({
        code,
        batchId: batch._id,
        status: "unlinked",
      });
    }

    await QRCodeModel.insertMany(qrDocs);

    return res.status(201).json({
      success: true,
      message: `Successfully generated batch '${batch.batchName}' with ${qty} QR codes.`,
      batch,
    });
  } catch (error) {
    console.error("Error generating QR batch:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate QR batch",
      error: error.message,
    });
  }
};

// get all qr codes
exports.getAllBatches = async (req, res) => {
  try {
    const batches = await QRCodeBatch.find()
      .sort({ createdAt: -1 })
      .lean();

    // Get aggregated statistics for each batch
    const batchIds = batches.map((b) => b._id);
    const counts = await QRCodeModel.aggregate([
      { $match: { batchId: { $in: batchIds } } },
      {
        $group: {
          _id: "$batchId",
          total: { $sum: 1 },
          linkedCount: {
            $sum: { $cond: [{ $ne: ["$status", "unlinked"] }, 1, 0] },
          },
          unlinkedCount: {
            $sum: { $cond: [{ $eq: ["$status", "unlinked"] }, 1, 0] },
          },
        },
      },
    ]);

    const countMap = {};
    counts.forEach((c) => {
      countMap[c._id.toString()] = c;
    });

    const enrichedBatches = batches.map((batch) => {
      const stats = countMap[batch._id.toString()] || {
        total: batch.totalQuantity,
        linkedCount: 0,
        unlinkedCount: batch.totalQuantity,
      };
      return {
        ...batch,
        totalQuantity: stats.total || batch.totalQuantity,
        linkedCount: stats.linkedCount || 0,
        unlinkedCount: stats.unlinkedCount || batch.totalQuantity,
      };
    });

    return res.status(200).json({
      success: true,
      batches: enrichedBatches,
    });
  } catch (error) {
    console.error("Error fetching QR batches:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch QR batches",
      error: error.message,
    });
  }
};

// get single qr code
exports.getBatchById = async (req, res) => {
  try {
    const { batchId } = req.params;
    const batch = await QRCodeBatch.findById(batchId).lean();

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    const qrCodes = await QRCodeModel.find({ batchId })
      .populate("linkedUser", "name email")
      .sort({ createdAt: 1 })
      .lean();

    const linkedCount = qrCodes.filter((q) => q.status !== "unlinked").length;

    return res.status(200).json({
      success: true,
      batch: {
        ...batch,
        linkedCount,
        unlinkedCount: qrCodes.length - linkedCount,
      },
      qrCodes,
    });
  } catch (error) {
    console.error("Error fetching batch details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch batch details",
      error: error.message,
    });
  }
};

// delete a qr code
exports.downloadBatchPDF = async (req, res) => {
  try {
    const { batchId } = req.params;
    const batch = await QRCodeBatch.findById(batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    const qrCodes = await QRCodeModel.find({ batchId }).sort({ createdAt: 1 }).lean();

    if (!qrCodes.length) {
      return res.status(400).json({
        success: false,
        message: "No QR codes found in this batch",
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    // Set Response Headers for PDF Download
    const fileName = `${batch.batchName.replace(/[^a-zA-Z0-9_-]/g, "_")}_QRCodes.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    // Create PDF Document (A4 size: 595.28 x 841.89 points)
    const doc = new PDFDocument({
      size: "A4",
      margin: 30,
      autoFirstPage: true,
    });

    doc.pipe(res);

    // Layout configuration: 3 columns, 4 rows per page = 12 QRs per page
    const cols = 3;
    const rows = 4;
    const itemsPerPage = cols * rows;

    const marginX = 30;
    const marginY = 30;
    const pageWidth = 595.28 - marginX * 2; // 535.28
    const pageHeight = 841.89 - marginY * 2; // 781.89

    const cellWidth = pageWidth / cols; // ~178.4
    const cellHeight = pageHeight / rows; // ~195.4

    for (let i = 0; i < qrCodes.length; i++) {
      const qrItem = qrCodes[i];
      const pageIndex = Math.floor(i / itemsPerPage);
      const indexInPage = i % itemsPerPage;

      if (i > 0 && indexInPage === 0) {
        doc.addPage();
      }

      const col = indexInPage % cols;
      const row = Math.floor(indexInPage / cols);

      const x = marginX + col * cellWidth;
      const y = marginY + row * cellHeight;

      // Draw dashed card border for easy cut guide
      doc
        .save()
        .rect(x + 4, y + 4, cellWidth - 8, cellHeight - 8)
        .dash(3, { space: 3 })
        .strokeColor("#d1d5db")
        .lineWidth(0.6)
        .stroke()
        .restore();

      // Target scan URL
      const scanUrl = `${frontendUrl}/qr/${qrItem.code}`;

      // Generate QR Code Buffer with Error Correction Level M (15%) for clean, spacious Version 2 (25x25) matrix grid
      const qrBuffer = await QRCode.toBuffer(scanUrl, {
        errorCorrectionLevel: "M",
        type: "png",
        margin: 4,
        width: 350,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // Embed QR image perfectly centered in cell
      const qrSize = 110;
      const qrX = x + (cellWidth - qrSize) / 2;
      const qrY = y + (cellHeight - qrSize) / 2;

      doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

      // Embed centered BACSTORY logo overlay (~14% of QR size)
      const logoSize = qrSize * 0.14;
      const bgSize = logoSize + 3;
      const centerX = qrX + qrSize / 2;
      const centerY = qrY + qrSize / 2;

      const bgX = centerX - bgSize / 2;
      const bgY = centerY - bgSize / 2;
      const logoX = centerX - logoSize / 2;
      const logoY = centerY - logoSize / 2;

      // Draw white protective background square with rounded corners
      doc
        .save()
        .roundedRect(bgX, bgY, bgSize, bgSize, 2.5)
        .fill("#FFFFFF")
        .restore();

      // Render BACSTORY logo SVG in exact mathematical center
      const svgPath = path.join(__dirname, "../../../frontend/public/images/light-theme-icon.svg");
      if (fs.existsSync(svgPath)) {
        try {
          const svgString = fs.readFileSync(svgPath, "utf8");
          SVGtoPDF(doc, svgString, logoX, logoY, {
            width: logoSize,
            height: logoSize,
            preserveAspectRatio: "xMidYMid meet",
          });
        } catch (e) {
          console.error("Error drawing SVG logo on PDF:", e);
        }
      }
    }

    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate PDF document",
        error: error.message,
      });
    }
  }
};

// get all qr codes
exports.getAllQRCodes = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status && ["unlinked", "claimed", "active"].includes(status)) {
      query.status = status;
    }
    if (search && search.trim()) {
      query.$or = [
        { code: { $regex: search.trim(), $options: "i" } },
        { orderId: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;

    const total = await QRCodeModel.countDocuments(query);
    const qrCodes = await QRCodeModel.find(query)
      .populate("batchId", "batchName prefix")
      .populate("linkedUser", "name email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      qrCodes,
    });
  } catch (error) {
    console.error("Error fetching all QR codes:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch QR codes",
      error: error.message,
    });
  }
};

// delete batch of qr codes
exports.deleteBatch = async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await QRCodeBatch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    // Delete unlinked QR codes associated with this batch
    await QRCodeModel.deleteMany({ batchId, status: "unlinked" });

    // Check if any claimed/active QR codes remain
    const remainingCount = await QRCodeModel.countDocuments({ batchId });

    if (remainingCount === 0) {
      await QRCodeBatch.findByIdAndDelete(batchId);
      return res.status(200).json({
        success: true,
        message: "Batch and all unlinked QR codes deleted successfully.",
      });
    } else {
      batch.totalQuantity = remainingCount;
      await batch.save();
      return res.status(200).json({
        success: true,
        message: `Deleted unlinked QR codes. ${remainingCount} linked/claimed QR codes were preserved.`,
      });
    }
  } catch (error) {
    console.error("Error deleting batch:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete batch",
      error: error.message,
    });
  }
};
