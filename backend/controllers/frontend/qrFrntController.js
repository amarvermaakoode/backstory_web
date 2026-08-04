const QRCodeModel = require("../../models/QRCode");

/**
 * @desc    Get QR Code details by unique code (Public scan endpoint)
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

    // Unlinked status response
    if (qrDoc.status === "unlinked") {
      return res.status(200).json({
        success: true,
        status: "unlinked",
        code: qrDoc.code,
        message: "This QR code is unlinked. Enter your Order ID to claim & activate it.",
      });
    }

    // Claimed / Active status response (Public story view)
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
 * @desc    Claim an unlinked QR Code using Order ID
 * @route   POST /api/frontend/qr/claim
 * @access  Private (Authenticated User)
 */
exports.claimQRCode = async (req, res) => {
  try {
    const { code, orderId } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "QR code is required",
      });
    }

    if (!orderId || !orderId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required to claim this QR code",
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

    // If already claimed
    if (qrDoc.status !== "unlinked") {
      if (qrDoc.linkedUser && qrDoc.linkedUser.toString() === req.user._id.toString()) {
        return res.status(200).json({
          success: true,
          message: "You have already claimed this QR code!",
          qrCode: qrDoc,
        });
      }
      return res.status(400).json({
        success: false,
        message: "This QR code has already been claimed by another user.",
      });
    }

    // Link QR code to current authenticated user
    qrDoc.status = "claimed";
    qrDoc.orderId = orderId.trim();
    qrDoc.linkedUser = req.user._id;
    qrDoc.linkedAt = new Date();

    await qrDoc.save();
    await qrDoc.populate("linkedUser", "name email");

    return res.status(200).json({
      success: true,
      message: "QR code successfully claimed and linked to your account!",
      qrCode: qrDoc,
    });
  } catch (error) {
    console.error("Error claiming QR code:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to claim QR code",
      error: error.message,
    });
  }
};

/**
 * @desc    Update QR Code Profile / Story Form
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

    // Update Profile Data
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
      message: "QR code profile updated successfully!",
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
 * @desc    Get all QR Codes claimed by logged-in user
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
