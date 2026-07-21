const User = require("../../models/user");
const Otp = require("../../models/otp");
const { generateToken } = require("../../config/jwt");

// Send OTP
const sendOtp = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Please provide either email or phone number",
      });
    }

    // Generate a mock 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Clean up any existing OTPs for this email/phone number
    const query = {};
    if (email) query.email = email.toLowerCase().trim();
    if (phoneNumber) query.phoneNumber = phoneNumber.trim();

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
    const { email, phoneNumber, otp } = req.body;

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

    let isNewUser = false;

    if (!user) {
      // User doesn't exist, create a new user (Signup)
      isNewUser = true;

      let name = "";
      if (formattedEmail) {
        name = formattedEmail.split("@")[0];
      } else if (formattedPhone) {
        name = "User_" + formattedPhone.slice(-4);
      }

      user = await User.create({
        name,
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
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
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
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  getCurrentUser,
};
