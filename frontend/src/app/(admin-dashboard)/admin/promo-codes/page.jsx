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
  AlertTriangle,
  Percent,
  Coins
} from "lucide-react";
import CustomSelect from "@/components/ui/CustomSelect";

export default function PromoCodesAdminPage() {
  const { adminFetch } = useAdminAuth();
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [editingPromo, setEditingPromo] = useState(null);

  // Form State
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState(0);
  const [status, setStatus] = useState(true);

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  async function fetchPromoCodes() {
    try {
      setLoading(true);
      setError("");
      const res = await adminFetch("/promo-codes");
      const data = await res.json();

      if (data && Array.isArray(data.data)) {
        setPromoCodes(data.data);
      } else {
        setPromoCodes([]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch promo codes. Please verify backend connection.");
    } finally {
      setLoading(false);
    }
  }

  const openCreateModal = () => {
    setModalMode("create");
    setEditingPromo(null);
    setCode("");
    setDiscountType("percentage");
    setDiscountValue("");
    setMinOrderAmount(0);
    setStatus(true);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const openEditModal = (promo) => {
    setModalMode("edit");
    setEditingPromo(promo);
    setCode(promo.code);
    setDiscountType(promo.discountType);
    setDiscountValue(promo.discountValue);
    setMinOrderAmount(promo.minOrderAmount || 0);
    setStatus(promo.status === undefined ? true : promo.status);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim() || discountValue === "") return;

    try {
      setSubmitLoading(true);
      setError("");
      setSuccess("");

      const payload = {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount),
        status,
      };

      let res;
      if (modalMode === "create") {
        res = await adminFetch("/promo-codes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await adminFetch(`/promo-codes/${editingPromo._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (data.success) {
        setSuccess(data.message || "Saved successfully.");
        setIsModalOpen(false);
        fetchPromoCodes();
      } else {
        setError(data.message || "Action failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeletePromo = async (id) => {
    if (!window.confirm("Are you sure you want to delete this promo code?")) return;

    try {
      setError("");
      setSuccess("");
      const res = await adminFetch(`/promo-codes/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        setSuccess("Promo code deleted successfully.");
        fetchPromoCodes();
      } else {
        setError(data.message || "Delete failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-clashDisplay text-[5vw] md:text-[3vw] lg:text-[1.8vw] font-semibold tracking-wide text-neutral-900">Manage Promo Codes</h1>
          <p className="text-sm md:text-lg lg:text-sm text-neutral-500 font-semibold">Manage e-commerce coupon codes and discount levels.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-neutral-900 text-white hover:bg-neutral-800 font-semibold text-xs tracking-wider uppercase px-4 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Promo Code
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3.5 rounded-xl text-xs font-semibold">
          <Check className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Table View */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-neutral-400" />
            <span className="text-neutral-500 text-xs font-semibold uppercase tracking-wider animate-pulse">Loading promo codes...</span>
          </div>
        ) : promoCodes.length === 0 ? (
          <div className="py-20 text-center text-neutral-400 font-semibold text-sm">
            No promo codes found. Click &quot;Add Promo Code&quot; to create one.
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-center border-collapse whitespace-nowrap min-w-max">
              <thead>
                <tr className="bg-neutral-50 text-neutral-500 font-semibold uppercase tracking-wider text-xs border-b border-neutral-200 whitespace-nowrap">
                  <th className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/6">Promo Code</th>
                  <th className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/6">Type</th>
                  <th className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/6">Discount Value</th>
                  <th className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/6">Min Order (Spend)</th>
                  <th className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/6">Status</th>
                  <th className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {promoCodes.map((promo) => (
                  <tr key={promo._id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/6 font-clashDisplay font-semibold text-neutral-900 text-sm tracking-wide">
                      {promo.code}
                    </td>
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/6 text-xs font-semibold capitalize text-neutral-600">
                      <div className="flex items-center justify-center gap-1.5">
                        {promo.discountType === "percentage" ? (
                          <Percent className="w-3.5 h-3.5 text-neutral-500" />
                        ) : (
                          <Coins className="w-3.5 h-3.5 text-neutral-500" />
                        )}
                        <span>{promo.discountType}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/6 font-semibold text-neutral-900 text-sm">
                      {promo.discountType === "percentage"
                        ? `${promo.discountValue}%`
                        : `Rs ${promo.discountValue}`
                      }
                    </td>
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/6 text-neutral-600 font-semibold text-xs">
                      Rs {promo.minOrderAmount || 0}
                    </td>
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${promo.status !== false
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-neutral-100 text-neutral-500 border-neutral-200"
                        }`}>
                        {promo.status !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 md:py-4 md:px-6 text-center w-1/6">
                      <div className="flex justify-center gap-2 sm:gap-3">
                        <button
                          onClick={() => openEditModal(promo)}
                          className="p-1.5 sm:p-2 border border-neutral-200 text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-50 rounded-lg transition-all shadow-xs cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePromo(promo._id)}
                          className="p-1.5 sm:p-2 border border-neutral-200 text-red-600 hover:text-red-500 bg-white hover:bg-red-50 rounded-lg transition-all shadow-xs cursor-pointer"
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
          <div className="bg-white border border-neutral-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-neutral-50/50">
              <h3 className="font-clashDisplay text-base font-semibold text-neutral-900">
                {modalMode === "create" ? "Add Promo Code" : "Edit Promo Code"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-semibold font-sans">
                  Promo Code Name *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. SUMMER50"
                  className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50 rounded-xl py-3 px-4 outline-none text-sm transition-all duration-300 focus:bg-white font-mono uppercase"
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-semibold">
                  Discount Type *
                </label>
                <CustomSelect
                  required
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  options={[
                    { value: "percentage", label: "Percentage (%)" },
                    { value: "flat", label: "Flat Amount (Rs)" }
                  ]}
                />
              </div>

              {/* Discount Value */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-semibold font-sans">
                  Discount Value *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === "percentage" ? "e.g. 20 (for 20%)" : "e.g. 250 (for Rs 250)"}
                  className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50 rounded-xl py-3 px-4 outline-none text-sm transition-all duration-300 focus:bg-white font-sans"
                />
              </div>

              {/* Min Order Spend */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-2 font-semibold font-sans">
                  Minimum Order Spend (Rs)
                </label>
                <input
                  type="number"
                  min="0"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:border-[#a39889] focus:ring-1 focus:ring-[#dfd7cc]/50 rounded-xl py-3 px-4 outline-none text-sm transition-all duration-300 focus:bg-white font-sans"
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="status"
                  checked={status}
                  onChange={(e) => setStatus(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black accent-black cursor-pointer"
                />
                <label htmlFor="status" className="text-xs uppercase tracking-wider text-neutral-700 font-semibold select-none cursor-pointer">
                  Active (Allow usage)
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-xs uppercase tracking-wider px-4 py-3 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex items-center justify-center bg-[#dfd7cc] hover:bg-[#d0c5b7] text-black font-semibold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all duration-300 min-w-[100px] cursor-pointer"
                >
                  {submitLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Code"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
