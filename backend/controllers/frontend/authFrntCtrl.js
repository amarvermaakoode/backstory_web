const User = require("../../models/user");
const Otp = require("../../models/otp");
const { generateToken } = require("../../config/jwt");
const { sendOtpEmail } = require("../../services/emailService");
const { sendWidgetOtp, verifyWidgetOtp } = require("../../services/msg91Service");

// Send OTP
const sendOtp = async (req, res) => {
  try {
    const { email, phoneNumber, type, mode } = req.body;
    const authType = type || mode; // "login" | "signup"

    if (!email && !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Please provide either an email address or mobile number.",
      });
    }

    const formattedEmail = email ? email.toLowerCase().trim() : undefined;
    const formattedPhone = phoneNumber ? phoneNumber.replace(/\D/g, "").trim() : undefined;

    if (formattedPhone && formattedPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number.",
      });
    }

    // Check existing user for login / signup validation
    let existingUser = null;
    if (formattedEmail) {
      existingUser = await User.findOne({ email: formattedEmail });
    } else if (formattedPhone) {
      existingUser = await User.findOne({ phoneNumber: formattedPhone });
    }

    if (authType === "login") {
      if (!existingUser || existingUser.role === "admin") {
        return res.status(404).json({
          success: false,
          accountNotFound: true,
          message: formattedPhone
            ? "This account doesn't exist. Please sign up."
            : "This account doesn't exist. Please sign up.",
        });
      }
    }

    if (authType === "signup") {
      if (existingUser) {
        return res.status(409).json({
          success: false,
          accountExists: true,
          message: formattedPhone
            ? "An account with this phone number already exists. Please log in."
            : "An account with this email address already exists. Please log in.",
        });
      }
    }

    // Pathway 1: If email is provided, send real OTP email via SendGrid
    if (formattedEmail) {
      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await Otp.deleteMany({ email: formattedEmail });
      await Otp.create({
        email: formattedEmail,
        otp,
      });

      console.log(`[Auth] Dispatching ${authType} OTP email via SendGrid to ${formattedEmail}...`);
      const emailResult = await sendOtpEmail({
        to: formattedEmail,
        otp,
        type: authType,
      });

      if (!emailResult.success) {
        console.error(`[Auth] Failed to send OTP email to ${formattedEmail}:`, emailResult.error);
        return res.status(500).json({
          success: false,
          message: emailResult.error || "Failed to send verification email. Please try again.",
        });
      }

      console.log(`[Auth] OTP email successfully dispatched via SendGrid to ${formattedEmail}. Code: ${otp}`);

      return res.status(200).json({
        success: true,
        message: `Verification code sent to ${formattedEmail}. Please check your email inbox.`,
        emailSent: true,
        mockOtp: process.env.SHOW_EMAIL_MOCK_OTP === "true" ? otp : undefined,
      });
    }

    // Pathway 2: If phone number is provided, dispatch OTP via MSG91 Widget
    if (formattedPhone) {
      const authKey = (process.env.MSG91_AUTHKEY || process.env.MSG91_AUTH_KEY || "").trim();

      // If MSG91 auth key is configured, call MSG91 Widget sendOtp API
      if (authKey) {
        console.log(`[Auth] Dispatching ${authType} mobile OTP via MSG91 to +91 ${formattedPhone}...`);
        const msg91Res = await sendWidgetOtp(formattedPhone);

        if (msg91Res.success) {
          // Clean up existing OTPs for this phone number
          await Otp.deleteMany({ phoneNumber: formattedPhone });

          // Save OTP record with MSG91 reqId
          await Otp.create({
            phoneNumber: formattedPhone,
            reqId: msg91Res.reqId,
          });

          return res.status(200).json({
            success: true,
            message: `OTP sent successfully to +91 ${formattedPhone}. Please check your mobile phone.`,
            isMsg91: true,
          });
        }

        console.error(`[Auth] MSG91 failed to send OTP to ${formattedPhone}:`, msg91Res.error);
        const isCaptchaError = typeof msg91Res.error === "string" && msg91Res.error.toLowerCase().includes("captcha");
        return res.status(400).json({
          success: false,
          message: isCaptchaError
            ? "Captcha verification is enabled on your MSG91 widget. Please turn OFF 're-Captcha validation' in your MSG91 Dashboard > OTP Widget (366a6d67716a333633383431) > Settings."
            : (msg91Res.error || "Failed to send mobile verification code via MSG91. Please try again."),
        });
      }

      // Fallback simulation when MSG91_AUTHKEY is not yet populated in .env
      console.warn(`[Auth] MSG91_AUTHKEY is not configured in backend/.env. Using simulation/mock OTP.`);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await Otp.deleteMany({ phoneNumber: formattedPhone });
      await Otp.create({
        phoneNumber: formattedPhone,
        otp,
      });

      console.log(`[Auth] Mock OTP generated for phone +91 ${formattedPhone}: ${otp}`);
      return res.status(200).json({
        success: true,
        message: `OTP sent successfully to +91 ${formattedPhone}.`,
        mockOtp: otp,
      });
    }
  } catch (error) {
    console.error("Send OTP error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during sending OTP",
    });
  }
};

