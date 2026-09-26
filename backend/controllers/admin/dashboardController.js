const mongoose = require("mongoose");
const Order = require("../../models/Order");
const Product = require("../../models/product");
const QRCode = require("../../models/QRCode");
const QRCodeBatch = require("../../models/QRCodeBatch");
const User = require("../../models/user");
const Category = require("../../models/category");
const SupportTicket = require("../../models/supportTicket");

/**
 * Helper to calculate percentage growth
 */
const calculateGrowth = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

/**
 * GET /api/admin/dashboard/stats
 * Query params: timeframe (7d, 30d, 90d, 1y, all) - default 30d
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const timeframe = req.query.timeframe || "30d";
    const now = new Date();
    let startDate = new Date();
    let prevStartDate = new Date();
    let prevEndDate = new Date();

    if (timeframe === "7d") {
      startDate.setDate(now.getDate() - 7);
      prevStartDate.setDate(now.getDate() - 14);
      prevEndDate.setDate(now.getDate() - 7);
    } else if (timeframe === "90d") {
      startDate.setDate(now.getDate() - 90);
      prevStartDate.setDate(now.getDate() - 180);
      prevEndDate.setDate(now.getDate() - 90);
    } else if (timeframe === "1y") {
      startDate.setFullYear(now.getFullYear() - 1);
      prevStartDate.setFullYear(now.getFullYear() - 2);
      prevEndDate.setFullYear(now.getFullYear() - 1);
    } else if (timeframe === "all") {
      startDate = new Date(0); // Beginning of epoch
      prevStartDate = new Date(0);
      prevEndDate = new Date(0);
    } else {
      // Default 30d
      startDate.setDate(now.getDate() - 30);
      prevStartDate.setDate(now.getDate() - 60);
      prevEndDate.setDate(now.getDate() - 30);
    }

    // 1. Fetch Orders within current & previous timeframe
    const validOrderFilter = {
      orderStatus: { $ne: "Cancelled" },
    };

    // Current period orders
    const currentOrders = await Order.find({
      ...validOrderFilter,
      createdAt: { $gte: startDate, $lte: now },
    }).lean();

    // Previous period orders (for growth comparison)
    const prevOrders = await Order.find({
      ...validOrderFilter,
      createdAt: { $gte: prevStartDate, $lt: prevEndDate },
    }).lean();

    // All orders (for lifetime stats & recent feeds)
    const allOrders = await Order.find().sort({ createdAt: -1 }).lean();

    // 2. Financial Metrics
    const totalLifetimeRevenue = allOrders
      .filter((o) => o.orderStatus !== "Cancelled")
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    const currentRevenue = currentOrders.reduce(
      (sum, o) => sum + (Number(o.totalAmount) || 0),
      0
    );
    const prevRevenue = prevOrders.reduce(
      (sum, o) => sum + (Number(o.totalAmount) || 0),
      0
    );
    const revenueGrowth = calculateGrowth(currentRevenue, prevRevenue);

    const currentOrderCount = currentOrders.length;
    const prevOrderCount = prevOrders.length;
    const ordersGrowth = calculateGrowth(currentOrderCount, prevOrderCount);

    const aov =
      currentOrderCount > 0 ? Math.round(currentRevenue / currentOrderCount) : 0;
    const prevAov =
      prevOrderCount > 0 ? Math.round(prevRevenue / prevOrderCount) : 0;
    const aovGrowth = calculateGrowth(aov, prevAov);

    // 3. User & Customer Stats
    const totalUsers = await User.countDocuments({ role: "user" });
    const currentNewUsers = await User.countDocuments({
      role: "user",
      createdAt: { $gte: startDate, $lte: now },
    });
    const prevNewUsers = await User.countDocuments({
      role: "user",
      createdAt: { $gte: prevStartDate, $lt: prevEndDate },
    });
    const usersGrowth = calculateGrowth(currentNewUsers, prevNewUsers);

    // 4. Products & Inventory Stats
    const products = await Product.find()
      .populate("category", "Name slug")
      .populate("collection", "title slug")
      .lean();

    let totalProducts = products.length;
    let activeProducts = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const lowStockAlerts = [];

    products.forEach((p) => {
      if (p.status) activeProducts++;

      // Compute total stock from variantStock or direct fields
      let totalStock = 0;
      let hasVariants = false;

      if (p.variantStock && typeof p.variantStock === "object") {
        Object.values(p.variantStock).forEach((val) => {
          if (typeof val === "object" && val !== null) {
            Object.values(val).forEach((stockNum) => {
              const num = Number(stockNum) || 0;
              totalStock += num;
              hasVariants = true;
            });
          } else {
            const num = Number(val) || 0;
            totalStock += num;
            hasVariants = true;
          }
        });
      }

      const effectiveStock = hasVariants ? totalStock : 0;

      if (effectiveStock === 0 && hasVariants) {
        outOfStockCount++;
        lowStockAlerts.push({
          id: p._id,
          title: p.title,
          slug: p.slug,
          stock: effectiveStock,
          image: p.colors?.[0]?.images?.[0] || "",
          category: p.category?.Name || "Apparel",
          status: "Out of Stock",
        });
      } else if (effectiveStock > 0 && effectiveStock <= 5) {
        lowStockCount++;
        lowStockAlerts.push({
          id: p._id,
          title: p.title,
          slug: p.slug,
          stock: effectiveStock,
          image: p.colors?.[0]?.images?.[0] || "",
          category: p.category?.Name || "Apparel",
          status: "Low Stock",
        });
      }
    });

    // 5. QR Code Ecosystem Stats
    const totalQRCodes = await QRCode.countDocuments();
    const unlinkedQRCodes = await QRCode.countDocuments({ status: "unlinked" });
    const claimedQRCodes = await QRCode.countDocuments({ status: "claimed" });
    const activeQRCodes = await QRCode.countDocuments({ status: "active" });
    const totalBatches = await QRCodeBatch.countDocuments();

    // 6. Support Tickets
    const openTickets = await SupportTicket.countDocuments({
      status: { $in: ["Open", "In Progress"] },
    });

    // 7. Order Status Distribution Breakdown
    const statusCounts = {
      Placed: 0,
      "Order Confirmed": 0,
      "Ready to Pack & Ship": 0,
      "Dispatched & In Transit": 0,
      "Out for Delivery": 0,
      Delivered: 0,
      Cancelled: 0,
      "Return / Exchange": 0,
    };

    allOrders.forEach((ord) => {
      const st = ord.orderStatus || "Placed";
      if (
        st.includes("Return") ||
        st.includes("Exchange") ||
        ord.returnExchange?.isRequested
      ) {
        statusCounts["Return / Exchange"]++;
      } else if (statusCounts[st] !== undefined) {
        statusCounts[st]++;
      } else {
        statusCounts["Placed"]++;
      }
    });

    // 8. Time-series trend chart data
    const trendMap = {};

    if (timeframe === "7d" || timeframe === "30d") {
      const daysCount = timeframe === "7d" ? 7 : 30;
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const key = d.toISOString().split("T")[0]; // YYYY-MM-DD
        const label = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        trendMap[key] = { key, label, revenue: 0, orders: 0, units: 0 };
      }

      currentOrders.forEach((ord) => {
        const dStr = new Date(ord.createdAt).toISOString().split("T")[0];
        if (trendMap[dStr]) {
          const amt = Number(ord.totalAmount) || 0;
          const units = (ord.items || []).reduce(
            (s, item) => s + (Number(item.quantity) || 1),
            0
          );
          trendMap[dStr].revenue += amt;
          trendMap[dStr].orders += 1;
          trendMap[dStr].units += units;
        }
      });
    } else {
      const months = 12;
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("en-US", {
          month: "short",
          year: timeframe === "all" ? "2-digit" : undefined,
        });
        trendMap[key] = { key, label, revenue: 0, orders: 0, units: 0 };
      }

      currentOrders.forEach((ord) => {
        const d = new Date(ord.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (trendMap[key]) {
          const amt = Number(ord.totalAmount) || 0;
          const units = (ord.items || []).reduce(
            (s, item) => s + (Number(item.quantity) || 1),
            0
          );
          trendMap[key].revenue += amt;
          trendMap[key].orders += 1;
          trendMap[key].units += units;
        }
      });
    }

    const trendData = Object.values(trendMap);

    // 9. Top Selling Products
    const productSalesMap = {};

    allOrders.forEach((ord) => {
      if (ord.orderStatus === "Cancelled") return;
      (ord.items || []).forEach((item) => {
        const pId = item.product ? item.product.toString() : item.name;
        if (!productSalesMap[pId]) {
          productSalesMap[pId] = {
            id: pId,
            name: item.name,
            image: item.image || "",
            price: Number(item.priceNum) || Number(item.price) || 0,
            unitsSold: 0,
            revenue: 0,
            category: item.category || "Apparel",
          };
        }
        const qty = Number(item.quantity) || 1;
        const price =
          Number(item.priceNum) || Number(item.price) || productSalesMap[pId].price;
        productSalesMap[pId].unitsSold += qty;
        productSalesMap[pId].revenue += qty * price;
      });
    });

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue)
      .slice(0, 5);

    // 10. Category Breakdown
    const categorySalesMap = {};
    allOrders.forEach((ord) => {
      if (ord.orderStatus === "Cancelled") return;
      (ord.items || []).forEach((item) => {
        const catName = item.category || "T-Shirts";
        if (!categorySalesMap[catName]) {
          categorySalesMap[catName] = {
            name: catName,
            units: 0,
            revenue: 0,
          };
        }
        const qty = Number(item.quantity) || 1;
        const price = Number(item.priceNum) || Number(item.price) || 0;
        categorySalesMap[catName].units += qty;
        categorySalesMap[catName].revenue += qty * price;
      });
    });

    const categoryStats = Object.values(categorySalesMap).sort(
      (a, b) => b.revenue - a.revenue
    );

    // 11. Recent Orders (Latest 6)
    const recentOrders = allOrders.slice(0, 6).map((ord) => ({
      _id: ord._id,
      orderId: ord.orderId,
      customerName:
        `${ord.shippingAddress?.firstName || ""} ${ord.shippingAddress?.lastName || ""}`.trim() ||
        "Guest Customer",
      customerEmail: ord.shippingAddress?.email || "",
      itemsCount: (ord.items || []).reduce(
        (sum, item) => sum + (Number(item.quantity) || 1),
        0
      ),
      firstItemName: ord.items?.[0]?.name || "Order Item",
      firstItemImage: ord.items?.[0]?.image || "",
      totalAmount: ord.totalAmount,
      orderStatus: ord.orderStatus,
      paymentStatus: ord.paymentStatus,
      paymentMethod: ord.paymentMethod,
      createdAt: ord.createdAt,
    }));

    // Response structure
    return res.status(200).json({
      success: true,
      data: {
        timeframe,
        overview: {
          totalLifetimeRevenue,
          currentRevenue,
          revenueGrowth,
          currentOrderCount,
          ordersGrowth,
          totalUsers,
          currentNewUsers,
          usersGrowth,
          aov,
          aovGrowth,
          totalProducts,
          activeProducts,
          lowStockCount,
          outOfStockCount,
          openTickets,
        },
        qrStats: {
          total: totalQRCodes,
          unlinked: unlinkedQRCodes,
          claimed: claimedQRCodes,
          active: activeQRCodes,
          batches: totalBatches,
          claimedRate:
            totalQRCodes > 0
              ? Math.round(((claimedQRCodes + activeQRCodes) / totalQRCodes) * 100)
              : 0,
        },
        orderStatusDistribution: statusCounts,
        trendData,
        topProducts,
        categoryStats,
        recentOrders,
        lowStockAlerts: lowStockAlerts.slice(0, 5),
      },
    });
  } catch (error) {
    console.error("Error generating admin dashboard stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};
