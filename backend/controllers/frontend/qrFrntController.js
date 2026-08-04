const QRCodeModel = require("../../models/QRCode");
const User = require("../../models/user");
const Otp = require("../../models/otp");
const { generateToken } = require("../../config/jwt");

/**
 * @desc    Get QR Code details by unique code (Public scan endpoint)
 *          Note: Pure display endpoint. No form editing here.
 * @route   GET /api/frontend/qr/:code
 * @access  Public
 */
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
      .populate("linkedUser", "name email")
      .lean();

    if (!qrDoc) {
      return res.status(404).json({
        success: false,
        message: "QR code not found",
      });
    }

    // Unlinked status response (Frontend shows simple Order ID + Email OTP prompt)
    if (qrDoc.status === "unlinked") {
      return res.status(200).json({
        success: true,
        status: "unlinked",
        code: qrDoc.code,
        message: "This QR code is unlinked. Enter your Order ID & Email to claim it.",
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

/**
 * @desc    Step 1: Send OTP to Email for claiming QR Code with Order ID
 * @route   POST /api/frontend/qr/send-otp
 * @access  Public
 */
exports.sendClaimOTP = async (req, res) => {
  try {
    const { code, orderId, email } = req.body;

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

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Purchase Email is required",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

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

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Clear old OTPs for this email
    await Otp.deleteMany({ email: cleanEmail });

    // Store OTP in database
    await Otp.create({
      email: cleanEmail,
      otp,
    });

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${cleanEmail}.`,
      mockOtp: otp,
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

/**
 * @desc    Step 2: Verify OTP & Claim QR Code (Links to User Account)
 * @route   POST /api/frontend/qr/verify-claim-otp
 * @access  Public (Password-free authentication via OTP)
 */
exports.verifyClaimOTP = async (req, res) => {
  try {
    const { code, orderId, email, otp, name } = req.body;

    if (!code || !orderId || !email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Code, Order ID, Email, and OTP are all required",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Verify OTP
    const otpRecord = await Otp.findOne({ email: cleanEmail, otp: otp.trim() });
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

    // Find or Create User Account automatically
    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      user = await User.create({
        email: cleanEmail,
        name: name ? name.trim() : cleanEmail.split("@")[0],
        role: "user",
      });
    }

    // Link QR Code to User
    qrDoc.status = "claimed";
    qrDoc.orderId = orderId.trim();
    qrDoc.linkedUser = user._id;
    qrDoc.linkedAt = new Date();

    await qrDoc.save();

    // Delete used OTP
    await Otp.deleteMany({ email: cleanEmail });

    // Generate JWT token for user session
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "QR Code successfully claimed & linked to your BACSTORY account!",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
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

/**
 * @desc    Update QR Code Profile / Story Form
 *          Note: Called from User Profile Section (/account)
 * @route   PUT /api/frontend/qr/profile
 * @access  Private (Owner of QR Code)
 */
exports.updateQRProfile = async (req, res) => {
  try {
    const {
      code,
      title,
      bio,
      socialLinks,
      avatarUrl,
      coverUrl,
      themeColor,
      customText,
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

    // Update Profile Data (edited in User Account section)
    qrDoc.profileData = {
      title: title !== undefined ? title : qrDoc.profileData?.title || "",
      bio: bio !== undefined ? bio : qrDoc.profileData?.bio || "",
      socialLinks: {
        instagram: socialLinks?.instagram ?? qrDoc.profileData?.socialLinks?.instagram ?? "",
        twitter: socialLinks?.twitter ?? qrDoc.profileData?.socialLinks?.twitter ?? "",
        spotify: socialLinks?.spotify ?? qrDoc.profileData?.socialLinks?.spotify ?? "",
        customUrl: socialLinks?.customUrl ?? qrDoc.profileData?.socialLinks?.customUrl ?? "",
      },
      avatarUrl: avatarUrl !== undefined ? avatarUrl : qrDoc.profileData?.avatarUrl || "",
      coverUrl: coverUrl !== undefined ? coverUrl : qrDoc.profileData?.coverUrl || "",
      themeColor: themeColor || qrDoc.profileData?.themeColor || "#000000",
      customText: customText !== undefined ? customText : qrDoc.profileData?.customText || "",
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

/**
 * @desc    Get all QR Codes claimed by logged-in user (for Profile / Account section)
 * @route   GET /api/frontend/qr/my-qrs
 * @access  Private (Authenticated User)
 */
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
