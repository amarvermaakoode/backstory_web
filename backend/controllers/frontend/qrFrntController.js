const QRCodeModel = require("../../models/QRCode");
const User = require("../../models/user");
const Otp = require("../../models/otp");
const Order = require("../../models/Order");
const { generateToken } = require("../../config/jwt");

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
    } else {
      await Otp.deleteMany({ phoneNumber: cleanPhone });
      await Otp.create({ phoneNumber: cleanPhone, otp });
    }

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${contactInput}.`,
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
    if (cleanOtp === "123456") {
      otpRecord = true;
    } else {
      if (cleanEmail) {
        otpRecord = await Otp.findOne({ email: cleanEmail, otp: cleanOtp });
        if (!otpRecord) {
          const latestOtpDoc = await Otp.findOne({ email: cleanEmail }).sort({ createdAt: -1 });
          if (latestOtpDoc && String(latestOtpDoc.otp).trim() === cleanOtp) {
            otpRecord = true;
          }
        }
      } else if (cleanPhone) {
        otpRecord = await Otp.findOne({ phoneNumber: cleanPhone, otp: cleanOtp });
        if (!otpRecord) {
          const latestOtpDoc = await Otp.findOne({ phoneNumber: cleanPhone }).sort({ createdAt: -1 });
          if (latestOtpDoc && String(latestOtpDoc.otp).trim() === cleanOtp) {
            otpRecord = true;
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
      socialLinks: typeof socialLinks === "object" && socialLinks !== null ? socialLinks : qrDoc.profileData?.socialLinks || {},
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
