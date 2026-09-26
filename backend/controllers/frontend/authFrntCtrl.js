const User = require("../../models/user");
const Otp = require("../../models/otp");
const { generateToken } = require("../../config/jwt");

// Send OTP
const sendOtp = async (req, res) => {
  try {
    const { email, phoneNumber, type, mode } = req.body;
    const authType = type || mode; // "login" | "signup"

    if (!email && !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Please provide either email or phone number",
      });
    }

    const formattedEmail = email ? email.toLowerCase().trim() : undefined;
    const formattedPhone = phoneNumber ? phoneNumber.trim() : undefined;

    // Check existing user for login / signup validation
    let existingUser = null;
    if (formattedEmail) {
      existingUser = await User.findOne({ email: formattedEmail });
    } else if (formattedPhone) {
      existingUser = await User.findOne({ phoneNumber: formattedPhone });
    }

    if (authType === "login") {
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          accountNotFound: true,
          message: formattedPhone
            ? "This account doesn't exist. Please sign up."
            : "This account doesn't exist. Please sign up.",
        });
      }
      if (existingUser.isDeactivated) {
        return res.status(403).json({
          success: false,
          isDeactivated: true,
          message: "Your account is deactivated. Please contact support.",
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

    // Generate a mock 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Clean up any existing OTPs for this email/phone number
    const query = {};
    if (formattedEmail) query.email = formattedEmail;
    if (formattedPhone) query.phoneNumber = formattedPhone;

    await Otp.deleteMany(query);

    // Save new OTP
    await Otp.create({
      ...query,
      otp,
    });

    // In a production app, we would send the OTP via SMS or Email here.
    // For now, we return it in the response as requested.
    return res.status(200).json({
      success: true,
      message: `Mock OTP sent successfully to ${email || phoneNumber}.`,
      mockOtp: otp,
    });
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
        message: "Please provide either email or phone number",
      });
    }

    const formattedEmail = email ? email.toLowerCase().trim() : undefined;
    const formattedPhone = phoneNumber ? phoneNumber.trim() : undefined;

    // Check if verification code is valid
    let isValid = false;

    // Support static universal mock OTP for testing
    if (otp === "123456") {
      isValid = true;
    } else {
      const query = { otp };
      if (formattedEmail) query.email = formattedEmail;
      if (formattedPhone) query.phoneNumber = formattedPhone;

      const otpRecord = await Otp.findOne(query);
      if (otpRecord) {
        isValid = true;
        // Delete OTP after successful verification to prevent reuse
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

    if (authType === "login") {
      if (!user) {
        return res.status(404).json({
          success: false,
          accountNotFound: true,
          message: "This account doesn't exist. Please sign up first.",
        });
      }
      if (user.isDeactivated) {
        return res.status(403).json({
          success: false,
          isDeactivated: true,
          message: "Your account is deactivated. Please contact support.",
        });
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

      user = await User.create({
        email: formattedEmail,
        phoneNumber: formattedPhone,
        role: "user",
      });
    }

    // Generate JWT
    const token = generateToken({ id: user._id, role: user.role });

    return res.status(200).json({
      success: true,
      message: isNewUser ? "User registered and logged in successfully" : "Logged in successfully",
      isNewUser,
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
        isDeactivated: user.isDeactivated || false,
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
    if (!user || user.isDeactivated) {
      return res.status(401).json({ success: false, message: "User not found or account deactivated", accountDeleted: true });
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

// Delete account
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id || req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
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

