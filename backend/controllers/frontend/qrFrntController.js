const mongoose = require("mongoose");
const QRCodeModel = require("../../models/QRCode");
const ClaimCode = require("../../models/ClaimCode");
const User = require("../../models/user");
const Otp = require("../../models/otp");
const Order = require("../../models/Order");
const { generateToken } = require("../../config/jwt");
const { sendOtpEmail } = require("../../services/emailService");

// Helper function to verify if contact (email or phone) matches a registered User account profile
async function checkContactMatchesRegisteredUser(identifier, order) {
  if (!identifier || !order) {
    return { matches: false, message: "Missing Order ID or contact detail." };
  }

  const rawInput = identifier.trim();
  const isEmail = rawInput.includes("@");
  const cleanEmail = isEmail ? rawInput.toLowerCase() : null;
  const cleanPhone = !isEmail ? rawInput.trim() : null;

  // 1. Identify the registered User account associated with this order
  let registeredUser = null;

  if (order.user) {
    if (typeof order.user === "object" && order.user._id) {
      registeredUser = order.user;
    } else {
      registeredUser = await User.findById(order.user);
    }
  }

  // Fallback: If order.user wasn't explicitly populated at creation time, find user in DB matching shipping address
  if (!registeredUser) {
    const shippingEmail = (order.shippingAddress?.email || "").toLowerCase().trim();
    const shippingPhone = (order.shippingAddress?.phoneNumber || "").trim();

    if (shippingEmail) {
      registeredUser = await User.findOne({ email: shippingEmail });
    }
    if (!registeredUser && shippingPhone) {
      registeredUser = await User.findOne({ phoneNumber: shippingPhone });
    }
  }

  // If there is NO registered User account in MongoDB for this order:
  if (!registeredUser) {
    return {
      matches: false,
      message: "No registered BACSTORY user account found for this Order. Please sign up or complete your profile first.",
    };
  }

  // 2. MUST match against the registered User profile (User.email or User.phoneNumber), NOT shipping address!
  if (cleanEmail) {
    const userEmail = (registeredUser.email || "").toLowerCase().trim();
    if (userEmail && cleanEmail === userEmail) {
      return { matches: true, user: registeredUser };
    }
  } else if (cleanPhone) {
    const inputDigits = cleanPhone.replace(/\D/g, "");
    const userPhone = (registeredUser.phoneNumber || "").trim();
    const userPhoneDigits = userPhone.replace(/\D/g, "");

    if (userPhone && (cleanPhone === userPhone || (inputDigits.length >= 7 && userPhoneDigits.endsWith(inputDigits.slice(-10))))) {
      return { matches: true, user: registeredUser };
    }
  }

  return {
    matches: false,
    message: "The provided Email or Mobile Number does not match your registered user profile for this Order.",
  };
}

// get qr details by code
exports.getQRCodeByCode = async (req, res) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "QR code parameter is required",
      });
    }

    const qrDoc = await QRCodeModel.findOne({
      code: { $regex: new RegExp(`^${code.trim()}$`, "i") },
    })
      .populate("linkedUser", "name email phoneNumber")
      .lean();

    if (!qrDoc) {
      return res.status(404).json({
        success: false,
        message: "QR code not found",
      });
    }

    // Unlinked status response (Frontend shows simple Order ID + Registered Email / Phone OTP prompt)
    if (qrDoc.status === "unlinked") {
      return res.status(200).json({
        success: true,
        status: "unlinked",
        code: qrDoc.code,
        message: "This QR code is unlinked. Enter your Order ID & registered Email or Phone number to claim it.",
      });
    }

    // Claimed / Active status response (Pure public story view - No forms, no editing)
    return res.status(200).json({
      success: true,
      status: qrDoc.status,
      code: qrDoc.code,
      orderId: qrDoc.orderId,
      linkedUser: {
        _id: qrDoc.linkedUser?._id,
        name: qrDoc.linkedUser?.name || "Anonymous",
      },
      profileData: qrDoc.profileData || {},
      linkedAt: qrDoc.linkedAt,
    });
  } catch (error) {
    console.error("Error fetching QR code by code:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch QR code details",
      error: error.message,
    });
  }
};

