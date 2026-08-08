const User = require("../models/user");
const Order = require("../models/Order");

// Helper function to auto-sync user's wallet balance and transactions from all refunded orders
const syncUserWalletBalance = async (userId, userEmail, userPhone) => {
  try {
    const cleanEmail = userEmail ? userEmail.toLowerCase().trim() : null;
    const cleanPhone = userPhone ? userPhone.trim() : null;

    const orderConditions = [];
    if (userId) orderConditions.push({ user: userId });
    if (cleanEmail) orderConditions.push({ "shippingAddress.email": cleanEmail });
    if (cleanPhone) orderConditions.push({ "shippingAddress.phoneNumber": cleanPhone });

    if (orderConditions.length === 0) return 0;

    // Find all matching orders for this user
    const userOrders = await Order.find({ $or: orderConditions });

    let totalWalletRefunds = 0;
    let totalWalletDebits = 0;
    const walletTxns = [];

    userOrders.forEach((ord) => {
      const isRefunded =
        ord.returnExchange?.status === "Refunded" ||
        ord.refundDetails?.refundStatus === "Refunded" ||
        ord.paymentStatus === "Refunded";

      const method = (ord.refundDetails?.refundMethod || ord.returnExchange?.refundMethod || "").toLowerCase();
      const originalWasWallet = (ord.paymentMethod || "").toLowerCase().includes("wallet") || (ord.walletDeduction && ord.walletDeduction > 0);
      const isWalletRefund = method.includes("wallet") || (method.includes("original") && originalWasWallet) || (method === "" && originalWasWallet);

      if (isRefunded && isWalletRefund) {
        const returnFee = typeof ord.returnExchange?.returnShippingFee === "number" ? ord.returnExchange.returnShippingFee : 0;
        const totalAmount = ord.totalAmount || ord.orderTotal || 0;
        const amt = (typeof ord.refundDetails?.refundAmount === "number" && ord.refundDetails.refundAmount > 0)
          ? ord.refundDetails.refundAmount
          : Math.max(0, totalAmount - returnFee);

        if (amt > 0) {
          totalWalletRefunds += amt;
          walletTxns.push({
            type: "credit",
            amount: amt,
            description: `Refund credited for Order #${ord.orderId}`,
            orderId: ord.orderId,
            createdAt: ord.refundDetails?.updatedAt || ord.updatedAt || new Date()
          });
        }
      }

      // Check Wallet Deductions (Purchases)
      const isCancelled = ord.orderStatus === "Cancelled" || ord.cancellation?.isCancelled;
      if (!isCancelled) {
        if (typeof ord.walletDeduction === "number" && ord.walletDeduction > 0) {
          totalWalletDebits += ord.walletDeduction;
          walletTxns.push({
            type: "debit",
            amount: ord.walletDeduction,
            description: `Payment for Order #${ord.orderId}`,
            orderId: ord.orderId,
            createdAt: ord.createdAt || new Date()
          });
        } else if ((ord.paymentMethod || "").toLowerCase().includes("wallet")) {
          const debitAmt = ord.totalAmount || 0;
          if (debitAmt > 0) {
            totalWalletDebits += debitAmt;
            walletTxns.push({
              type: "debit",
              amount: debitAmt,
              description: `Payment for Order #${ord.orderId}`,
              orderId: ord.orderId,
              createdAt: ord.createdAt || new Date()
            });
          }
        }
      }
    });

    const netWalletBalance = Math.max(0, totalWalletRefunds - totalWalletDebits);

    // Build correct User query
    const userConditions = [];
    if (userId) userConditions.push({ _id: userId });
    if (cleanEmail) userConditions.push({ email: cleanEmail });
    if (cleanPhone) userConditions.push({ phoneNumber: cleanPhone });

    if (userConditions.length > 0) {
      const userObj = await User.findOne({ $or: userConditions });
      if (userObj) {
        userObj.walletBalance = netWalletBalance;
        if (walletTxns.length > 0) {
          userObj.walletTransactions = walletTxns;
        }
        await userObj.save();
        return netWalletBalance;
      }
    }
    return 0;
  } catch (err) {
    console.error("Error in syncUserWalletBalance:", err);
    return 0;
  }
};

module.exports = {
  syncUserWalletBalance
};
