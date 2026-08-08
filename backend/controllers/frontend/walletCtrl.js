const User = require("../../models/user");
const { syncUserWalletBalance } = require("../../config/walletHelper");

// Get user wallet details (balance & transaction history)
const getWalletDetails = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    let user = await User.findById(userId).select("email phoneNumber walletBalance walletTransactions");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Auto-sync wallet balance from refunded wallet orders
    await syncUserWalletBalance(user._id, user.email, user.phoneNumber);

    user = await User.findById(userId).select("walletBalance walletTransactions");

    return res.status(200).json({
      success: true,
      walletBalance: user.walletBalance || 0,
      walletTransactions: user.walletTransactions || []
    });
  } catch (error) {
    console.error("Error fetching user wallet details:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch wallet details" });
  }
};

module.exports = {
  getWalletDetails
};