// send OTP to claim QR code
exports.sendClaimOTP = async (req, res) => {
  try {
    const { code, orderId, email, phoneNumber, identifier } = req.body;

    const contactInput = (identifier || email || phoneNumber || "").trim();

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "QR code is required",
      });
    }

    if (!orderId || !orderId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    if (!contactInput) {
      return res.status(400).json({
        success: false,
        message: "Registered Email Address or Mobile Number is required",
      });
    }

    // Check QR existence & status
    const qrDoc = await QRCodeModel.findOne({
      code: { $regex: new RegExp(`^${code.trim()}$`, "i") },
    });

    if (!qrDoc) {
      return res.status(404).json({
        success: false,
        message: "QR code not found",
      });
    }

    if (qrDoc.status !== "unlinked") {
      return res.status(400).json({
        success: false,
        message: "This QR code has already been claimed and linked.",
      });
    }

    // Find Order in DB
    const trimmedOrderId = orderId.trim();
    const isMongoId = trimmedOrderId.length === 24 && /^[0-9a-fA-F]{24}$/.test(trimmedOrderId);
    const escapedOrderId = trimmedOrderId.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

    const orderDoc = await Order.findOne({
      $or: [
        { orderId: { $regex: new RegExp(`^${escapedOrderId}$`, "i") } },
        { razorpayOrderId: { $regex: new RegExp(`^${escapedOrderId}$`, "i") } },
        { _id: isMongoId ? trimmedOrderId : null },
      ],
    }).populate("user");

    if (!orderDoc) {
      return res.status(400).json({
        success: false,
        message: `Order ID '${trimmedOrderId}' was not found. Please verify your Order ID.`,
      });
    }

    // Verify contact input matches registered user profile (User.email or User.phoneNumber)
    const matchResult = await checkContactMatchesRegisteredUser(contactInput, orderDoc);
    if (!matchResult.matches) {
      return res.status(400).json({
        success: false,
        message: matchResult.message || "The provided Email or Mobile Number does not match your registered user profile.",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const isEmail = contactInput.includes("@");
    const cleanEmail = isEmail ? contactInput.toLowerCase() : null;
    const cleanPhone = !isEmail ? contactInput : null;

    if (cleanEmail) {
      await Otp.deleteMany({ email: cleanEmail });
      await Otp.create({ email: cleanEmail, otp });
      // Send real email OTP via SendGrid
      await sendOtpEmail({ to: cleanEmail, otp, type: "claim" });
    } else {
      await Otp.deleteMany({ phoneNumber: cleanPhone });
      await Otp.create({ phoneNumber: cleanPhone, otp });
    }

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${contactInput}.`,
      mockOtp: process.env.NODE_ENV === "production" ? undefined : otp,
    });
  } catch (error) {
    console.error("Error sending claim OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
};

// verify otp and claim qr code
exports.verifyClaimOTP = async (req, res) => {
  try {
    const { code, orderId, email, phoneNumber, identifier, otp, name } = req.body;

    const contactInput = (identifier || email || phoneNumber || "").trim();

    if (!code || !orderId || !contactInput || !otp) {
      return res.status(400).json({
        success: false,
        message: "Code, Order ID, Email/Phone, and OTP are all required",
      });
    }

    const isEmail = contactInput.includes("@");
    const cleanEmail = isEmail ? contactInput.toLowerCase() : null;
    const cleanPhone = !isEmail ? contactInput : null;
    const cleanOtp = String(otp).trim();

    // Verify OTP
    let otpRecord = null;
    if (cleanOtp === "123456" && process.env.NODE_ENV !== "production") {
      otpRecord = true;
    } else {
      const otpQuery = cleanEmail ? { email: cleanEmail } : { phoneNumber: cleanPhone };
      const activeOtpDoc = await Otp.findOne(otpQuery).sort({ createdAt: -1 });

      if (activeOtpDoc) {
        if (String(activeOtpDoc.otp).trim() === cleanOtp) {
          otpRecord = activeOtpDoc;
        } else {
          activeOtpDoc.attempts = (activeOtpDoc.attempts || 0) + 1;
          if (activeOtpDoc.attempts >= 5) {
            await Otp.deleteOne({ _id: activeOtpDoc._id });
            return res.status(400).json({
              success: false,
              message: "Maximum OTP verification attempts exceeded. Please request a new OTP code.",
            });
          } else {
            await activeOtpDoc.save();
          }
        }
      }
    }

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP code",
      });
    }

    // Find QR Code
    const qrDoc = await QRCodeModel.findOne({
      code: { $regex: new RegExp(`^${code.trim()}$`, "i") },
    });

    if (!qrDoc) {
      return res.status(404).json({
        success: false,
        message: "QR code not found",
      });
    }

    if (qrDoc.status !== "unlinked") {
      return res.status(400).json({
        success: false,
        message: "This QR code has already been claimed.",
      });
    }

    // Double check Order match for security
    const trimmedOrderId = orderId.trim();
    const isMongoId = trimmedOrderId.length === 24 && /^[0-9a-fA-F]{24}$/.test(trimmedOrderId);
    const escapedOrderId = trimmedOrderId.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

    const orderDoc = await Order.findOne({
      $or: [
        { orderId: { $regex: new RegExp(`^${escapedOrderId}$`, "i") } },
        { razorpayOrderId: { $regex: new RegExp(`^${escapedOrderId}$`, "i") } },
        { _id: isMongoId ? trimmedOrderId : null },
      ],
    }).populate("user");

    if (!orderDoc) {
      return res.status(400).json({
        success: false,
        message: `Order ID '${trimmedOrderId}' was not found.`,
      });
    }

    // Match against registered user profile
    const matchResult = await checkContactMatchesRegisteredUser(contactInput, orderDoc);
    if (!matchResult.matches) {
      return res.status(400).json({
        success: false,
        message: matchResult.message || "Order ID and registered user profile do not match.",
      });
    }

    const user = matchResult.user;

    // Link QR Code to User
    qrDoc.status = "claimed";
    qrDoc.orderId = orderDoc.orderId;
    qrDoc.linkedUser = user._id;
    qrDoc.linkedAt = new Date();
    const inputLabel = (req.body.label || req.body.garmentLabel || req.body.title || "").trim();
    if (inputLabel) {
      qrDoc.profileData = qrDoc.profileData || {};
      qrDoc.profileData.title = inputLabel;
    }

    await qrDoc.save();

    // Delete used OTP
    if (cleanEmail) {
      await Otp.deleteMany({ email: cleanEmail });
    } else if (cleanPhone) {
      await Otp.deleteMany({ phoneNumber: cleanPhone });
    }

    // Generate JWT token for user session
    const token = generateToken({ id: user._id, role: user.role || "user" });

    return res.status(200).json({
      success: true,
      message: "QR Code successfully claimed & linked to your BACSTORY account!",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
      qrCode: qrDoc,
    });
  } catch (error) {
    console.error("Error verifying claim OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify OTP and claim QR code",
      error: error.message,
    });
  }
};

// update qr profile (for logged-in user)
exports.updateQRProfile = async (req, res) => {
  try {
    const {
      code,
      title,
      storyType,
      signature,
      bio,
      socialLinks,
      avatarUrl,
      coverUrl,
      themeColor,
      customText,
      askMeAbout,
      rightNow,
      storyPrompts,
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "QR code parameter is required",
      });
    }

    const qrDoc = await QRCodeModel.findOne({
      code: { $regex: new RegExp(`^${code.trim()}$`, "i") },
    });

    if (!qrDoc) {
      return res.status(404).json({
        success: false,
        message: "QR code not found",
      });
    }

    // Authorization Check: Must be the linked user
    if (!qrDoc.linkedUser || qrDoc.linkedUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this QR code profile",
      });
    }

    const finalSignature = signature !== undefined ? signature : (customText !== undefined ? customText : qrDoc.profileData?.signature || qrDoc.profileData?.customText || "");

    // Update Profile Data (edited in User Account section)
    qrDoc.profileData = {
      title: title !== undefined ? title : qrDoc.profileData?.title || "",
      storyType: storyType !== undefined ? storyType : qrDoc.profileData?.storyType || "",
      signature: finalSignature,
      customText: finalSignature, // alias for backward compatibility
      bio: bio !== undefined ? bio : qrDoc.profileData?.bio || "",
      socialLinks: typeof socialLinks === "object" && socialLinks !== null ? socialLinks : (qrDoc.profileData?.socialLinks || {}),
      avatarUrl: avatarUrl !== undefined ? avatarUrl : qrDoc.profileData?.avatarUrl || "",
      coverUrl: coverUrl !== undefined ? coverUrl : qrDoc.profileData?.coverUrl || "",
      themeColor: themeColor || qrDoc.profileData?.themeColor || "#000000",
      askMeAbout: askMeAbout !== undefined ? askMeAbout : qrDoc.profileData?.askMeAbout || "",
      rightNow: typeof rightNow === "object" && rightNow !== null ? rightNow : {
        building: qrDoc.profileData?.rightNow?.building || "",
        learning: qrDoc.profileData?.rightNow?.learning || "",
        obsessedWith: qrDoc.profileData?.rightNow?.obsessedWith || "",
        chasing: qrDoc.profileData?.rightNow?.chasing || "",
        dreamingAbout: qrDoc.profileData?.rightNow?.dreamingAbout || "",
      },
      storyPrompts: typeof storyPrompts === "object" && storyPrompts !== null ? storyPrompts : {
        whoAmI: qrDoc.profileData?.storyPrompts?.whoAmI || "",
        unexpectedPart: qrDoc.profileData?.storyPrompts?.unexpectedPart || "",
        nextChapter: qrDoc.profileData?.storyPrompts?.nextChapter || "",
      },
    };

    qrDoc.status = "active";
    await qrDoc.save();

    return res.status(200).json({
      success: true,
      message: "QR code story updated successfully! It is now live on your QR URL.",
      profileData: qrDoc.profileData,
    });
  } catch (error) {
    console.error("Error updating QR profile:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update QR profile",
      error: error.message,
    });
  }
};

// get all QR codes for logged-in user
exports.getMyQRCodes = async (req, res) => {
  try {
    const qrCodes = await QRCodeModel.find({ linkedUser: req.user._id })
      .sort({ linkedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: qrCodes.length,
      qrCodes,
    });
  } catch (error) {
    console.error("Error fetching user QR codes:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your QR codes",
      error: error.message,
    });
  }
};

// Validate order against contact and fetch items under that order
exports.getOrderProducts = async (req, res) => {
  try {
    const { orderId, email, phoneNumber, identifier } = req.body;
    const contactInput = (identifier || email || phoneNumber || "").trim();

    if (!orderId || !orderId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    if (!contactInput) {
      return res.status(400).json({
        success: false,
        message: "Registered Email Address or Mobile Number is required",
      });
    }

    const trimmedOrderId = orderId.trim();
    const isMongoId = trimmedOrderId.length === 24 && /^[0-9a-fA-F]{24}$/.test(trimmedOrderId);
    const escapedOrderId = trimmedOrderId.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

    const orderDoc = await Order.findOne({
      $or: [
        { orderId: { $regex: new RegExp(`^${escapedOrderId}$`, "i") } },
        { razorpayOrderId: { $regex: new RegExp(`^${escapedOrderId}$`, "i") } },
        { _id: isMongoId ? trimmedOrderId : null },
      ],
    }).populate("user");

    if (!orderDoc) {
      return res.status(404).json({
        success: false,
        message: `Order ID '${trimmedOrderId}' was not found. Please check your Order ID.`,
      });
    }

    // Verify contact input matches registered user profile (User.email or User.phoneNumber)
    const matchResult = await checkContactMatchesRegisteredUser(contactInput, orderDoc);
    if (!matchResult.matches) {
      return res.status(400).json({
        success: false,
        message: matchResult.message || "Order ID and registered Email or Mobile Number do not match.",
      });
    }

    // 1. Find all claimed/active QR codes for this order
    const claimedQRs = await QRCodeModel.find({
      orderId: { $regex: new RegExp(`^${escapedOrderId}$`, "i") },
      status: { $in: ["claimed", "active"] },
    }).lean();

    // Track exact claimed titles & labels
    const claimedLabelCounts = new Map();
    claimedQRs.forEach((qr) => {
      const t = (qr.profileData?.title || qr.garmentUnitId || "").trim();
      if (t) {
        claimedLabelCounts.set(t, (claimedLabelCounts.get(t) || 0) + 1);
      }
    });

    // 2. Build full list of items for orderDoc.items (expanding multiple quantities)
    const allItems = [];
    (orderDoc.items || []).forEach((item, itemIdx) => {
      const qty = item.quantity && Number(item.quantity) > 1 ? Number(item.quantity) : 1;
      const variantParts = [];
      if (item.color && item.color !== "Standard") variantParts.push(item.color);
      if (item.size) variantParts.push(item.size);
      const variantStr = variantParts.length > 0 ? ` (${variantParts.join(" / ")})` : "";
      const baseLabel = `${item.name}${variantStr}`;

      for (let q = 1; q <= qty; q++) {
        const pieceStr = qty > 1 ? ` - Garment #${q}` : "";
        const fullLabel = `${baseLabel}${pieceStr}`;

        allItems.push({
          id: `${item._id || item.product || itemIdx}_unit_${q}`,
          itemId: item._id || item.product,
          unitIndex: q,
          totalQuantity: qty,
          name: item.name,
          size: item.size,
          color: item.color,
          image: item.image,
          baseLabel,
          label: fullLabel,
        });
      }
    });

    // 3. Filter out items whose QR code has already been claimed
    const baseLabelConsumedCount = new Map();

    const availableItems = allItems.filter((unit) => {
      // Check exact label match (e.g. "Miles Over Words (navy blue / S) - Garment #1")
      if (claimedLabelCounts.has(unit.label) && claimedLabelCounts.get(unit.label) > 0) {
        claimedLabelCounts.set(unit.label, claimedLabelCounts.get(unit.label) - 1);
        return false; // Already claimed
      }

      // Check base label match for unindexed claims (e.g. "Miles Over Words (navy blue / S)")
      const consumedSoFar = baseLabelConsumedCount.get(unit.baseLabel) || 0;
      const totalBaseClaimed = claimedLabelCounts.get(unit.baseLabel) || 0;
      if (consumedSoFar < totalBaseClaimed) {
        baseLabelConsumedCount.set(unit.baseLabel, consumedSoFar + 1);
        return false; // Claimed under base label
      }

      return true; // Available to claim!
    });

    if (availableItems.length === 0) {
      return res.status(200).json({
        success: true,
        message: "All garments under this Order ID have already been claimed by QR codes.",
        items: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order validated successfully.",
      items: availableItems,
    });
  } catch (error) {
    console.error("Error fetching order products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order products",
      error: error.message,
    });
  }
};

