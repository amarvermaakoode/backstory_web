"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { getImageUrl } from "@/lib/api";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  CreditCard,
  QrCode,
  Package,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  Truck,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Layers,
  Tag,
  ArrowRight,
  Eye,
  AlertCircle
} from "lucide-react";

export default function AdminDashboardPage() {
  const { adminFetch } = useAdminAuth();

  const [timeframe, setTimeframe] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [chartMetric, setChartMetric] = useState("revenue"); // "revenue" or "orders"
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const [stats, setStats] = useState({
    overview: {
      totalLifetimeRevenue: 0,
      currentRevenue: 0,
      revenueGrowth: 0,
      currentOrderCount: 0,
      ordersGrowth: 0,
      totalUsers: 0,
      currentNewUsers: 0,
      usersGrowth: 0,
      aov: 0,
      aovGrowth: 0,
      totalProducts: 0,
      activeProducts: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      openTickets: 0,
    },
    qrStats: {
      total: 0,
      unlinked: 0,
      claimed: 0,
      active: 0,
      batches: 0,
      claimedRate: 0,
    },
    orderStatusDistribution: {
      Placed: 0,
      "Order Confirmed": 0,
      "Ready to Pack & Ship": 0,
      "Dispatched & In Transit": 0,
      "Out for Delivery": 0,
      Delivered: 0,
      Cancelled: 0,
      "Return / Exchange": 0,
    },
    trendData: [],
    topProducts: [],
    categoryStats: [],
    recentOrders: [],
    lowStockAlerts: [],
  });

  const fetchDashboardStats = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const res = await adminFetch(`/dashboard/stats?timeframe=${timeframe}`);
        const data = await res.json();

        if (data.success && data.data) {
          setStats(data.data);
        } else {
          setError(data.message || "Failed to load dashboard metrics.");
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Network error while connecting to analytics server.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [adminFetch, timeframe]
  );

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Format currency in Indian Rupee format
  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-IN").format(Number(num) || 0);
  };

  // Helper for trend badge
  const renderTrendBadge = (growth) => {
    const val = Number(growth) || 0;
    const isPositive = val >= 0;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
          isPositive
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
            : "bg-rose-50 text-rose-700 border border-rose-200/60"
        }`}
      >
        {isPositive ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        {isPositive ? `+${val}%` : `${val}%`}
      </span>
    );
  };

  // Status badge styling helper
  const getStatusBadge = (status) => {
    const st = (status || "").toLowerCase();
    if (st.includes("delivered")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (st.includes("cancel")) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    if (st.includes("return") || st.includes("exchange")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    if (st.includes("dispatch") || st.includes("transit") || st.includes("ready")) {
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
    return "bg-sky-50 text-sky-700 border-sky-200";
  };

  // Render SVG Smooth Area & Line Chart
  const renderInteractiveChart = () => {
    const data = stats.trendData || [];
    if (data.length === 0) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-neutral-400 text-sm">
          <Layers className="w-8 h-8 mb-2 stroke-[1.5] text-neutral-300" />
          <p>No trend data recorded for this timeframe yet.</p>
        </div>
      );
    }

    const values = data.map((d) =>
      chartMetric === "revenue" ? d.revenue : d.orders
    );
    const maxVal = Math.max(...values, 10);
    const width = 800;
    const height = 240;
    const paddingX = 40;
    const paddingY = 30;

    const points = data.map((d, i) => {
      const x =
        paddingX +
        (i / (data.length - 1 || 1)) * (width - paddingX * 2);
      const val = chartMetric === "revenue" ? d.revenue : d.orders;
      const y =
        height -
        paddingY -
        (val / maxVal) * (height - paddingY * 2);
      return { x, y, data: d, val };
    });

    // Create SVG Path for smooth spline curve
    const pathD = points.reduce((acc, point, i, arr) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      const prev = arr[i - 1];
      const cx1 = prev.x + (point.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (point.x - prev.x) / 2;
      const cy2 = point.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${point.x} ${point.y}`;
    }, "");

    const areaD = `${pathD} L ${points[points.length - 1].x} ${
      height - paddingY
    } L ${points[0].x} ${height - paddingY} Z`;

    const totalPeriodVal = values.reduce((a, b) => a + b, 0);
    const peakVal = Math.max(...values, 0);

    return (
      <div className="relative">
        {/* Chart Header summary */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-6 text-xs text-neutral-500">
            <div>
              <span className="block font-medium text-neutral-400">
                Period Total
              </span>
              <span className="text-sm font-bold text-neutral-900">
                {chartMetric === "revenue"
                  ? formatCurrency(totalPeriodVal)
                  : `${formatNumber(totalPeriodVal)} Orders`}
              </span>
            </div>
            <div className="h-6 w-px bg-neutral-200" />
            <div>
              <span className="block font-medium text-neutral-400">
                Peak Single Day
              </span>
              <span className="text-sm font-bold text-neutral-900">
                {chartMetric === "revenue"
                  ? formatCurrency(peakVal)
                  : `${formatNumber(peakVal)} Orders`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-100/80 p-1 rounded-xl">
            <button
              onClick={() => setChartMetric("revenue")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                chartMetric === "revenue"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              Revenue (₹)
            </button>
            <button
              onClick={() => setChartMetric("orders")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                chartMetric === "orders"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              Orders (Qty)
            </button>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-56 md:h-64 overflow-visible"
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#171717" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#171717" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = height - paddingY - ratio * (height - paddingY * 2);
              const val = Math.round(ratio * maxVal);
              return (
                <g key={idx}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="10"
                    fill="#9CA3AF"
                    fontFamily="inherit"
                  >
                    {chartMetric === "revenue"
                      ? val >= 1000
                        ? `₹${(val / 1000).toFixed(0)}k`
                        : `₹${val}`
                      : val}
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            <path d={areaD} fill="url(#areaGradient)" />

            {/* Line Path */}
            <path
              d={pathD}
              fill="none"
              stroke="#171717"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Points */}
            {points.map((pt, i) => {
              const isHovered = hoveredPoint?.index === i;
              return (
                <g key={i}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5.5 : 3.5}
                    fill={isHovered ? "#171717" : "#FFFFFF"}
                    stroke="#171717"
                    strokeWidth={isHovered ? "3" : "2"}
                    className="transition-all duration-150 cursor-pointer"
                    onMouseEnter={() => setHoveredPoint({ ...pt, index: i })}
                  />
                  {/* Invisible larger hover hitbox */}
                  <rect
                    x={pt.x - 12}
                    y={0}
                    width={24}
                    height={height}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint({ ...pt, index: i })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                </g>
              );
            })}

            {/* X-axis date labels */}
            {points
              .filter(
                (_, idx) =>
                  idx %
                    (data.length > 15 ? Math.ceil(data.length / 7) : 1) ===
                    0 || idx === data.length - 1
              )
              .map((pt, idx) => (
                <text
                  key={idx}
                  x={pt.x}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6B7280"
                  fontFamily="inherit"
                >
                  {pt.data.label}
                </text>
              ))}
          </svg>
        </div>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none bg-neutral-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl border border-neutral-800 transform -translate-x-1/2 -translate-y-full transition-all duration-75"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 80 + 30}px`,
            }}
          >
            <p className="text-neutral-400 font-medium mb-1">
              {hoveredPoint.data.label}
            </p>
            <p className="font-bold text-sm text-white">
              {formatCurrency(hoveredPoint.data.revenue)}
            </p>
            <p className="text-[11px] text-neutral-300">
              {hoveredPoint.data.orders} orders ({hoveredPoint.data.units} items)
            </p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-neutral-200/80">
          <div className="h-8 bg-neutral-200 rounded-lg w-48" />
          <div className="h-10 bg-neutral-200 rounded-xl w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-36 bg-white rounded-2xl border border-neutral-200/80 p-5 space-y-4"
            >
              <div className="h-4 bg-neutral-200 rounded w-24" />
              <div className="h-8 bg-neutral-200 rounded w-36" />
            </div>
          ))}
        </div>
        <div className="h-96 bg-white rounded-2xl border border-neutral-200/80" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header & Timeframe Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Performance & Analytics
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-900 text-white">
              <Sparkles className="w-3 h-3 text-[#dfd7cc]" /> Live
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Real-time sales, order fulfillment, smart QR interactions, and catalog health.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe selector buttons */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200/60">
            {[
              { label: "7D", value: "7d" },
              { label: "30D", value: "30d" },
              { label: "90D", value: "90d" },
              { label: "1Y", value: "1y" },
              { label: "All", value: "all" },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setTimeframe(t.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  timeframe === t.value
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchDashboardStats(true)}
            disabled={refreshing}
            className="p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-neutral-200/60 disabled:opacity-50"
            title="Refresh statistics"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin text-neutral-900" : ""}`}
            />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-neutral-200/80 shadow-xs hover:border-neutral-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">
              {timeframe === "all" ? "Total Revenue" : "Period Revenue"}
            </span>
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
              <DollarSign className="w-5 h-5 text-[#dfd7cc]" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl md:text-3xl font-bold text-neutral-900">
              {formatCurrency(stats.overview.currentRevenue)}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              {renderTrendBadge(stats.overview.revenueGrowth)}
              <span className="text-xs text-neutral-400">vs prior period</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-neutral-200/80 shadow-xs hover:border-neutral-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">
              Orders Volume
            </span>
            <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-neutral-700" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl md:text-3xl font-bold text-neutral-900">
              {formatNumber(stats.overview.currentOrderCount)}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              {renderTrendBadge(stats.overview.ordersGrowth)}
              <span className="text-xs text-neutral-400">completed orders</span>
            </div>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-neutral-200/80 shadow-xs hover:border-neutral-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">
              Avg. Order Value
            </span>
            <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-neutral-700" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl md:text-3xl font-bold text-neutral-900">
              {formatCurrency(stats.overview.aov)}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              {renderTrendBadge(stats.overview.aovGrowth)}
              <span className="text-xs text-neutral-400">basket size</span>
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-neutral-200/80 shadow-xs hover:border-neutral-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">
              Customer Base
            </span>
            <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center">
              <Users className="w-5 h-5 text-neutral-700" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl md:text-3xl font-bold text-neutral-900">
              {formatNumber(stats.overview.totalUsers)}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              {renderTrendBadge(stats.overview.usersGrowth)}
              <span className="text-xs text-neutral-400">
                +{stats.overview.currentNewUsers} new users
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Main Chart Section */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">
              Sales & Order Trajectory
            </h2>
            <p className="text-xs text-neutral-500">
              Interactive revenue and order curves across selected date intervals.
            </p>
          </div>
          <div className="text-xs font-medium text-neutral-500 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-900" />
            <span>Hover on data points for exact breakdown</span>
          </div>
        </div>

        {renderInteractiveChart()}
      </div>

      {/* 3-Column Analytics Row: Category Sales + QR Ecosystem + Order Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Category Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-neutral-900">Sales by Category</h3>
                <p className="text-xs text-neutral-500">Revenue & volume distribution</p>
              </div>
              <Tag className="w-5 h-5 text-neutral-400" />
            </div>

            <div className="space-y-4 mt-6">
              {stats.categoryStats.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-8">
                  No categorical sales data available yet.
                </p>
              ) : (
                stats.categoryStats.slice(0, 5).map((cat, idx) => {
                  const totalCatRevenue = stats.categoryStats.reduce(
                    (s, c) => s + c.revenue,
                    0
                  );
                  const percentage =
                    totalCatRevenue > 0
                      ? Math.round((cat.revenue / totalCatRevenue) * 100)
                      : 0;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-800">
                          {cat.name}
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-neutral-900">
                            {formatCurrency(cat.revenue)}
                          </span>
                          <span className="text-neutral-400 ml-1.5">
                            ({cat.units} sold)
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 6)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <Link
            href="/admin/categories"
            className="mt-6 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-all"
          >
            Manage Categories <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 2. BACSTORY Smart QR Ecosystem */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-neutral-900">Smart QR Ecosystem</h3>
                <p className="text-xs text-neutral-500">Apparel storytelling activity</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[#dfd7cc]/40 flex items-center justify-center">
                <QrCode className="w-4 h-4 text-neutral-900" />
              </div>
            </div>

            <div className="mt-5 p-4 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-neutral-500">
                  Total Generated QRs
                </span>
                <p className="text-2xl font-bold text-neutral-900">
                  {formatNumber(stats.qrStats.total)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-neutral-500">
                  Claimed Rate
                </span>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.qrStats.claimedRate}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mt-4 text-center">
              <div className="p-3 bg-white border border-neutral-200/70 rounded-xl">
                <span className="text-[11px] font-medium text-neutral-400 block">
                  Active
                </span>
                <span className="text-base font-bold text-neutral-900">
                  {formatNumber(stats.qrStats.active)}
                </span>
              </div>
              <div className="p-3 bg-white border border-neutral-200/70 rounded-xl">
                <span className="text-[11px] font-medium text-neutral-400 block">
                  Claimed
                </span>
                <span className="text-base font-bold text-neutral-900">
                  {formatNumber(stats.qrStats.claimed)}
                </span>
              </div>
              <div className="p-3 bg-white border border-neutral-200/70 rounded-xl">
                <span className="text-[11px] font-medium text-neutral-400 block">
                  Unlinked
                </span>
                <span className="text-base font-bold text-neutral-900">
                  {formatNumber(stats.qrStats.unlinked)}
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/admin/qr-codes"
            className="mt-6 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-all"
          >
            Manage QR Codes <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3. Order Status Pipeline */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-neutral-900">Fulfillment Pipeline</h3>
                <p className="text-xs text-neutral-500">Live order status breakdown</p>
              </div>
              <Package className="w-5 h-5 text-neutral-400" />
            </div>

            <div className="space-y-3 mt-4">
              {Object.entries(stats.orderStatusDistribution).map(
                ([statusKey, count], i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 text-xs"
                  >
                    <span className="font-medium text-neutral-700">
                      {statusKey}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold border ${getStatusBadge(
                        statusKey
                      )}`}
                    >
                      {count}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          <Link
            href="/admin/orders"
            className="mt-6 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-all"
          >
            View All Orders <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Bottom 2-Column: Top Selling Products + Recent Orders Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Selling Products (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-neutral-900">Top Performing Products</h3>
                <p className="text-xs text-neutral-500">Best sellers by volume & revenue</p>
              </div>
              <Link
                href="/admin/products"
                className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1"
              >
                Catalog <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-neutral-100">
              {stats.topProducts.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-10">
                  No sales recorded yet.
                </p>
              ) : (
                stats.topProducts.map((p, idx) => (
                  <div
                    key={idx}
                    className="py-3 flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-5 text-center font-bold text-xs text-neutral-400">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                      </span>
                      <div className="w-11 h-11 rounded-lg bg-neutral-100 relative overflow-hidden shrink-0 border border-neutral-200/60">
                        {p.image ? (
                          <img
                            src={getImageUrl(p.image)}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <ShoppingBag className="w-5 h-5 text-neutral-400 m-auto mt-3" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-900 truncate">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-neutral-500 truncate">
                          {p.category} • {formatCurrency(p.price)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-neutral-900">
                        {formatCurrency(p.revenue)}
                      </p>
                      <p className="text-[11px] text-neutral-500 font-medium">
                        {p.unitsSold} sold
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {stats.lowStockAlerts.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>{stats.lowStockAlerts.length} item(s)</strong> low or out of stock
                </span>
              </div>
              <Link
                href="/admin/products"
                className="font-bold underline hover:text-amber-950"
              >
                Review
              </Link>
            </div>
          )}
        </div>

        {/* Recent Orders Live Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-neutral-900">Recent Customer Orders</h3>
                <p className="text-xs text-neutral-500">Live incoming purchase feed</p>
              </div>
              <Link
                href="/admin/orders"
                className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1"
              >
                All Orders <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    <th className="pb-3 pl-1">Order</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Items</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-1">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {stats.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-neutral-400">
                        No orders recorded yet.
                      </td>
                    </tr>
                  ) : (
                    stats.recentOrders.map((ord) => (
                      <tr key={ord._id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-3 pl-1 font-bold text-neutral-900">
                          {ord.orderId}
                        </td>
                        <td className="py-3">
                          <p className="font-medium text-neutral-800 truncate max-w-[130px]">
                            {ord.customerName}
                          </p>
                          <p className="text-[11px] text-neutral-400 truncate max-w-[130px]">
                            {ord.customerEmail || "Prepaid Checkout"}
                          </p>
                        </td>
                        <td className="py-3 text-neutral-600">
                          {ord.itemsCount} item{ord.itemsCount > 1 ? "s" : ""}
                        </td>
                        <td className="py-3 font-bold text-neutral-900">
                          {formatCurrency(ord.totalAmount)}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                              ord.orderStatus
                            )}`}
                          >
                            {ord.orderStatus}
                          </span>
                        </td>
                        <td className="py-3 text-right pr-1">
                          <Link
                            href={`/admin/orders?search=${ord.orderId}`}
                            className="p-1.5 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 rounded-lg inline-flex items-center"
                            title="View order details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 mt-4 flex items-center justify-between text-xs text-neutral-500">
            <span>
              Showing latest {stats.recentOrders.length} processed transactions
            </span>
            <Link
              href="/admin/orders"
              className="font-semibold text-neutral-900 hover:underline flex items-center gap-1"
            >
              Go to Order Manager <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