// Verify OTP & Login/Signup
const verifyOtp = async (req, res) => {
  try {
    const { email, phoneNumber, otp, type, mode } = req.body;
    const authType = type || mode; // "login" | "signup"

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide the OTP code",
      });
    }

    if (!email && !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email address or mobile number.",
      });
    }

    const formattedEmail = email ? email.toLowerCase().trim() : undefined;
    const formattedPhone = phoneNumber ? phoneNumber.replace(/\D/g, "").trim() : undefined;

    // Clean OTP string
    const cleanOtp = String(otp).trim();

    // Check if verification code is valid
    let isValid = false;

    // Support static universal mock OTP for testing
    if (cleanOtp === "123456") {
      isValid = true;
    } else if (formattedPhone) {
      const otpRecord = await Otp.findOne({ phoneNumber: formattedPhone });

      if (otpRecord) {
        // If this OTP was sent via MSG91 widget, verify with MSG91 API
        if (otpRecord.reqId) {
          console.log(`[Auth] Verifying OTP with MSG91 for +91 ${formattedPhone} (reqId: ${otpRecord.reqId})...`);
          const msg91Verify = await verifyWidgetOtp(otpRecord.reqId, cleanOtp);

          if (msg91Verify.success) {
            isValid = true;
            await Otp.deleteOne({ _id: otpRecord._id });
          } else {
            console.warn(`[Auth] MSG91 OTP verification failed:`, msg91Verify.error);
            return res.status(400).json({
              success: false,
              message: msg91Verify.error || "Invalid or expired OTP",
            });
          }
        } else if (otpRecord.otp && otpRecord.otp === cleanOtp) {
          // Fallback local OTP match
          isValid = true;
          await Otp.deleteOne({ _id: otpRecord._id });
        }
      }
    } else if (formattedEmail) {
      const otpRecord = await Otp.findOne({ email: formattedEmail, otp: cleanOtp });
      if (otpRecord) {
        isValid = true;
        await Otp.deleteOne({ _id: otpRecord._id });
      }
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Try to find the user
    let user = null;
    if (formattedEmail) {
      user = await User.findOne({ email: formattedEmail });
    } else if (formattedPhone) {
      user = await User.findOne({ phoneNumber: formattedPhone });
    }

    let accountReactivated = false;
    if (authType === "login") {
      if (!user || user.role === "admin") {
        return res.status(404).json({
          success: false,
          accountNotFound: true,
          message: "This account doesn't exist. Please sign up first.",
        });
      }
      if (user.isDeactivated) {
        user.isDeactivated = false;
        await user.save();
        accountReactivated = true;
      }
    }

    if (authType === "signup" && user) {
      return res.status(409).json({
        success: false,
        accountExists: true,
        message: "An account already exists with these details. Please log in.",
      });
    }

    let isNewUser = false;

    if (!user) {
      // User doesn't exist, create a new user (Signup)
      isNewUser = true;

      const newUserData = { role: "user" };
      if (formattedEmail) newUserData.email = formattedEmail;
      if (formattedPhone) newUserData.phoneNumber = formattedPhone;

      user = await User.create(newUserData);
    }

    // Generate JWT
    const token = generateToken({ id: user._id, role: user.role });

    return res.status(200).json({
      success: true,
      message: accountReactivated
        ? "Welcome back! Your account has been reactivated."
        : isNewUser
          ? "User registered and logged in successfully"
          : "Logged in successfully",
      isNewUser,
      accountReactivated,
      token,
      user: {
        id: user._id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        name: user.name || "",
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth || "",
        role: user.role,
        addresses: user.addresses || [],
        isDeactivated: false,
        walletBalance: user.walletBalance || 0,
        walletTransactions: user.walletTransactions || [],
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during verifying OTP",
    });
  }
};

