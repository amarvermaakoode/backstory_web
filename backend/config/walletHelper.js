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

    // Find all matching orders for this user (excluding orders from deleted accounts)
    const userOrders = await Order.find({ $or: orderConditions, userDeleted: { $ne: true } });

    let totalWalletRefunds = 0;
    let totalWalletDebits = 0;
    const walletTxns = [];

    userOrders.forEach((ord) => {
      const isRefunded =
        ord.returnExchange?.status === "Refunded" ||
        ord.refundDetails?.refundStatus === "Refunded" ||
        ord.paymentStatus === "Refunded" ||
        ord.refundDetails?.refundStatus === "Refund Processing" ||
        ord.paymentStatus === "Refund Processing" ||
        ord.returnExchange?.status === "Refund Initiated" ||
        (Array.isArray(ord.returnRequestsHistory) &&
          ord.returnRequestsHistory.some(r => (r.status === "Refunded" || r.status === "Refund Initiated") && (r.walletRefundAmount > 0 || (r.refundMethod || "").toLowerCase().includes("wallet"))));

      const method = (ord.refundDetails?.refundMethod || ord.returnExchange?.refundMethod || "").toLowerCase();
      const originalWasWallet = (ord.paymentMethod || "").toLowerCase().includes("wallet") || (ord.walletDeduction && ord.walletDeduction > 0);
      const isWalletRefund = method.includes("wallet") || (method.includes("original") && originalWasWallet) || (method === "" && originalWasWallet);

      if (isRefunded) {
        let orderWalletRefund = 0;
        let isSplit = false;

        // 1. Check if explicit walletRefundAmount is saved on refundDetails
        if (typeof ord.refundDetails?.walletRefundAmount === "number" && ord.refundDetails.walletRefundAmount >= 0) {
          orderWalletRefund = ord.refundDetails.walletRefundAmount;
          if (typeof ord.refundDetails?.razorpayRefundAmount === "number" && ord.refundDetails.razorpayRefundAmount > 0) {
            isSplit = true;
          }
        } else if (Array.isArray(ord.returnRequestsHistory) && ord.returnRequestsHistory.length > 0 && ord.returnRequestsHistory.some(r => r.status === "Refunded" && typeof r.walletRefundAmount === "number")) {
          // 2. Check if saved in returnRequestsHistory
          ord.returnRequestsHistory.forEach(r => {
            if (r.status === "Refunded" && typeof r.walletRefundAmount === "number") {
              orderWalletRefund += r.walletRefundAmount;
              if (r.razorpayRefundAmount > 0) isSplit = true;
            }
          });
        } else {
          // 3. Fallback: dynamically calculate based on method and payment breakdown
          const method = (ord.refundDetails?.refundMethod || ord.returnExchange?.refundMethod || "").toLowerCase();
          const isExplicitWallet = (method.includes("wallet") || method.includes("store credit")) && !method.includes("original");
          const originalWasWallet = (ord.paymentMethod || "").toLowerCase().includes("wallet") || (ord.walletDeduction && ord.walletDeduction > 0);
          const isWalletRefund = isExplicitWallet || method.includes("wallet") || (method.includes("original") && originalWasWallet) || (method === "" && originalWasWallet);

          if (isWalletRefund) {
            const returnFee = typeof ord.returnExchange?.returnShippingFee === "number" ? ord.returnExchange.returnShippingFee : 0;
            const totalAmount = ord.totalAmount || ord.orderTotal || 0;
            const refundAmt = (typeof ord.refundDetails?.refundAmount === "number" && ord.refundDetails.refundAmount > 0)
              ? ord.refundDetails.refundAmount
              : Math.max(0, totalAmount - returnFee);

            if (isExplicitWallet) {
              orderWalletRefund = refundAmt;
            } else {
              // Customer chose "Original Payment Method"
              const orderWalletDeduction = typeof ord.walletDeduction === "number"
                ? ord.walletDeduction
                : (parseFloat(String(ord.walletDeduction || 0).replace(/[^0-9.]/g, "")) || 0);
              const orderRazorpayPaid = Math.max(0, totalAmount - orderWalletDeduction);

              if (orderWalletDeduction > 0 && orderRazorpayPaid > 0 && totalAmount > 0) {
                // Split payment order: only the wallet portion is refunded to wallet
                isSplit = true;
                orderWalletRefund = Math.round(Math.min(orderWalletDeduction, refundAmt * (orderWalletDeduction / totalAmount)) * 100) / 100;
              } else if (orderWalletDeduction > 0 && orderRazorpayPaid <= 0) {
                // 100% wallet payment
                orderWalletRefund = refundAmt;
              } else {
                // 100% online/razorpay payment -> 0 to wallet
                orderWalletRefund = 0;
              }
            }
          }
        }

        if (orderWalletRefund > 0) {
          totalWalletRefunds += orderWalletRefund;
          walletTxns.push({
            type: "credit",
            amount: orderWalletRefund,
            description: `Refund credited for Order #${ord.orderId}${isSplit ? ` (Wallet portion: ₹${orderWalletRefund.toLocaleString()})` : ""}`,
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
        const updateData = { walletBalance: netWalletBalance };
        if (walletTxns.length > 0) {
          updateData.walletTransactions = walletTxns;
        }
        await User.findByIdAndUpdate(userObj._id, { $set: updateData });
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
