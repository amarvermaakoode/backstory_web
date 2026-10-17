"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  QrCode,
  Plus,
  Download,
  Trash2,
  Eye,
  Loader,
  X,
  Check,
  AlertTriangle,
  Search,
  ExternalLink,
  Copy,
  Layers,
  CheckCircle2,
  Clock,
  Shirt,
  RefreshCw,
  Ticket,
  Palette,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import CustomSelect from "@/components/ui/CustomSelect";
import CustomConfirmModal from "@/components/ui/CustomConfirmModal";
import AdminPagination from "@/components/ui/AdminPagination";
import QRCodeCard from "@/components/qr/QRCodeCard";
import { QR_COLOR_PRESETS, checkQRContrast } from "@/lib/qrColorThemes";

export default function QRCodesAdminPage() {
  const { adminFetch } = useAdminAuth();

  const [activeTab, setActiveTab] = useState("batches"); // "batches" or "qrcodes"
  const [batches, setBatches] = useState([]);
  const [qrCodes, setQrCodes] = useState([]);
  const [previewQR, setPreviewQR] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [pdfLoadingBatchId, setPdfLoadingBatchId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Pagination state
  const [batchesPage, setBatchesPage] = useState(1);
  const [qrsPage, setQrsPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const totalBatchesPages = Math.ceil(batches.length / ITEMS_PER_PAGE);
  const activeBatchesPage = batchesPage > totalBatchesPages && totalBatchesPages > 0 ? totalBatchesPages : batchesPage;
  const paginatedBatches = batches.slice((activeBatchesPage - 1) * ITEMS_PER_PAGE, activeBatchesPage * ITEMS_PER_PAGE);

  const totalQrsPages = Math.ceil(qrCodes.length / ITEMS_PER_PAGE);
  const activeQrsPage = qrsPage > totalQrsPages && totalQrsPages > 0 ? totalQrsPages : qrsPage;
  const paginatedQRs = qrCodes.slice((activeQrsPage - 1) * ITEMS_PER_PAGE, activeQrsPage * ITEMS_PER_PAGE);

  // Custom Popup Modal State
  const [popupModal, setPopupModal] = useState(null);

  const customConfirm = (message, title = "Confirm Action", confirmText = "Confirm", isDanger = false) => {
    return new Promise((resolve) => {
      setPopupModal({
        type: "confirm",
        title,
        message,
        confirmText,
        cancelText: "Cancel",
        isDanger,
        onConfirm: () => {
          setPopupModal(null);
          resolve(true);
        },
        onCancel: () => {
          setPopupModal(null);
          resolve(false);
        }
      });
    });
  };

  // Filters for QR Codes tab
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Claim Codes State
  const [claimCodes, setClaimCodes] = useState([]);
  const [claimCodesPage, setClaimCodesPage] = useState(1);
  const [claimCodeTypeFilter, setClaimCodeTypeFilter] = useState("all");
  const [claimCodeStatusFilter, setClaimCodeStatusFilter] = useState("all");
  const [isGenerateClaimModalOpen, setIsGenerateClaimModalOpen] = useState(false);
  const [claimTypeInput, setClaimTypeInput] = useState("MARKETING");
  const [claimQuantityInput, setClaimQuantityInput] = useState("1");
  const [claimExpiryInput, setClaimExpiryInput] = useState("");
  const [claimNoteInput, setClaimNoteInput] = useState("");

  const totalClaimPages = Math.ceil(claimCodes.length / ITEMS_PER_PAGE);
  const activeClaimPage = claimCodesPage > totalClaimPages && totalClaimPages > 0 ? totalClaimPages : claimCodesPage;
  const paginatedClaimCodes = claimCodes.slice((activeClaimPage - 1) * ITEMS_PER_PAGE, activeClaimPage * ITEMS_PER_PAGE);

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedBatchQRs, setSelectedBatchQRs] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form State for Batch Generation
  const [batchName, setBatchName] = useState("");
  const [prefix, setPrefix] = useState("BAC");
  const [quantity, setQuantity] = useState("50");
  const [darkColor, setDarkColor] = useState("#000000");
  const [lightColor, setLightColor] = useState("#FFFFFF");
  const [selectedPresetId, setSelectedPresetId] = useState("classic-obsidian");

  // Real-time optical contrast analysis
  const contrastAnalysis = checkQRContrast(darkColor, lightColor);

  // Copy state
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    if (activeTab === "batches") {
      fetchBatches();
    } else if (activeTab === "qrcodes") {
      fetchAllQRCodes();
    } else if (activeTab === "claimCodes") {
      fetchClaimCodes();
    }
  }, [activeTab, statusFilter, claimCodeTypeFilter, claimCodeStatusFilter]);

  async function fetchClaimCodes() {
    try {
      setLoading(true);
      setError("");
      let url = `/claim-codes?page=1&limit=100`;
      if (claimCodeTypeFilter !== "all") {
        url += `&type=${claimCodeTypeFilter}`;
      }
      if (claimCodeStatusFilter !== "all") {
        url += `&status=${claimCodeStatusFilter}`;
      }

      const res = await adminFetch(url);
      const data = await res.json();
      if (data.success) {
        setClaimCodes(data.claimCodes || []);
      } else {
        setError(data.message || "Failed to load claim codes");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch claim codes.");
    } finally {
      setLoading(false);
    }
  }

  const handleGenerateClaimCodes = async (e) => {
    e.preventDefault();
    try {
      setSubmitLoading(true);
      setError("");
      setSuccess("");
      const res = await adminFetch("/claim-codes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: claimTypeInput,
          quantity: parseInt(claimQuantityInput, 10) || 1,
          expiresAt: claimExpiryInput || null,
          note: claimNoteInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        setIsGenerateClaimModalOpen(false);
        setClaimTypeInput("MARKETING");
        setClaimQuantityInput("1");
        setClaimExpiryInput("");
        setClaimNoteInput("");
        fetchClaimCodes();
      } else {
        setError(data.message || "Failed to generate claim codes");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate claim codes.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRevokeClaimCode = async (id, codeStr) => {
    const confirmed = await customConfirm(
      `Are you sure you want to revoke claim code '${codeStr}'? It will no longer be usable.`,
      "Revoke Claim Code",
      "Revoke Code",
      true
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      const res = await adminFetch(`/claim-codes/${id}/revoke`, {
        method: "PUT",
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        fetchClaimCodes();
      } else {
        setError(data.message || "Failed to revoke claim code");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to revoke claim code.");
    } finally {
      setLoading(false);
    }
  };

  async function fetchBatches() {
    try {
      setLoading(true);
      setError("");
      const res = await adminFetch("/qr-codes/batches");
      const data = await res.json();
      if (data.success) {
        setBatches(data.batches || []);
      } else {
        setError(data.message || "Failed to load QR batches");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch batches. Please check server connection.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllQRCodes() {
    try {
      setLoading(true);
      setError("");
      let url = `/qr-codes?page=1&limit=100`;
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await adminFetch(url);
      const data = await res.json();
      if (data.success) {
        setQrCodes(data.qrCodes || []);
      } else {
        setError(data.message || "Failed to load QR codes");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch QR codes.");
    } finally {
      setLoading(false);
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (activeTab === "qrcodes") {
      fetchAllQRCodes();
    }
  };

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!batchName.trim()) {
      setError("Batch name is required");
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1 || qty > 1000) {
      setError("Quantity must be between 1 and 1000");
      return;
    }

    try {
      setSubmitLoading(true);
      const res = await adminFetch("/qr-codes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchName: batchName.trim(),
          prefix: prefix.trim().toUpperCase() || "BAC",
          quantity: qty,
          darkColor: darkColor.trim(),
          lightColor: lightColor.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(data.message || "QR Batch generated successfully!");
        setIsGenerateModalOpen(false);
        setBatchName("");
        setPrefix("BAC");
        setQuantity("50");
        setDarkColor("#000000");
        setLightColor("#FFFFFF");
        setSelectedPresetId("classic-obsidian");
        fetchBatches();
      } else {
        setError(data.message || "Failed to generate QR batch");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong while generating QR codes");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDownloadPDF = async (batchId, batchNameText) => {
    try {
      setPdfLoadingBatchId(batchId);
      setError("");

      const res = await adminFetch(`/qr-codes/batches/${batchId}/pdf`);
      if (!res.ok) {
        throw new Error("Failed to download PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(batchNameText || "QR_Batch").replace(/[^a-zA-Z0-9_-]/g, "_")}_Printable.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("PDF download error:", err);
      setError("Failed to download PDF. Please try again.");
    } finally {
      setPdfLoadingBatchId(null);
    }
  };

  const handleViewBatchDetails = async (batch) => {
    setSelectedBatch(batch);
    setIsDetailModalOpen(true);
    try {
      setDetailLoading(true);
      const res = await adminFetch(`/qr-codes/batches/${batch._id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedBatchQRs(data.qrCodes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteBatch = async (batchId, batchNameText) => {
    const confirmed = await customConfirm(
      `Are you sure you want to delete '${batchNameText}'? All unlinked QR codes in this batch will be permanently removed.`,
      "Delete QR Batch",
      "Delete Batch",
      true
    );
    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      const res = await adminFetch(`/qr-codes/batches/${batchId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        fetchBatches();
      } else {
        setError(data.message || "Failed to delete batch");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to delete batch.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (code) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/qr/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Stats calculation
  const totalBatches = batches.length;
  const totalQRCodes = batches.reduce((acc, b) => acc + (b.totalQuantity || 0), 0);
  const totalLinked = batches.reduce((acc, b) => acc + (b.linkedCount || 0), 0);
  const totalUnlinked = totalQRCodes - totalLinked;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <QrCode className="w-7 h-7 text-neutral-800" />
            QR Code Management & Printing
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Generate printable QR code batches for t-shirts, track activation status, and export PDF sheets.
          </p>
        </div>
        <button
          onClick={() => setIsGenerateModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5" />
          Generate QR Batch
        </button>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="flex-1">{error}</p>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
          <Check className="w-5 h-5 shrink-0" />
          <p className="flex-1">{success}</p>
          <button onClick={() => setSuccess("")} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm">
          <div className="flex items-center gap-3 text-neutral-500 mb-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-semibold uppercase tracking-wider">Total Batches</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{totalBatches}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm">
          <div className="flex items-center gap-3 text-neutral-500 mb-2">
            <QrCode className="w-5 h-5 text-purple-600" />
            <span className="text-xs font-semibold uppercase tracking-wider">Total QRs</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{totalQRCodes}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm">
          <div className="flex items-center gap-3 text-neutral-500 mb-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Unlinked</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{totalUnlinked}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm">
          <div className="flex items-center gap-3 text-neutral-500 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-semibold uppercase tracking-wider">Linked / Active</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{totalLinked}</p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
        <div className="border-b border-neutral-200/80 px-6 pt-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("batches")}
              className={`pb-4 px-4 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
                activeTab === "batches"
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              QR Batches ({batches.length})
            </button>
            <button
              onClick={() => setActiveTab("qrcodes")}
              className={`pb-4 px-4 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
                activeTab === "qrcodes"
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              All Individual QRs
            </button>
            <button
              onClick={() => setActiveTab("claimCodes")}
              className={`pb-4 px-4 font-semibold text-sm transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === "claimCodes"
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <Ticket className="w-4 h-4 text-neutral-700" />
              Marketing Claims ({claimCodes.length})
            </button>
          </div>

          {activeTab === "batches" ? (
            <button
              onClick={fetchBatches}
              className="mb-3 flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          ) : activeTab === "qrcodes" ? (
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search code or Order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800"
                />
              </form>

              <div className="w-44">
                <CustomSelect
                  options={[
                    { value: "all", label: "All Statuses" },
                    { value: "unlinked", label: "Unlinked Only" },
                    { value: "claimed", label: "Claimed Only" },
                    { value: "active", label: "Active Only" },
                  ]}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  placeholder="Select Status"
                  showPlaceholderInMenu={false}
                  className="!py-1.5 !px-3 !text-xs !rounded-lg"
                />
              </div>
            </div>
          ) : (
            <div className="mb-3 flex flex-wrap items-center gap-3">

              <div className="w-36">
                <CustomSelect
                  options={[
                    { value: "all", label: "All Statuses" },
                    { value: "unused", label: "Unused" },
                    { value: "used", label: "Used" },
                    { value: "revoked", label: "Revoked" },
                    { value: "expired", label: "Expired" },
                  ]}
                  value={claimCodeStatusFilter}
                  onChange={(e) => setClaimCodeStatusFilter(e.target.value)}
                  placeholder="Select Status"
                  showPlaceholderInMenu={false}
                  className="!py-1.5 !px-3 !text-xs !rounded-lg"
                />
              </div>

              <button
                onClick={() => setIsGenerateClaimModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white rounded-lg font-medium text-xs hover:bg-neutral-800 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Generate Claim Code
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: QR Batches Table */}
        {activeTab === "batches" && (
          <div className="p-6">
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center text-neutral-500">
                <Loader className="w-8 h-8 animate-spin mb-2" />
                <p className="text-sm">Loading QR code batches...</p>
              </div>
            ) : batches.length === 0 ? (
              <div className="py-16 text-center">
                <QrCode className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-neutral-800">No QR Batches Created Yet</h3>
                <p className="text-sm text-neutral-500 mt-1 max-w-md mx-auto">
                  Click &quot;Generate QR Batch&quot; to create a new batch of QR codes ready for printing on shirts and garments.
                </p>
                <button
                  onClick={() => setIsGenerateModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  Generate First Batch
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-500 font-medium text-xs uppercase tracking-wider bg-neutral-50/50">
                      <th className="py-3 px-4">Batch Name & Prefix</th>
                      <th className="py-3 px-4">Quantity</th>
                      <th className="py-3 px-4">Status Progress</th>
                      <th className="py-3 px-4">Created Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {paginatedBatches.map((batch) => {
                      const linked = batch.linkedCount || 0;
                      const total = batch.totalQuantity || 0;
                      const percent = total > 0 ? Math.round((linked / total) * 100) : 0;

                      return (
                        <tr key={batch._id} className="hover:bg-neutral-50/60 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-semibold text-neutral-900">{batch.batchName}</div>
                            <div className="text-xs text-neutral-500 flex items-center gap-2 mt-1">
                              <span className="bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-700 font-mono font-bold text-[10px]">
                                {batch.prefix || "BAC"}
                              </span>
                              {/* Color Palette Indicator */}
                              <div
                                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-neutral-200/80 text-[10px] font-mono"
                                title={`QR: ${batch.darkColor || "#000000"} on Base: ${batch.lightColor || "#FFFFFF"}`}
                              >
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-black/20 shadow-2xs"
                                  style={{ backgroundColor: batch.darkColor || "#000000" }}
                                />
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-black/20 shadow-2xs"
                                  style={{ backgroundColor: batch.lightColor || "#FFFFFF" }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span className="font-semibold text-neutral-800">{total}</span> QRs
                          </td>

                          <td className="py-4 px-4">
                            <div className="w-48">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-emerald-600 font-medium">{linked} linked</span>
                                <span className="text-amber-600 font-medium">{total - linked} unlinked</span>
                              </div>
                              <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full transition-all duration-300"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 text-neutral-500 text-xs">
                            {new Date(batch.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>

                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleDownloadPDF(batch._id, batch.batchName)}
                                disabled={pdfLoadingBatchId === batch._id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                                title="Download Printable PDF sheet for shirts"
                              >
                                {pdfLoadingBatchId === batch._id ? (
                                  <Loader className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                                PDF Sheet
                              </button>

                              <button
                                onClick={() => handleViewBatchDetails(batch)}
                                className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all cursor-pointer"
                                title="View QR Codes list"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDeleteBatch(batch._id, batch.batchName)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                title="Delete Batch"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <AdminPagination
              currentPage={activeBatchesPage}
              totalPages={totalBatchesPages}
              onPageChange={setBatchesPage}
              totalItems={batches.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        )}

        {/* Tab 2: All Individual QR Codes Table */}
        {activeTab === "qrcodes" && (
          <div className="p-6">
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center text-neutral-500">
                <Loader className="w-8 h-8 animate-spin mb-2" />
                <p className="text-sm">Loading QR codes...</p>
              </div>
            ) : qrCodes.length === 0 ? (
              <div className="py-16 text-center text-neutral-500 text-sm">
                No QR codes found matching your criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-500 font-medium text-xs uppercase tracking-wider bg-neutral-50/50">
                      <th className="py-3 px-4">Unique QR Code</th>
                      <th className="py-3 px-4">Batch</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Linked User</th>
                      <th className="py-3 px-4 text-right">Target URL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {paginatedQRs.map((qr) => (
                      <tr key={qr._id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-neutral-900">
                          {qr.code}
                        </td>

                        <td className="py-3.5 px-4 text-neutral-600 text-xs">
                          {qr.batchId?.batchName || "N/A"}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            qr.claimedAt
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : qr.orderId
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              qr.claimedAt ? "bg-purple-500" : qr.orderId ? "bg-emerald-500" : "bg-neutral-400"
                            }`} />
                            {qr.claimedAt ? "Claimed" : qr.orderId ? "Active (Linked)" : "Unlinked"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-xs text-neutral-600">
                          {qr.orderId ? (
                            <span className="font-semibold text-neutral-900">{qr.orderId.orderId || qr.orderId}</span>
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-xs text-neutral-600">
                          {qr.claimedBy ? (
                            <div className="font-medium text-neutral-900">
                              {qr.claimedBy.name || qr.claimedBy.email || "User"}
                            </div>
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleCopyLink(qr.code)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-neutral-200 hover:bg-neutral-100 rounded-lg text-neutral-700 transition-all cursor-pointer"
                            >
                              {copiedCode === qr.code ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-600">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  Copy Link
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => setPreviewQR(qr)}
                              className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all cursor-pointer"
                              title="Preview QR Identity Card"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>

                            <a
                              href={`/qr/${qr.code}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all"
                              title="Open Target Page"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <AdminPagination
              currentPage={activeQrsPage}
              totalPages={totalQrsPages}
              onPageChange={setQrsPage}
              totalItems={qrCodes.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        )}

        {/* Tab 3: Gift & Marketing Claim Codes Table */}
        {activeTab === "claimCodes" && (
          <div className="p-6">
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center text-neutral-500">
                <Loader className="w-8 h-8 animate-spin mb-2" />
                <p className="text-sm">Loading claim codes...</p>
              </div>
            ) : claimCodes.length === 0 ? (
              <div className="py-16 text-center">
                <Ticket className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-neutral-700">No Claim Codes Found</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
                  Generate Gift or Marketing claim codes to allow recipients to claim garments without an Order ID.
                </p>
                <button
                  onClick={() => setIsGenerateClaimModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-xl font-medium text-xs hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Generate Claim Code
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-neutral-200/80 rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-neutral-50/80 border-b border-neutral-200/80 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Claim Code</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Expires</th>
                      <th className="py-3 px-4">Claimed QR</th>
                      <th className="py-3 px-4">Claimed By</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {paginatedClaimCodes.map((item) => (
                      <tr key={item._id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                          {item.code}
                          {item.note && (
                            <p className="text-[11px] text-neutral-400 font-sans font-normal">{item.note}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider ${
                              item.type === "MARKETING"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                              item.status === "used"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : item.status === "unused"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : item.status === "revoked"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-neutral-600">
                          {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : "No Expiry"}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-neutral-800 font-semibold">
                          {item.claimedQR?.code ? (
                            <a
                              href={`/qr/${item.claimedQR.code}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline text-neutral-900"
                            >
                              {item.claimedQR.code}
                            </a>
                          ) : (
                            <span className="text-neutral-400 font-normal">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-neutral-600">
                          {item.claimedBy ? (
                            <div>
                              <p className="font-semibold text-neutral-900">{item.claimedBy.name || "User"}</p>
                              <p className="text-[11px] text-neutral-500">{item.claimedBy.email || item.claimedBy.phoneNumber}</p>
                            </div>
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {item.status === "unused" && (
                            <button
                              onClick={() => handleRevokeClaimCode(item._id, item.code)}
                              className="px-3 py-1 text-xs border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition-all cursor-pointer"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <AdminPagination
              currentPage={activeClaimPage}
              totalPages={totalClaimPages}
              onPageChange={setClaimCodesPage}
              totalItems={claimCodes.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        )}
      </div>

      {/* Generate Claim Code Modal */}
      {isGenerateClaimModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-neutral-700" />
                Generate Marketing Claim Code
              </h3>
              <button
                onClick={() => setIsGenerateClaimModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateClaimCodes} className="space-y-4">

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Quantity (Count) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={claimQuantityInput}
                    onChange={(e) => setClaimQuantityInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-800"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">1 to 100 codes</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={claimExpiryInput}
                    onChange={(e) => setClaimExpiryInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Note / Campaign Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. VIP Gift for Influencer campaign"
                  value={claimNoteInput}
                  onChange={(e) => setClaimNoteInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-800"
                />
              </div>

              <div className="pt-3 flex justify-end border-t border-neutral-100 gap-3">
                <button
                  type="button"
                  onClick={() => setIsGenerateClaimModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {submitLoading && <Loader className="w-4 h-4 animate-spin" />}
                  Generate Code(s)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Batch Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in duration-200 my-8">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <Shirt className="w-5 h-5 text-neutral-700" />
                Generate New QR Batch
              </h3>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer p-1 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Batch Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Summer Collection Batch 1"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Code Prefix
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="e.g. BAC"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 text-sm font-mono border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-800 uppercase"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">e.g. BAC-XXXX-YYYY</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Quantity (Count) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-800"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">1 to 1000 QRs</p>
                </div>
              </div>

              {/* QR Color & Base Customization Section */}
              <div className="p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200/90 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-neutral-800" />
                    <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                      QR Code & Base Color (Optical Contrast Verified)
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-500 font-medium flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Zero Scan Degradation
                  </span>
                </div>

                {/* Preset Themes */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-2">
                    Verified High-Contrast Presets:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {QR_COLOR_PRESETS.map((preset) => {
                      const isSelected = selectedPresetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setSelectedPresetId(preset.id);
                            setDarkColor(preset.dark);
                            setLightColor(preset.light);
                          }}
                          className={`p-2 rounded-xl text-left border cursor-pointer transition-all flex items-center gap-2.5 ${
                            isSelected
                              ? "bg-white border-neutral-900 shadow-xs ring-1 ring-neutral-900"
                              : "bg-white/70 border-neutral-200 hover:border-neutral-300"
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg border border-neutral-200 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs relative">
                            <div
                              className="absolute inset-0"
                              style={{ backgroundColor: preset.light }}
                            />
                            <div
                              className="w-3.5 h-3.5 rounded-sm"
                              style={{ backgroundColor: preset.dark }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-neutral-800 truncate leading-tight">
                              {preset.name}
                            </p>
                            <p className="text-[9px] text-neutral-400 truncate mt-0.5">
                              {preset.badge}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Pickers & Live Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  {/* Color pickers */}
                  <div className="sm:col-span-2 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                          QR Module Color (Dark)
                        </label>
                        <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-neutral-800">
                          <input
                            type="color"
                            value={darkColor}
                            onChange={(e) => {
                              setDarkColor(e.target.value);
                              setSelectedPresetId("custom");
                            }}
                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0"
                          />
                          <input
                            type="text"
                            maxLength={7}
                            value={darkColor}
                            onChange={(e) => {
                              setDarkColor(e.target.value);
                              setSelectedPresetId("custom");
                            }}
                            className="w-full text-xs font-mono font-medium text-neutral-800 focus:outline-none uppercase"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                          Base / Background (Light)
                        </label>
                        <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-neutral-800">
                          <input
                            type="color"
                            value={lightColor}
                            onChange={(e) => {
                              setLightColor(e.target.value);
                              setSelectedPresetId("custom");
                            }}
                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0"
                          />
                          <input
                            type="text"
                            maxLength={7}
                            value={lightColor}
                            onChange={(e) => {
                              setLightColor(e.target.value);
                              setSelectedPresetId("custom");
                            }}
                            className="w-full text-xs font-mono font-medium text-neutral-800 focus:outline-none uppercase"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contrast & Optical Safety Analysis Meter */}
                    <div
                      className={`p-3 rounded-xl border text-xs transition-colors ${contrastAnalysis.colorClass}`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-1">
                        <span className="flex items-center gap-1.5">
                          {contrastAnalysis.isDarkOnLight && contrastAnalysis.ratio >= 4.0 ? (
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ShieldAlert className="w-4 h-4 text-amber-600" />
                          )}
                          {contrastAnalysis.rating}
                        </span>
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white/70 border border-current">
                          {contrastAnalysis.ratio}:1 Ratio
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        {contrastAnalysis.message}
                      </p>
                    </div>
                  </div>

                  {/* Live Real-time Card Preview */}
                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-neutral-200 shadow-2xs">
                    <span className="text-[10px] font-semibold text-neutral-400 mb-2 uppercase tracking-wider">
                      Live Test Preview
                    </span>
                    <QRCodeCard
                      code={`${prefix || "BAC"}-DEMO-PREV`}
                      size="compact"
                      darkColor={darkColor}
                      lightColor={lightColor}
                      className="p-3! shadow-none! border-0!"
                    />
                    <span className="text-[9px] text-neutral-400 mt-2 text-center">
                      Scan with your phone to verify
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading || !contrastAnalysis.isDarkOnLight}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {submitLoading && <Loader className="w-4 h-4 animate-spin" />}
                  Generate QRs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Details Modal */}
      {isDetailModalOpen && selectedBatch && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-xl border border-neutral-200">
            {/* Header */}
            <div className="p-5 border-b border-neutral-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">{selectedBatch.batchName}</h3>
                <p className="text-xs text-neutral-500">
                  Prefix: <span className="font-mono font-bold text-neutral-700">{selectedBatch.prefix}</span> |
                  Total: {selectedBatch.totalQuantity} QRs
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDownloadPDF(selectedBatch._id, selectedBatch.batchName)}
                  disabled={pdfLoadingBatchId === selectedBatch._id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-medium cursor-pointer"
                >
                  {pdfLoadingBatchId === selectedBatch._id ? (
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  Download Printable PDF
                </button>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* List Body */}
            <div className="p-5 flex-1 overflow-y-auto">
              {detailLoading ? (
                <div className="py-12 flex justify-center text-neutral-500">
                  <Loader className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedBatchQRs.map((qr) => (
                    <div
                      key={qr._id}
                      className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/80 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-mono font-bold text-sm text-neutral-900">{qr.code}</div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          Status:{" "}
                          <span
                            className={
                              qr.status === "unlinked"
                                ? "text-amber-600 font-semibold"
                                : "text-emerald-600 font-semibold"
                            }
                          >
                            {qr.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewQR(qr)}
                          className="px-2.5 py-1 text-xs border border-neutral-200 bg-white hover:bg-neutral-100 rounded-lg text-neutral-700 font-medium cursor-pointer flex items-center gap-1.5"
                          title="Preview Card"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Preview
                        </button>
                        <button
                          onClick={() => handleCopyLink(qr.code)}
                          className="px-2.5 py-1 text-xs border border-neutral-200 bg-white hover:bg-neutral-100 rounded-lg text-neutral-700 font-medium cursor-pointer"
                        >
                          {copiedCode === qr.code ? "Copied" : "Copy Link"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Popup Modal */}
      <CustomConfirmModal modalData={popupModal} />

      {/* QR Identity Card Preview Modal */}
      {previewQR && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in duration-200 relative flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-5 pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Shirt className="w-4 h-4 text-neutral-700" />
                QR Identity Card Preview
              </h3>
              <button
                onClick={() => setPreviewQR(null)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer p-1 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <QRCodeCard
              code={previewQR.code}
              size="normal"
              className="w-full"
              darkColor={previewQR.darkColor || previewQR.batchId?.darkColor || "#000000"}
              lightColor={previewQR.lightColor || previewQR.batchId?.lightColor || "#FFFFFF"}
            />

            <div className="w-full mt-5 pt-3.5 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
              <span>Status: <strong className="text-neutral-800 capitalize">{previewQR.status || "unlinked"}</strong></span>
              <button
                onClick={() => handleCopyLink(previewQR.code)}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-medium cursor-pointer text-xs flex items-center gap-1.5 transition-colors"
              >
                {copiedCode === previewQR.code ? "Copied Link" : "Copy Target Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