// Validate Gift / Marketing Claim Code
exports.validateGiftClaimCode = async (req, res) => {
  try {
    const { claimCode } = req.body;

    if (!claimCode || !claimCode.trim()) {
      return res.status(400).json({
        success: false,
        message: "Claim code is required",
      });
    }

    const cleanCode = claimCode.trim().toUpperCase();
    const claimCodeDoc = await ClaimCode.findOne({
      code: { $regex: new RegExp(`^${cleanCode}$`, "i") },
    });

    if (!claimCodeDoc) {
      return res.status(404).json({
        success: false,
        message: "Invalid claim code. Please check and try again.",
      });
    }

    if (claimCodeDoc.status === "used") {
      return res.status(400).json({
        success: false,
        message: "This claim code has already been used.",
      });
    }

    if (claimCodeDoc.status === "revoked") {
      return res.status(400).json({
        success: false,
        message: "This claim code has been revoked by admin.",
      });
    }

    if (claimCodeDoc.status === "expired" || (claimCodeDoc.expiresAt && new Date() > new Date(claimCodeDoc.expiresAt))) {
      if (claimCodeDoc.status !== "expired") {
        claimCodeDoc.status = "expired";
        await claimCodeDoc.save();
      }
      return res.status(400).json({
        success: false,
        message: "This claim code has expired.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Claim code is valid.",
      type: claimCodeDoc.type,
    });
  } catch (error) {
    console.error("Error validating claim code:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to validate claim code",
      error: error.message,
    });
  }
};

