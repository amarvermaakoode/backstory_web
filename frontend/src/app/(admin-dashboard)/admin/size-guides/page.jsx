"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  Plus,
  Edit2,
  Trash2,
  Loader,
  X,
  Check,
  AlertTriangle
} from "lucide-react";

import CustomConfirmModal from "@/components/ui/CustomConfirmModal";

export default function SizeGuidesAdminPage() {
  const { adminFetch } = useAdminAuth();
  const [sizeGuides, setSizeGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [editingSizeGuide, setEditingSizeGuide] = useState(null);

  // Form State
  const [name, setName] = useState("");
  const [status, setStatus] = useState(true);
  const [chart, setChart] = useState([
    { size: "S", chest: "", length: "", shoulder: "" },
    { size: "M", chest: "", length: "", shoulder: "" },
    { size: "L", chest: "", length: "", shoulder: "" }
  ]);

  useEffect(() => {
    fetchSizeGuides();
  }, []);

  async function fetchSizeGuides() {
    try {
      setLoading(true);
      setError("");
      const res = await adminFetch("/size-guides");
      const data = await res.json();

      if (Array.isArray(data)) {
        setSizeGuides(data);
      } else if (data && Array.isArray(data.data)) {
        setSizeGuides(data.data);
      } else {
        setSizeGuides([]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch size guides. Please verify backend connection.");
    } finally {
      setLoading(false);
    }
  }

  const openCreateModal = () => {
    setModalMode("create");
    setName("");
    setStatus(true);
    setChart([
      { size: "S", chest: "", length: "", shoulder: "" },
      { size: "M", chest: "", length: "", shoulder: "" },
      { size: "L", chest: "", length: "", shoulder: "" }
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (guide) => {
    setModalMode("edit");
    setEditingSizeGuide(guide);
    setName(guide.name || "");
    setStatus(guide.status === undefined ? true : guide.status);
    setChart(guide.chart && guide.chart.length > 0 ? guide.chart.map(item => ({
      size: item.size || "",
      chest: item.chest || "",
      length: item.length || "",
      shoulder: item.shoulder || ""
    })) : [{ size: "S", chest: "", length: "", shoulder: "" }]);
    setIsModalOpen(true);
  };

  const handleAddRow = () => {
    setChart([...chart, { size: "", chest: "", length: "", shoulder: "" }]);
  };

  const handleRemoveRow = (index) => {
    if (chart.length <= 1) {
      alert("At least one size definition is required.");
      return;
    }
    setChart(chart.filter((_, idx) => idx !== index));
  };

  const handleRowChange = (index, field, value) => {
    const newChart = [...chart];
    newChart[index][field] = value;
    setChart(newChart);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitLoading(true);

    if (!name.trim()) {
      setError("Size Guide Name is required.");
      setSubmitLoading(false);
      return;
    }

    // Clean and validate chart rows
    const cleanedChart = chart.map(row => ({
      size: row.size.trim(),
      chest: row.chest.trim(),
      length: row.length.trim(),
      shoulder: row.shoulder.trim()
    }));

    for (let i = 0; i < cleanedChart.length; i++) {
      if (!cleanedChart[i].size) {
        setError(`Row ${i + 1} is missing a Size label (e.g. S, M, L).`);
        setSubmitLoading(false);
        return;
      }
    }

    try {
      const payload = {
        name: name.trim(),
        chart: cleanedChart,
        status,
      };

      let res;
      if (modalMode === "create") {
        res = await adminFetch("/size-guides", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await adminFetch(`/size-guides/${editingSizeGuide._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Failed to ${modalMode} size guide.`);
      }

      setSuccess(`Size guide successfully ${modalMode === "create" ? "created" : "updated"}!`);
      setIsModalOpen(false);
      fetchSizeGuides();
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred during submission.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteSizeGuide = async (id, guideName) => {
    const confirmed = await customConfirm(
      `Are you sure you want to delete the size guide "${guideName}"? This action cannot be undone.`,
      "Delete Size Guide",
      "Delete",
      true
    );
    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      const res = await adminFetch(`/size-guides/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete size guide.");
      }

      setSuccess("Size guide deleted successfully.");
      fetchSizeGuides();
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not delete size guide.");
    }
  };

  return (
    <div className="space-y-6">

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-clashDisplay text-[5vw] md:text-[3vw] lg:text-[1.8vw] font-semibold tracking-wide text-neutral-900">
            Manage Size Guides
          </h1>
          <p className="text-sm md:text-lg lg:text-sm text-neutral-500 font-semibold">            Define chest, length, and shoulder specifications for t-shirts.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-neutral-900 text-white hover:bg-neutral-800 font-semibold text-xs tracking-wider uppercase px-4 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Size Guide
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2 font-medium">
          <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <p>{success}</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
          <p>{error}</p>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-neutral-800" />
            <p className="text-neutral-500 text-xs uppercase tracking-widest font-semibold">Loading size guides...</p>
          </div>
        ) : sizeGuides.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-neutral-500 text-sm font-semibold">No size guides found. Click &quot;Add Size Guide&quot; to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-center border-collapse whitespace-nowrap min-w-max">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 text-xs font-semibold uppercase tracking-widest whitespace-nowrap">
                  <th className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/4">Name</th>
                  <th className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/4">Sizes Defined</th>
                  <th className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/4">Status</th>
                  <th className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sizeGuides.map((guide) => (
                  <tr key={guide._id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/4 font-semibold text-neutral-900 text-sm">
                      {guide.name}
                    </td>
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/4 text-neutral-600 text-sm font-semibold">
                      {guide.chart ? guide.chart.map(c => c.size).join(", ") : "-"} ({guide.chart ? guide.chart.length : 0})
                    </td>
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${guide.status !== false
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${guide.status !== false ? "bg-emerald-500" : "bg-neutral-400"}`}></span>
                        {guide.status !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/4">
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        <button
                          onClick={() => openEditModal(guide)}
                          className="p-1.5 sm:p-2 text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg transition-all shadow-xs cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSizeGuide(guide._id, guide.name)}
                          className="p-1.5 sm:p-2 text-red-600 hover:text-red-500 bg-white hover:bg-red-50 border border-neutral-200 rounded-lg transition-all shadow-xs cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-neutral-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative my-8">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-neutral-50/50">
              <h3 className="font-clashDisplay text-lg font-semibold text-neutral-900">
                {modalMode === "create" ? "Add Size Guide" : "Edit Size Guide"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">

              {/* Name */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-semibold">
                  Size Guide Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Relaxed Fit T-Shirts"
                  className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50 rounded-xl py-3 px-4 outline-none text-sm transition-all duration-300 focus:bg-white"
                />
              </div>

              {/* Status Toggle */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-semibold">
                  Status
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus(!status)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none ${status ? "bg-[#dfd7cc]" : "bg-neutral-200"
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${status ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                  </button>
                  <span className="text-sm text-neutral-600 font-semibold">
                    {status ? "Active (available on website)" : "Inactive (hidden)"}
                  </span>
                </div>
              </div>

              {/* Sizing Chart Configuration */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Sizing Matrix (T-Shirt Specifics)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="text-[#a39889] hover:text-[#8c8172] text-xs font-semibold uppercase tracking-wider flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Size Row
                  </button>
                </div>

                <div className="border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-100/60 text-neutral-500 text-[10px] font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-4 w-24">Size Label *</th>
                        <th className="py-2.5 px-4">Chest (in/cm)</th>
                        <th className="py-2.5 px-4">Length (in/cm)</th>
                        <th className="py-2.5 px-4">Shoulder (in/cm)</th>
                        <th className="py-2.5 px-4 text-center w-16">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {chart.map((row, index) => (
                        <tr key={index} className="bg-white hover:bg-neutral-50/40">
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              required
                              value={row.size}
                              onChange={(e) => handleRowChange(index, "size", e.target.value)}
                              placeholder="e.g. S"
                              className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] rounded-lg py-1.5 px-2 outline-none text-xs text-center font-semibold focus:bg-white"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.chest}
                              onChange={(e) => handleRowChange(index, "chest", e.target.value)}
                              placeholder="e.g. 38 in"
                              className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] rounded-lg py-1.5 px-2 outline-none text-xs focus:bg-white"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.length}
                              onChange={(e) => handleRowChange(index, "length", e.target.value)}
                              placeholder="e.g. 28 in"
                              className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] rounded-lg py-1.5 px-2 outline-none text-xs focus:bg-white"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.shoulder}
                              onChange={(e) => handleRowChange(index, "shoulder", e.target.value)}
                              placeholder="e.g. 17 in"
                              className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] rounded-lg py-1.5 px-2 outline-none text-xs focus:bg-white"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(index)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 border border-neutral-200 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-800 rounded-xl text-xs uppercase tracking-widest font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="bg-neutral-900 text-white hover:bg-neutral-800 px-5 py-3 rounded-xl text-xs uppercase tracking-widest font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-xs"
                >
                  {submitLoading && <Loader className="w-3.5 h-3.5 animate-spin" />}
                  {modalMode === "create" ? "Save Size Guide" : "Update Size Guide"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Custom Popup Modal */}
      <CustomConfirmModal modalData={popupModal} />
    </div>
  );
}
