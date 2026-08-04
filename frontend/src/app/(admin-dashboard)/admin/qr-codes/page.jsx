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
  RefreshCw
} from "lucide-react";

export default function QRCodesAdminPage() {
  const { adminFetch } = useAdminAuth();

  const [activeTab, setActiveTab] = useState("batches"); // "batches" or "qrcodes"
  const [batches, setBatches] = useState([]);
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [pdfLoadingBatchId, setPdfLoadingBatchId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters for QR Codes tab
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Copy state
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    if (activeTab === "batches") {
      fetchBatches();
    } else {
      fetchAllQRCodes();
    }
  }, [activeTab, statusFilter]);

  const fetchBatches = async () => {
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
  };

  const fetchAllQRCodes = async () => {
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
  };

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
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(data.message || "QR Batch generated successfully!");
        setIsGenerateModalOpen(false);
        setBatchName("");
        setPrefix("BAC");
        setQuantity("50");
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
    if (
      !confirm(
        `Are you sure you want to delete '${batchNameText}'? All unlinked QR codes in this batch will be permanently removed.`
      )
    ) {
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
          </div>

          {activeTab === "batches" ? (
            <button
              onClick={fetchBatches}
              className="mb-3 flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          ) : (
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

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-3 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="unlinked">Unlinked Only</option>
                <option value="claimed">Claimed Only</option>
                <option value="active">Active Only</option>
              </select>
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
                  Click "Generate QR Batch" to create a new batch of QR codes ready for printing on shirts and garments.
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
                    {batches.map((batch) => {
                      const linked = batch.linkedCount || 0;
                      const total = batch.totalQuantity || 0;
                      const percent = total > 0 ? Math.round((linked / total) * 100) : 0;

                      return (
                        <tr key={batch._id} className="hover:bg-neutral-50/60 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-semibold text-neutral-900">{batch.batchName}</div>
                            <div className="text-xs text-neutral-500 flex items-center gap-1.5 mt-1">
                              <span className="bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-700 font-mono font-bold text-[10px]">
                                {batch.prefix || "BAC"}
                              </span>
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
                    {qrCodes.map((qr) => (
                      <tr key={qr._id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-neutral-900">
                          {qr.code}
                        </td>

                        <td className="py-3.5 px-4 text-neutral-600 text-xs">
                          {qr.batchId?.batchName || "N/A"}
                        </td>

                        <td className="py-3.5 px-4">
                          {qr.status === "unlinked" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" /> Unlinked
                            </span>
                          )}
                          {qr.status === "claimed" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <CheckCircle2 className="w-3 h-3" /> Claimed
                            </span>
                          )}
                          {qr.status === "active" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-xs font-mono text-neutral-600">
                          {qr.orderId || "—"}
                        </td>

                        <td className="py-3.5 px-4 text-xs">
                          {qr.linkedUser ? (
                            <div>
                              <div className="font-semibold text-neutral-800">{qr.linkedUser.name}</div>
                              <div className="text-neutral-500">{qr.linkedUser.email}</div>
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
          </div>
        )}
      </div>

      {/* Generate Batch Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <Shirt className="w-5 h-5 text-neutral-700" />
                Generate New QR Batch
              </h3>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateSubmit} className="space-y-4">
              <div>
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

              <div className="grid grid-cols-2 gap-3">
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
                  disabled={submitLoading}
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

                      <button
                        onClick={() => handleCopyLink(qr.code)}
                        className="px-2.5 py-1 text-xs border border-neutral-200 bg-white hover:bg-neutral-100 rounded-lg text-neutral-700 font-medium cursor-pointer"
                      >
                        {copiedCode === qr.code ? "Copied" : "Copy Link"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