// Get current user profile
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    let user = await User.findById(userId).select("-password");
    if (!user || user.isDeactivated || user.role === "admin") {
      return res.status(401).json({
        success: false,
        isAdminAccount: user?.role === "admin",
        message: user?.role === "admin"
          ? "Admin accounts cannot access customer accounts."
          : "User not found or account deactivated",
        accountDeleted: true,
      });
    }

    // Auto-sync wallet balance from any refunded wallet orders
    const { syncUserWalletBalance } = require("../../config/walletHelper");
    await syncUserWalletBalance(user._id, user.email, user.phoneNumber);

    // Re-fetch updated user record
    user = await User.findById(userId).select("-password");

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        name: user.name || "",
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth || "",
        role: user.role,
        addresses: user.addresses || [],
        isDeactivated: user.isDeactivated || false,
        walletBalance: user.walletBalance || 0,
        walletTransactions: user.walletTransactions || [],
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update profile details (Name, Gender, Phone, Email, DOB)
const updateProfile = async (req, res) => {
  try {
    const { name, gender, phone, phoneNumber, email, dob, dateOfBirth } = req.body;
    const user = await User.findById(req.user.id || req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const newEmail = email ? email.toLowerCase().trim() : user.email;
    const newPhone = (phone || phoneNumber) ? (phone || phoneNumber).trim() : user.phoneNumber;

    if (newEmail && newEmail !== user.email) {
      const existingEmail = await User.findOne({ email: newEmail, _id: { $ne: user._id } });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: "Email is already in use by another account." });
      }
      user.email = newEmail;
    }

    if (newPhone && newPhone !== user.phoneNumber) {
      const existingPhone = await User.findOne({ phoneNumber: newPhone, _id: { $ne: user._id } });
      if (existingPhone) {
        return res.status(400).json({ success: false, message: "Phone number is already in use by another account." });
      }
      user.phoneNumber = newPhone;
    }

    if (name !== undefined) user.name = name.trim();
    if (gender !== undefined) user.gender = gender;
    if (dob !== undefined || dateOfBirth !== undefined) user.dateOfBirth = dob || dateOfBirth;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile details updated successfully",
      user: {
        id: user._id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        name: user.name || "",
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth || "",
        role: user.role,
        addresses: user.addresses || [],
        isDeactivated: user.isDeactivated || false,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Add new address
const addAddress = async (req, res) => {
  try {
    const { name, label, recipientName, addressLine1, addressLine2, cityStatePin, phone, country, isDefault } = req.body;
    if ((!name && !label) || !addressLine1) {
      return res.status(400).json({ success: false, message: "Address label and address line 1 are required." });
    }

    const user = await User.findById(req.user.id || req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const targetLine1 = addressLine1.trim().toLowerCase();
    const targetCityStatePin = cityStatePin ? cityStatePin.trim().toLowerCase() : "";

    // Check if an address with matching details already exists
    const existingIndex = user.addresses.findIndex((addr) => {
      const matchLine1 = (addr.addressLine1 || "").trim().toLowerCase() === targetLine1;
      const matchCityStatePin = (addr.cityStatePin || "").trim().toLowerCase() === targetCityStatePin;
      return matchLine1 && matchCityStatePin;
    });

    const setAsDefault = isDefault || user.addresses.length === 0;

    if (existingIndex !== -1) {
      // Address already exists! Update existing address fields & default status instead of duplicating
      if (setAsDefault) {
        user.addresses.forEach((addr, idx) => {
          addr.isDefault = idx === existingIndex;
        });
      }
      if (recipientName) user.addresses[existingIndex].recipientName = recipientName.trim();
      if (phone) user.addresses[existingIndex].phone = phone.trim();
      if (addressLine2) user.addresses[existingIndex].addressLine2 = addressLine2.trim();
      if (name || label) user.addresses[existingIndex].name = name || label;
      if (country) user.addresses[existingIndex].country = country.trim();

      await user.save();

      return res.status(200).json({
        success: true,
        message: "Address updated successfully",
        addresses: user.addresses,
      });
    }

    if (setAsDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      name: name || label || "Home",
      recipientName: recipientName || name || "",
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2 ? addressLine2.trim() : "",
      cityStatePin: cityStatePin ? cityStatePin.trim() : "",
      phone: phone ? phone.trim() : user.phoneNumber || "",
      country: country ? country.trim() : "India",
      isDefault: setAsDefault,
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Add address error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update existing address
const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { name, label, recipientName, addressLine1, addressLine2, cityStatePin, phone, country, isDefault } = req.body;

    const user = await User.findById(req.user.id || req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const target = user.addresses.id(addressId);
    if (!target) {
      return res.status(404).json({ success: false, message: "Address not found." });
    }

    if (name !== undefined || label !== undefined) target.name = name || label;
    if (recipientName !== undefined) target.recipientName = recipientName;
    if (addressLine1 !== undefined) target.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) target.addressLine2 = addressLine2;
    if (cityStatePin !== undefined) target.cityStatePin = cityStatePin;
    if (phone !== undefined) target.phone = phone;
    if (country !== undefined) target.country = country;

    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = addr._id.toString() === addressId;
      });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Update address error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete address
const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id || req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const target = user.addresses.id(addressId);
    if (!target) {
      return res.status(404).json({ success: false, message: "Address not found." });
    }

    const wasDefault = target.isDefault;
    user.addresses.pull({ _id: addressId });

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address removed successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Delete address error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Set default address
const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id || req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let found = false;
    user.addresses.forEach((addr) => {
      if (addr._id.toString() === addressId) {
        addr.isDefault = true;
        found = true;
      } else {
        addr.isDefault = false;
      }
    });

    if (!found) {
      return res.status(404).json({ success: false, message: "Address not found." });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Default address updated",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Set default address error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Deactivate account
const deactivateAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isDeactivated = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Account deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate account error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete account (Completely wipe all user-end data)
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const cleanEmail = (user.email || "").toLowerCase().trim();
    const cleanPhone = (user.phoneNumber || "").trim();

    // 1. Mark orders as userDeleted: true and unlink user reference so they never appear on the user end
    try {
      const Order = require("../../models/Order");
      const orderFilters = [];
      if (userId) orderFilters.push({ user: userId });
      if (cleanEmail) orderFilters.push({ "shippingAddress.email": cleanEmail });
      if (cleanPhone) orderFilters.push({ "shippingAddress.phoneNumber": cleanPhone });

      if (orderFilters.length > 0) {
        await Order.updateMany(
          { $or: orderFilters },
          { $set: { userDeleted: true, user: null } }
        );
      }
    } catch (orderErr) {
      console.error("Error disassociating orders on user delete:", orderErr.message);
    }

    // 2. Unlink any claimed QR codes and reset public profile data
    try {
      const QRCode = require("../../models/QRCode");
      await QRCode.updateMany(
        { linkedUser: userId },
        {
          $set: {
            status: "unlinked",
            linkedUser: null,
            linkedAt: null,
            profileData: {
              title: "",
              bio: "",
              socialLinks: {},
              avatarUrl: "",
              coverUrl: "",
              themeColor: "#000000",
              customText: "",
            },
          },
        }
      );
    } catch (qrErr) {
      console.error("Error unlinking QR codes on user delete:", qrErr.message);
    }

    // 3. Clean up user support tickets
    try {
      const SupportTicket = require("../../models/supportTicket");
      const ticketFilters = [{ user: userId }];
      if (cleanEmail) ticketFilters.push({ email: cleanEmail });
      await SupportTicket.deleteMany({ $or: ticketFilters });
    } catch (ticketErr) {
      console.error("Error deleting support tickets on user delete:", ticketErr.message);
    }

    // 4. Permanently delete user document from database
    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: "Account and all associated user data have been completely deleted.",
    });
  } catch (error) {
    console.error("Delete account error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  getCurrentUser,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  deactivateAccount,
  deleteAccount,
};

