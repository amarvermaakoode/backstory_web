const User = require("../../models/user");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../../config/jwt");

// Admin Login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request body
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    // Find the user by email
    const user = await User.findOne({ email });

    // Check if user exists and is an admin
    if (!user || user.role !== "admin") {
      return res.status(401).json({ message: "Invalid credentials or unauthorized" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = generateToken({ id: user._id, role: user.role });

    res.status(200).json({
      success: true,
      token,
      admin: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error.message);
    res.status(500).json({ message: "Server error during admin login" });
  }
};

// Admin Logoutz
const logoutAdmin = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Admin logged out successfully. Please clear the token from client-side storage.",
    });
  } catch (error) {
    console.error("Admin logout error:", error.message);
    res.status(500).json({ message: "Server error during admin logout" });
  }
};

module.exports = {
  loginAdmin,
  logoutAdmin,
};
