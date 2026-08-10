"use client";

import { useState, useEffect } from "react";
import { Tag, Copy, Check } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function AccountCouponsPage() {
    const { showToast } = useToast();
    const [coupons, setCoupons] = useState([]);
    const [copiedCode, setCopiedCode] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchPromoCodes = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/frontend/promo-codes`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && Array.isArray(data.data) && data.data.length > 0 && isMounted) {
                        setCoupons(data.data);
                    }
                }
            } catch (err) {
                console.log("Fetch promo codes error (mock fallback):", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchPromoCodes();
        return () => {
            isMounted = false;
        };
    }, []);

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        showToast(`Promo code '${code}' copied to clipboard!`, "success");
        setTimeout(() => {
            setCopiedCode(null);
        }, 2500);
    };

    if (!loading && coupons.length === 0) {
        return (
            <div className="text-center py-16">
                <Tag className="w-12 h-12 stroke-[1.2] text-neutral-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold font-clashDisplay text-neutral-900 mb-2">My Coupons</h3>
                <p className="text-sm text-neutral-500 mb-6">You currently have no active promo codes or coupons.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <h2 className="text-xl sm:text-2xl font-bold font-clashDisplay text-neutral-900">My Coupons</h2>
                <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full">
                    {coupons.length} Available
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {coupons.map((coupon) => (
                    <div
                        key={coupon._id || coupon.code}
                        className="border border-neutral-200/90 rounded-2xl p-5 bg-white flex flex-col justify-between space-y-4 hover:border-neutral-300 transition-colors shadow-2xs"
                    >
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="bg-neutral-900 text-white font-mono font-bold text-xs px-3 py-1 rounded-lg tracking-wider uppercase">
                                    {coupon.code}
                                </span>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                                    {coupon.discountType === "percentage"
                                        ? `${coupon.discountValue}% OFF`
                                        : `Rs ${coupon.discountValue} OFF`}
                                </span>
                            </div>

                            <p className="text-xs font-medium text-neutral-500 pt-1">
                                Applicable on orders above Rs {coupon.minOrderAmount?.toLocaleString()}
                            </p>
                        </div>

                        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                            <span className="text-[11px] text-neutral-400 font-medium">Limited Period Offer</span>
                            <button
                                onClick={() => handleCopyCode(coupon.code)}
                                className="border border-neutral-300 rounded-full px-3.5 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                                {copiedCode === coupon.code ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="text-emerald-600">Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5 text-neutral-500" />
                                        <span>Copy Code</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
