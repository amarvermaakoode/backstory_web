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

export default function ColorsAdminPage() {
  const { adminFetch } = useAdminAuth();
  const [colors, setColors] = useState([]);
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
  const [editingColor, setEditingColor] = useState(null);

  // Form State
  const [name, setName] = useState("");
  const [hexCode, setHexCode] = useState("#000000");
  const [status, setStatus] = useState(true);

  useEffect(() => {
    fetchColors();
  }, []);

  async function fetchColors() {
    try {
      setLoading(true);
      setError("");
      const res = await adminFetch("/colors");
      const data = await res.json();

      if (Array.isArray(data)) {
        setColors(data);
      } else if (data && Array.isArray(data.data)) {
        setColors(data.data);
      } else {
        setColors([]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch colors. Please verify backend connection.");
    } finally {
      setLoading(false);
    }
  }

  const openCreateModal = () => {
    setModalMode("create");
    setName("");
    setHexCode("#000000");
    setStatus(true);
    setIsModalOpen(true);
  };

  const openEditModal = (color) => {
    setModalMode("edit");
    setEditingColor(color);
    setName(color.name || "");
    setHexCode(color.hexCode || "#000000");
    setStatus(color.status === undefined ? true : color.status);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitLoading(true);

    if (!name.trim()) {
      setError("Color Name is required.");
      setSubmitLoading(false);
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        hexCode: hexCode.trim(),
        status,
      };

      let res;
      if (modalMode === "create") {
        res = await adminFetch("/colors", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await adminFetch(`/colors/${editingColor._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Failed to ${modalMode} color.`);
      }

      setSuccess(`Color successfully ${modalMode === "create" ? "created" : "updated"}!`);
      setIsModalOpen(false);
      fetchColors();
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred during submission.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteColor = async (id, colorName) => {
    const confirmed = await customConfirm(
      `Are you sure you want to delete the color "${colorName}"? This action cannot be undone.`,
      "Delete Color",
      "Delete",
      true
    );
    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      const res = await adminFetch(`/colors/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete color.");
      }

      setSuccess("Color deleted successfully.");
      fetchColors();
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not delete color.");
    }
  };

  return (
    <div className="space-y-6">

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-clashDisplay text-[5vw] md:text-[3vw] lg:text-[1.8vw] font-semibold tracking-wide text-neutral-900">
            Manage Colors
          </h1>
          <p className="text-sm md:text-lg lg:text-sm text-neutral-500 font-semibold">            Define color configurations used across your catalog.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-neutral-900 text-white hover:bg-neutral-800 font-semibold text-xs tracking-wider uppercase px-4 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Color
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
            <p className="text-neutral-500 text-xs uppercase tracking-widest font-semibold">Loading colors...</p>
          </div>
        ) : colors.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-neutral-500 text-sm font-semibold">No colors found. Click &quot;Add Color&quot; to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-center border-collapse whitespace-nowrap min-w-max">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 text-xs font-semibold uppercase tracking-widest whitespace-nowrap">
                  <th className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/5">Preview</th>
                  <th className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/5">Color Name</th>
                  <th className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/5">Hex Code</th>
                  <th className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/5">Status</th>
                  <th className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {colors.map((color) => (
                  <tr key={color._id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/5">
                      <div
                        className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-neutral-300 shadow-xs mx-auto"
                        style={{ backgroundColor: color.hexCode || "#CCCCCC" }}
                      />
                    </td>
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/5 font-semibold text-neutral-900 text-sm">
                      {color.name}
                    </td>
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/5 font-mono text-neutral-600 text-xs uppercase font-semibold">
                      {color.hexCode || "-"}
                    </td>
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${color.status !== false
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${color.status !== false ? "bg-emerald-500" : "bg-neutral-400"}`}></span>
                        {color.status !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/5">
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        <button
                          onClick={() => openEditModal(color)}
                          className="p-1.5 sm:p-2 text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg transition-all shadow-xs cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteColor(color._id, color.name)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-100">
              <h3 className="font-clashDisplay text-lg font-semibold text-neutral-900">
                {modalMode === "create" ? "Add Color" : "Edit Color"}
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

              {/* Color Name */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-semibold">
                  Color Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Navy Blue"
                  className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50 rounded-xl py-3 px-4 outline-none text-sm transition-all duration-300 focus:bg-white"
                />
              </div>

              {/* Hex Code & Color Picker */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-semibold">
                  Hex Code Color
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      required
                      value={hexCode}
                      onChange={(e) => setHexCode(e.target.value)}
                      placeholder="#000000"
                      className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50 rounded-xl py-3 px-4 outline-none text-sm transition-all duration-300 font-mono uppercase focus:bg-white"
                    />
                  </div>
                  <div className="w-12 h-12 rounded-xl border border-neutral-200 overflow-hidden relative cursor-pointer flex-shrink-0">
                    <input
                      type="color"
                      value={hexCode.startsWith("#") && hexCode.length === 7 ? hexCode : "#000000"}
                      onChange={(e) => setHexCode(e.target.value)}
                      className="absolute inset-0 w-full h-full p-0 border-0 outline-none cursor-pointer scale-150"
                    />
                  </div>
                </div>
              </div>

              {/* Status Toggle */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-semibold">
                  Color Status
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
                  {modalMode === "create" ? "Save Color" : "Update Color"}
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
