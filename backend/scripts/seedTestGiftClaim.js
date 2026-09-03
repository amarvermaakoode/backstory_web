const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const connectDB = require("../config/db");

const QRCodeBatch = require("../models/QRCodeBatch");
const QRCodeModel = require("../models/QRCode");
const ClaimCode = require("../models/ClaimCode");

async function seed() {
  await connectDB();

  // Create or update Demo Batch
  let batch = await QRCodeBatch.findOne({ batchName: "Demo Gift Batch" });
  if (!batch) {
    batch = await QRCodeBatch.create({
      batchName: "Demo Gift Batch",
      prefix: "DEMO",
      totalQuantity: 1,
    });
  }

  // Create Demo Unclaimed QR
  const demoQR = "DEMO-GIFT-001";
  await QRCodeModel.deleteOne({ code: demoQR });
  await QRCodeModel.create({
    code: demoQR,
    batchId: batch._id,
    status: "unlinked",
  });

  // Create Demo Gift Claim Code
  const demoGiftCode = "GIFT-TEST-2026";
  await ClaimCode.deleteOne({ code: demoGiftCode });
  await ClaimCode.create({
    code: demoGiftCode,
    type: "GIFT",
    status: "unused",
    note: "Demo Gift Code for manual testing",
  });

  console.log("\n=======================================================");
  console.log("🎁 DEMO GIFT CLAIM SEED DATA CREATED!");
  console.log("=======================================================");
  console.log(`📌 Unclaimed QR Code : ${demoQR}`);
  console.log(`🔗 Target Scan URL   : http://localhost:3000/qr/${demoQR}`);
  console.log(`🔑 Gift Claim Code   : ${demoGiftCode}`);
  console.log(`🔑 Test OTP Code     : 123456 (or check server console)`);
  console.log("=======================================================\n");

  await mongoose.connection.close();
  process.exit(0);
}

seed();