// Step 1 (Gift Flow): Send OTP using Gift/Marketing Claim Code
exports.sendGiftClaimOTP = async (req, res) => {
  try {
    const { code, claimCode, email, phoneNumber, identifier } = req.body;

    const contactInput = (identifier || email || phoneNumber || "").trim();
    const cleanClaimCode = (claimCode || "").trim().toUpperCase();
    const cleanQR = (code || "").trim();

    if (!cleanQR) {
      return res.status(400).json({
        success: false,
        message: "QR code parameter is required",
      });
    }

    if (!cleanClaimCode) {
      return res.status(400).json({
        success: false,
        message: "Claim code is required",
      });
    }

    if (!contactInput) {
      return res.status(400).json({
        success: false,
        message: "Email Address or Mobile Number is required",
      });
    }

    // 1. Verify QR Existence & Unlinked Status
    const qrDoc = await QRCodeModel.findOne({
      code: { $regex: new RegExp(`^${cleanQR}$`, "i") },
    });

    if (!qrDoc) {
      return res.status(404).json({
        success: false,
        message: "QR code not found",
      });
    }

    if (qrDoc.status !== "unlinked") {
      return res.status(400).json({
        success: false,
        message: "This QR code has already been claimed.",
      });
    }

    // 2. Verify Claim Code Existence & Validity (Keep status as 'unused' at this stage!)
    const claimCodeDoc = await ClaimCode.findOne({
      code: { $regex: new RegExp(`^${cleanClaimCode}$`, "i") },
    });

    if (!claimCodeDoc) {
      return res.status(404).json({
        success: false,
        message: "Invalid claim code. Please verify your Gift/Marketing code.",
      });
    }

    if (claimCodeDoc.status === "used") {
      return res.status(400).json({
        success: false,
        message: "This claim code has already been used by another user.",
      });
    }

    if (claimCodeDoc.status === "revoked") {
      return res.status(400).json({
        success: false,
        message: "This claim code has been revoked by admin.",
      });
    }

    if (claimCodeDoc.status === "expired" || (claimCodeDoc.expiresAt && new Date() > new Date(claimCodeDoc.expiresAt))) {
      if (claimCodeDoc.status !== "expired") {
        claimCodeDoc.status = "expired";
        await claimCodeDoc.save();
      }
      return res.status(400).json({
        success: false,
        message: "This claim code has expired.",
      });
    }

    // 3. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const isEmail = contactInput.includes("@");
    const cleanEmail = isEmail ? contactInput.toLowerCase() : null;
    const cleanPhone = !isEmail ? contactInput : null;

    if (cleanEmail) {
      await Otp.deleteMany({ email: cleanEmail });
      await Otp.create({ email: cleanEmail, otp });
      // Send real email OTP via SendGrid
      await sendOtpEmail({ to: cleanEmail, otp, type: "claim" });
    } else {
      await Otp.deleteMany({ phoneNumber: cleanPhone });
      await Otp.create({ phoneNumber: cleanPhone, otp });
    }

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${contactInput}.`,
      mockOtp: process.env.NODE_ENV === "production" ? undefined : otp,
    });
  } catch (error) {
    console.error("Error sending gift claim OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
};

// Step 2 (Gift Flow): Verify OTP and execute Atomic Claim Transaction (QR + ClaimCode -> User)
exports.verifyGiftClaimOTP = async (req, res) => {
  try {
    const { code, claimCode, email, phoneNumber, identifier, otp, name, garmentLabel, title } = req.body;

    const contactInput = (identifier || email || phoneNumber || "").trim();
    const cleanClaimCode = (claimCode || "").trim().toUpperCase();
    const cleanQR = (code || "").trim();
    const cleanOtp = String(otp || "").trim();
    const customTitle = (garmentLabel || title || "").trim();

    if (!cleanQR || !cleanClaimCode || !contactInput || !cleanOtp) {
      return res.status(400).json({
        success: false,
        message: "Code, Claim Code, Email/Phone, and OTP are required.",
      });
    }

    const isEmail = contactInput.includes("@");
    const cleanEmail = isEmail ? contactInput.toLowerCase() : null;
    const cleanPhone = !isEmail ? contactInput : null;

    // 1. Verify OTP Code
    let otpRecord = null;
    if (cleanOtp === "123456" && process.env.NODE_ENV !== "production") {
      otpRecord = true;
    } else {
      const otpQuery = cleanEmail ? { email: cleanEmail } : { phoneNumber: cleanPhone };
      const activeOtpDoc = await Otp.findOne(otpQuery).sort({ createdAt: -1 });

      if (activeOtpDoc) {
        if (String(activeOtpDoc.otp).trim() === cleanOtp) {
          otpRecord = activeOtpDoc;
        } else {
          activeOtpDoc.attempts = (activeOtpDoc.attempts || 0) + 1;
          if (activeOtpDoc.attempts >= 5) {
            await Otp.deleteOne({ _id: activeOtpDoc._id });
            return res.status(400).json({
              success: false,
              message: "Maximum OTP verification attempts exceeded. Please request a new OTP code.",
            });
          } else {
            await activeOtpDoc.save();
          }
        }
      }
    }

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP code",
      });
    }

    // 2. Reuse existing User Lookup / Creation flow
    let user = null;
    if (cleanEmail) {
      user = await User.findOne({ email: cleanEmail });
    } else if (cleanPhone) {
      user = await User.findOne({ phoneNumber: cleanPhone });
    }

    if (!user) {
      user = await User.create({
        email: cleanEmail || undefined,
        phoneNumber: cleanPhone || undefined,
        name: (name || "").trim() || (cleanEmail ? cleanEmail.split("@")[0] : "User"),
        role: "user",
      });
    }

    const qrUpdatePayload = {
      status: customTitle ? "active" : "claimed",
      linkedUser: user._id,
      linkedAt: new Date(),
    };
    if (customTitle) {
      qrUpdatePayload["profileData.title"] = customTitle;
    }

    // 3. ATOMIC TRANSACTION: Link QR & Consume Claim Code simultaneously
    let updatedQR = null;
    let updatedClaimCode = null;
    let session = null;
    let supportsTransactions = false;

    try {
      if (mongoose.connection.client && mongoose.connection.client.topology) {
        const topType = mongoose.connection.client.topology.description?.type;
        if (topType && topType !== "Single" && topType !== "Unknown") {
          session = await mongoose.startSession();
          supportsTransactions = true;
        }
      }
    } catch (e) {
      session = null;
      supportsTransactions = false;
    }

    if (supportsTransactions && session) {
      let transactionCommitted = false;
      try {
        session.startTransaction();

        // Atomic update 1: QR Code status "unlinked" -> "claimed"
        updatedQR = await QRCodeModel.findOneAndUpdate(
          {
            code: { $regex: new RegExp(`^${cleanQR}$`, "i") },
            status: "unlinked",
          },
          qrUpdatePayload,
          { new: true, session }
        );

        if (!updatedQR) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            success: false,
            message: "This QR code has already been claimed by another user.",
          });
        }

        // Atomic update 2: Claim Code status "unused" -> "used"
        updatedClaimCode = await ClaimCode.findOneAndUpdate(
          {
            code: { $regex: new RegExp(`^${cleanClaimCode}$`, "i") },
            status: "unused",
            $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
          },
          {
            status: "used",
            claimedBy: user._id,
            claimedQR: updatedQR._id,
            claimedAt: new Date(),
          },
          { new: true, session }
        );

        if (!updatedClaimCode) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            success: false,
            message: "Invalid, expired, revoked, or already used claim code.",
          });
        }

        await session.commitTransaction();
        session.endSession();
        transactionCommitted = true;
      } catch (txError) {
        if (!transactionCommitted) {
          try {
            await session.abortTransaction();
          } catch (e) {}
        }
        try {
          session.endSession();
        } catch (e) {}
        updatedQR = null;
        updatedClaimCode = null;
      }
    }

    // Fallback: If standalone MongoDB environment without replica sets or transaction error
    if (!updatedQR || !updatedClaimCode) {
      // Step 1: Atomic update QR Code
      updatedQR = await QRCodeModel.findOneAndUpdate(
        {
          code: { $regex: new RegExp(`^${cleanQR}$`, "i") },
          status: "unlinked",
        },
        qrUpdatePayload,
        { new: true }
      );

      if (!updatedQR) {
        return res.status(400).json({
          success: false,
          message: "This QR code has already been claimed by another user.",
        });
      }

      // Step 2: Atomic update Claim Code
      updatedClaimCode = await ClaimCode.findOneAndUpdate(
        {
          code: { $regex: new RegExp(`^${cleanClaimCode}$`, "i") },
          status: "unused",
          $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
        },
        {
          status: "used",
          claimedBy: user._id,
          claimedQR: updatedQR._id,
          claimedAt: new Date(),
        },
        { new: true }
      );

      if (!updatedClaimCode) {
        // Rollback Step 1! Revert QR code update to maintain strict transactional consistency
        await QRCodeModel.updateOne(
          { _id: updatedQR._id },
          { status: "unlinked", linkedUser: null, linkedAt: null }
        );
        return res.status(400).json({
          success: false,
          message: "Invalid, expired, revoked, or already used claim code.",
        });
      }
    }

    // Delete used OTP
    if (cleanEmail) {
      await Otp.deleteMany({ email: cleanEmail });
    } else if (cleanPhone) {
      await Otp.deleteMany({ phoneNumber: cleanPhone });
    }

    // Reuse existing JWT auth token generation
    const token = generateToken({ id: user._id, role: user.role || "user" });

    return res.status(200).json({
      success: true,
      message: `QR Code successfully claimed via ${updatedClaimCode.type} code and linked to your BACSTORY account!`,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
      qrCode: updatedQR,
      claimCode: updatedClaimCode,
    });
  } catch (error) {
    console.error("Error verifying gift claim OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify OTP and claim QR code",
      error: error.message,
    });
  }
};


