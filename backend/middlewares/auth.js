const User = require("../models/user");
const { verifyToken } = require("../config/jwt");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = verifyToken(token);

      // Get user from the database, excluding the password field
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authorized, user not found", accountDeleted: true });
      }

      if (req.user.isDeactivated) {
        return res.status(401).json({ success: false, message: "Account has been deactivated or deleted", accountDeleted: true });
      }

      next();
    } catch (error) {
      console.error("Auth middleware error:", error.message);
      return res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Not authorized as an admin" });
  }
};

const userOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return res.status(403).json({
      success: false,
      isAdminAccount: true,
      message: "Admin accounts are not authorized to access customer services",
    });
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = verifyToken(token);
      req.user = await User.findById(decoded.id).select("-password");
    } catch (error) {
      console.error("Optional auth error:", error.message);
    }
  }
  next();
};

module.exports = { protect, adminOnly, userOnly, optionalAuth };

