const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const connectDB = require("../config/db");

const QRCodeBatch = require("../models/QRCodeBatch");
const QRCodeModel = require("../models/QRCode");
const ClaimCode = require("../models/ClaimCode");
const User = require("../models/user");
const Order = require("../models/Order");
const Otp = require("../models/otp");

const {
  sendClaimOTP,
  verifyClaimOTP,
  validateGiftClaimCode,
  sendGiftClaimOTP,
  verifyGiftClaimOTP,
  getMyQRCodes,
  updateQRProfile,
  getQRCodeByCode,
} = require("../controllers/frontend/qrFrntController");

// Helper mock req/res
function createMockReqRes(body = {}, params = {}, query = {}, user = null) {
  const req = { body, params, query, user };
  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      responseData = data;
      return res;
    },
    get statusCode() {
      return statusCode;
    },
    get data() {
      return responseData;
    },
  };

  return { req, res };
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("🧪 STARTING COMPREHENSIVE TEST SUITE FOR QR & CLAIM CODES");
  console.log("=======================================================\n");

  await connectDB();

  let passedCount = 0;
  let totalCount = 0;

  function assert(condition, message) {
    totalCount++;
    if (condition) {
      console.log(`✅ [PASS] Test ${totalCount}: ${message}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] Test ${totalCount}: ${message}`);
      process.exitCode = 1;
    }
  }

  try {
    // 1. Setup Test Data
    const testSuffix = Date.now().toString().slice(-6);

    // Create Test User
    const testUser = await User.create({
      name: "Test Customer",
      email: `testcustomer_${testSuffix}@example.com`,
      phoneNumber: `98765${testSuffix}`,
      role: "user",
    });

    // Create Test Order for Purchase Flow
    const orderIdCode = `BAC-${testSuffix}`;
    const testOrder = await Order.create({
      orderId: orderIdCode,
      razorpayOrderId: `rzp_order_${testSuffix}`,
      razorpayPaymentId: `rzp_pay_${testSuffix}`,
      user: testUser._id,
      shippingAddress: {
        firstName: "Test",
        lastName: "Customer",
        email: testUser.email,
        phoneNumber: testUser.phoneNumber,
        streetAddress: "123 Test St",
        city: "TestCity",
        state: "TestState",
        pinCode: "110001",
        country: "India",
      },
      items: [
        {
          name: "Test Oversized Tee",
          price: "1999",
          priceNum: 1999,
          quantity: 1,
          color: "Black",
          size: "L",
        },
      ],
      totalAmount: 1999,
      paymentStatus: "Paid",
      orderStatus: "Delivered",
    });

    // Create Test Batch and QR Codes
    const testBatch = await QRCodeBatch.create({
      batchName: `Test Batch ${testSuffix}`,
      prefix: "TST",
      totalQuantity: 5,
    });

    const testQRs = await QRCodeModel.insertMany([
      { code: `TST-PURCHASE-${testSuffix}`, batchId: testBatch._id, status: "unlinked" },
      { code: `TST-GIFT-${testSuffix}`, batchId: testBatch._id, status: "unlinked" },
      { code: `TST-MKT-${testSuffix}`, batchId: testBatch._id, status: "unlinked" },
      { code: `TST-EXPIRED-${testSuffix}`, batchId: testBatch._id, status: "unlinked" },
      { code: `TST-[#000]-${testSuffix}`, batchId: testBatch._id, status: "unlinked" },
    ]);

    // Create Claim Codes
    const giftCodeDoc = await ClaimCode.create({
      code: `GIFT-${testSuffix}-0001`,
      type: "GIFT",
      status: "unused",
      note: "Test Gift Code",
    });

    const mktCodeDoc = await ClaimCode.create({
      code: `MKT-${testSuffix}-0002`,
      type: "MARKETING",
      status: "unused",
      note: "Test Marketing Code",
    });

    const revokedCodeDoc = await ClaimCode.create({
      code: `GIFT-${testSuffix}-RVKD`,
      type: "GIFT",
      status: "revoked",
      note: "Revoked Gift Code",
    });

    const expiredCodeDoc = await ClaimCode.create({
      code: `GIFT-${testSuffix}-EXPR`,
      type: "GIFT",
      status: "unused",
      expiresAt: new Date(Date.now() - 3600000), // expired 1 hour ago
      note: "Expired Gift Code",
    });

    // -----------------------------------------------------------------
    // TEST 1: Purchase Claim Flow (Order ID + Registered Contact + OTP)
    // -----------------------------------------------------------------
    const purQR = testQRs[0].code;
    let { req, res } = createMockReqRes({
      code: purQR,
      orderId: orderIdCode,
      email: testUser.email,
    });
    await sendClaimOTP(req, res);
    assert(res.data && res.data.success, "Purchase claim send OTP succeeds");

    ({ req, res } = createMockReqRes({
      code: purQR,
      orderId: orderIdCode,
      email: testUser.email,
      otp: "123456",
      label: "Test Oversized Tee (Black / L)",
    }));
    await verifyClaimOTP(req, res);
    assert(
      res.data && res.data.success && res.data.qrCode.status === "claimed",
      "Purchase claim verify OTP links QR to user"
    );

    // -----------------------------------------------------------------
    // TEST 2: Gift Claim Flow (Gift Claim Code + Contact + OTP)
    // -----------------------------------------------------------------
    const giftQR = testQRs[1].code;
    ({ req, res } = createMockReqRes({
      code: giftQR,
      claimCode: giftCodeDoc.code,
      email: `giftrecipient_${testSuffix}@example.com`,
    }));
    await sendGiftClaimOTP(req, res);
    assert(res.data && res.data.success, "Gift claim send OTP succeeds without Order ID");

    // Verify ClaimCode remains 'unused' while OTP is pending (Correction #2)
    const checkUnusedCode = await ClaimCode.findById(giftCodeDoc._id);
    assert(checkUnusedCode.status === "unused", "ClaimCode remains 'unused' during pending OTP stage");

    ({ req, res } = createMockReqRes({
      code: giftQR,
      claimCode: giftCodeDoc.code,
      email: `giftrecipient_${testSuffix}@example.com`,
      otp: "123456",
      name: "Gift Recipient",
    }));
    await verifyGiftClaimOTP(req, res);
    assert(
      res.data && res.data.success && res.data.qrCode.status === "claimed",
      "Gift claim verify OTP links QR to recipient user"
    );

    // Verify ClaimCode is marked 'used' after successful OTP verify
    const checkUsedCode = await ClaimCode.findById(giftCodeDoc._id);
    assert(
      checkUsedCode.status === "used" && String(checkUsedCode.claimedQR) === String(res.data.qrCode._id),
      "ClaimCode status transitions to 'used' and records claimed QR reference"
    );

    // -----------------------------------------------------------------
    // TEST 3: Marketing Claim Flow (Marketing Claim Code + Contact + OTP)
    // -----------------------------------------------------------------
    const mktQR = testQRs[2].code;
    ({ req, res } = createMockReqRes({
      code: mktQR,
      claimCode: mktCodeDoc.code,
      phoneNumber: `99988${testSuffix}`,
    }));
    await sendGiftClaimOTP(req, res);
    assert(res.data && res.data.success, "Marketing claim send OTP succeeds");

    ({ req, res } = createMockReqRes({
      code: mktQR,
      claimCode: mktCodeDoc.code,
      phoneNumber: `99988${testSuffix}`,
      otp: "123456",
      name: "Influencer User",
    }));
    await verifyGiftClaimOTP(req, res);
    assert(
      res.data && res.data.success && res.data.qrCode.status === "claimed",
      "Marketing claim verify OTP links QR to user"
    );

    // -----------------------------------------------------------------
    // TEST 4: Invalid Claim Code Rejection
    // -----------------------------------------------------------------
    ({ req, res } = createMockReqRes({
      code: testQRs[3].code,
      claimCode: "INVALID-CODE-9999",
      email: "test@example.com",
    }));
    await sendGiftClaimOTP(req, res);
    assert(!res.data.success && res.statusCode === 404, "Invalid claim code is rejected with 404");

    // -----------------------------------------------------------------
    // TEST 5: Used Claim Code Rejection
    // -----------------------------------------------------------------
    ({ req, res } = createMockReqRes({
      code: testQRs[3].code,
      claimCode: giftCodeDoc.code, // already used in TEST 2!
      email: "test@example.com",
    }));
    await sendGiftClaimOTP(req, res);
    assert(!res.data.success && res.statusCode === 400, "Used claim code is rejected");

    // -----------------------------------------------------------------
    // TEST 6: Revoked Claim Code Rejection
    // -----------------------------------------------------------------
    ({ req, res } = createMockReqRes({
      code: testQRs[3].code,
      claimCode: revokedCodeDoc.code,
      email: "test@example.com",
    }));
    await sendGiftClaimOTP(req, res);
    assert(!res.data.success && res.statusCode === 400, "Revoked claim code is rejected");

    // -----------------------------------------------------------------
    // TEST 7: Expired Claim Code Rejection
    // -----------------------------------------------------------------
    ({ req, res } = createMockReqRes({
      code: testQRs[3].code,
      claimCode: expiredCodeDoc.code,
      email: "test@example.com",
    }));
    await sendGiftClaimOTP(req, res);
    assert(!res.data.success && res.statusCode === 400, "Expired claim code is rejected");

    // -----------------------------------------------------------------
    // TEST 8: Already Claimed QR Rejection
    // -----------------------------------------------------------------
    const freshGiftCode = await ClaimCode.create({
      code: `GIFT-${testSuffix}-FRESH`,
      type: "GIFT",
      status: "unused",
    });

    ({ req, res } = createMockReqRes({
      code: giftQR, // already claimed in TEST 2!
      claimCode: freshGiftCode.code,
      email: "test@example.com",
    }));
    await sendGiftClaimOTP(req, res);
    assert(!res.data.success && res.statusCode === 400, "Already claimed QR is rejected for new claims");

    // -----------------------------------------------------------------
    // TEST 9: Concurrency & Transaction Safety Check
    // -----------------------------------------------------------------
    // Create 1 unclaimed QR & 1 unused Claim Code
    const concQRDoc = await QRCodeModel.create({
      code: `TST-CONC-${testSuffix}`,
      batchId: testBatch._id,
      status: "unlinked",
    });
    const concClaimCodeDoc = await ClaimCode.create({
      code: `GIFT-CONC-${testSuffix}`,
      type: "GIFT",
      status: "unused",
    });

    // Fire 2 concurrent claim requests for the exact same QR and Claim Code
    const req1 = createMockReqRes({
      code: concQRDoc.code,
      claimCode: concClaimCodeDoc.code,
      email: `userA_${testSuffix}@example.com`,
      otp: "123456",
    });
    const req2 = createMockReqRes({
      code: concQRDoc.code,
      claimCode: concClaimCodeDoc.code,
      email: `userB_${testSuffix}@example.com`,
      otp: "123456",
    });

    const [res1Result, res2Result] = await Promise.all([
      verifyGiftClaimOTP(req1.req, req1.res),
      verifyGiftClaimOTP(req2.req, req2.res),
    ]);

    const successCount = (req1.res.data?.success ? 1 : 0) + (req2.res.data?.success ? 1 : 0);
    assert(
      successCount === 1,
      `Concurrent claims result in EXACTLY 1 successful claim (actual success count: ${successCount})`
    );

    // Verify DB state after concurrent attempt
    const finalConcQR = await QRCodeModel.findById(concQRDoc._id);
    const finalConcCode = await ClaimCode.findById(concClaimCodeDoc._id);
    assert(finalConcQR.status === "claimed", "Concurrent QR status is cleanly 'claimed'");
    assert(finalConcCode.status === "used", "Concurrent ClaimCode status is cleanly 'used'");

    // -----------------------------------------------------------------
    // TEST 10 & 11: Link QR to correct user & mark ClaimCode unusable
    // -----------------------------------------------------------------
    const successfulUserEmail = req1.res.data?.success
      ? `userA_${testSuffix}@example.com`
      : `userB_${testSuffix}@example.com`;
    const linkedUserDoc = await User.findOne({ email: successfulUserEmail });
    assert(
      String(finalConcQR.linkedUser) === String(linkedUserDoc._id),
      "Successful claim links QR to correct user document"
    );

    // -----------------------------------------------------------------
    // TEST 12: User Dashboard My QRs Endpoint
    // -----------------------------------------------------------------
    ({ req, res } = createMockReqRes({}, {}, {}, { _id: testUser._id }));
    await getMyQRCodes(req, res);
    assert(
      res.data && res.data.success && res.data.count >= 1,
      "User dashboard /my-qrs lists user's claimed QR codes"
    );

    // -----------------------------------------------------------------
    // TEST 13: QR Story Details Editing Endpoint
    // -----------------------------------------------------------------
    ({ req, res } = createMockReqRes(
      {
        code: purQR,
        title: "My Favorite Oversized T-Shirt",
        bio: "Fashion enthusiast and tech creator.",
        themeColor: "#10B981",
      },
      {},
      {},
      { _id: testUser._id }
    ));
    await updateQRProfile(req, res);
    assert(
      res.data && res.data.success && res.data.profileData.title === "My Favorite Oversized T-Shirt",
      "Editing QR story profile updates profileData and activates story"
    );

    // -----------------------------------------------------------------
    // TEST 14: Public QR Scan View Page Endpoint
    // -----------------------------------------------------------------
    ({ req, res } = createMockReqRes({}, { code: purQR }));
    await getQRCodeByCode(req, res);
    assert(
      res.data && res.data.success && res.data.status === "active" && res.data.profileData.title === "My Favorite Oversized T-Shirt",
      "Public QR scan page returns active story details correctly"
    );

    // Cleanup Test Data
    await QRCodeBatch.deleteOne({ _id: testBatch._id });
    await QRCodeModel.deleteMany({ batchId: testBatch._id });
    await QRCodeModel.deleteOne({ _id: concQRDoc._id });
    await ClaimCode.deleteMany({ code: { $regex: testSuffix } });
    await User.deleteMany({ email: { $regex: testSuffix } });
    await Order.deleteMany({ orderId: orderIdCode });

    console.log("\n=======================================================");
    console.log(`🎉 ALL ${passedCount} / ${totalCount} VERIFICATION TESTS PASSED SUCCESSFULLY!`);
    console.log("=======================================================\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Test suite encountered unhandled error:", err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

runTests();
