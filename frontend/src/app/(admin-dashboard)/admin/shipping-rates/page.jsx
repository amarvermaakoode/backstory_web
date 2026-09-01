"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Truck, Save, Loader2, RefreshCw, CheckCircle2, ShieldAlert } from "lucide-react";

export default function ShippingRatesAdminPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    standard: {
      rate: 0,
      deliveryDays: "3–5 business days",
      freeThreshold: 999,
    },
    express: {
      rate: 150,
      deliveryDays: "1–2 business days",
    },
    international: {
      rate: 638,
      deliveryDays: "7–14 business days",
    },
  });

  const fetchShippingRates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE_URL}/admin/shipping-rates`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.shippingSetting) {
        const s = data.shippingSetting;
        setForm({
          standard: {
            rate: s.standard?.rate ?? 0,
            deliveryDays: s.standard?.deliveryDays || "3–5 business days",
            freeThreshold: s.standard?.freeThreshold ?? 999,
          },
          express: {
            rate: s.express?.rate ?? 150,
            deliveryDays: s.express?.deliveryDays || "1–2 business days",
          },
          international: {
            rate: s.international?.rate ?? 638,
            deliveryDays: s.international?.deliveryDays || "7–14 business days",
          },
        });
      } else {
        showToast(data.message || "Failed to load shipping rates", "error");
      }
    } catch (err) {
      console.error("Error fetching shipping rates:", err);
      showToast("Error connecting to server", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShippingRates();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE_URL}/admin/shipping-rates`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Shipping rates updated successfully!", "success");
        if (data.shippingSetting) {
          const s = data.shippingSetting;
          setForm({
            standard: {
              rate: s.standard?.rate ?? 0,
              deliveryDays: s.standard?.deliveryDays || "3–5 business days",
              freeThreshold: s.standard?.freeThreshold ?? 999,
            },
            express: {
              rate: s.express?.rate ?? 150,
              deliveryDays: s.express?.deliveryDays || "1–2 business days",
            },
            international: {
              rate: s.international?.rate ?? 638,
              deliveryDays: s.international?.deliveryDays || "7–14 business days",
            },
          });
        }
      } else {
        showToast(data.message || "Failed to update shipping rates", "error");
      }
    } catch (err) {
      console.error("Error saving shipping rates:", err);
      showToast("Server error while saving shipping rates", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-neutral-800 animate-spin" />
        <p className="text-sm font-medium text-neutral-500">Loading shipping settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800 shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Shipping Rates & Methods</h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Set delivery charges and estimated lead times displayed on customer checkout.
            </p>
          </div>
        </div>

        <button
          onClick={fetchShippingRates}
          disabled={loading || saving}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Reload Settings
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Standard Delivery Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Method 1
              </span>
              <h2 className="text-lg font-bold text-neutral-900">Standard Delivery</h2>
            </div>
            <span className="text-xs font-medium text-neutral-400">Domestic Standard</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
                Base Rate (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-neutral-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  value={form.standard.rate}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      standard: { ...prev.standard, rate: e.target.value },
                    }))
                  }
                  className="w-full pl-8 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-900 focus:outline-none focus:border-neutral-800 transition-all"
                  placeholder="0"
                  required
                />
              </div>
              <p className="text-[11px] text-neutral-400 mt-1.5">
                Set to 0 if standard delivery is free by default.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
                Free Shipping Threshold (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-neutral-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  value={form.standard.freeThreshold}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      standard: { ...prev.standard, freeThreshold: e.target.value },
                    }))
                  }
                  className="w-full pl-8 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-900 focus:outline-none focus:border-neutral-800 transition-all"
                  placeholder="999"
                  required
                />
              </div>
              <p className="text-[11px] text-neutral-400 mt-1.5">
                Orders with subtotal ≥ this amount get Free Standard Delivery.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
                Estimated Delivery Window
              </label>
              <input
                type="text"
                value={form.standard.deliveryDays}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    standard: { ...prev.standard, deliveryDays: e.target.value },
                  }))
                }
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-900 focus:outline-none focus:border-neutral-800 transition-all"
                placeholder="3–5 business days"
                required
              />
              <p className="text-[11px] text-neutral-400 mt-1.5">
                Shown below standard shipping title at checkout.
              </p>
            </div>
          </div>
        </div>

        {/* Express Delivery Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Method 2
              </span>
              <h2 className="text-lg font-bold text-neutral-900">Express Delivery</h2>
            </div>
            <span className="text-xs font-medium text-neutral-400">Domestic Fast Track</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
                Express Shipping Rate (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-neutral-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  value={form.express.rate}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      express: { ...prev.express, rate: e.target.value },
                    }))
                  }
                  className="w-full pl-8 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-900 focus:outline-none focus:border-neutral-800 transition-all"
                  placeholder="150"
                  required
                />
              </div>
              <p className="text-[11px] text-neutral-400 mt-1.5">
                Flat shipping fee charged when customer selects Express Delivery.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
                Estimated Delivery Window
              </label>
              <input
                type="text"
                value={form.express.deliveryDays}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    express: { ...prev.express, deliveryDays: e.target.value },
                  }))
                }
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-900 focus:outline-none focus:border-neutral-800 transition-all"
                placeholder="1–2 business days"
                required
              />
              <p className="text-[11px] text-neutral-400 mt-1.5">
                Shown below express shipping title at checkout.
              </p>
            </div>
          </div>
        </div>

        {/* International Shipping Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                Method 3
              </span>
              <h2 className="text-lg font-bold text-neutral-900">International Shipping</h2>
            </div>
            <span className="text-xs font-medium text-neutral-400">Global Shipping</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
                International Shipping Rate (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-neutral-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  value={form.international.rate}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      international: { ...prev.international, rate: e.target.value },
                    }))
                  }
                  className="w-full pl-8 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-900 focus:outline-none focus:border-neutral-800 transition-all"
                  placeholder="638"
                  required
                />
              </div>
              <p className="text-[11px] text-neutral-400 mt-1.5">
                Flat shipping fee charged when customer selects International Shipping.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
                Estimated Delivery Window
              </label>
              <input
                type="text"
                value={form.international.deliveryDays}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    international: { ...prev.international, deliveryDays: e.target.value },
                  }))
                }
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-900 focus:outline-none focus:border-neutral-800 transition-all"
                placeholder="7–14 business days"
                required
              />
              <p className="text-[11px] text-neutral-400 mt-1.5">
                Shown below international shipping title at checkout.
              </p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-end gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Rates...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save All Shipping Rates
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
