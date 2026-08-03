"use client";

import { Tag } from "lucide-react";

export default function AccountCouponsPage() {
    return (
        <div className="text-center py-16">
            <Tag className="w-12 h-12 stroke-[1.2] text-neutral-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold font-clashDisplay text-neutral-900 mb-2">My Coupons</h3>
            <p className="text-sm text-neutral-500 mb-6">You currently have no active promo codes or coupons.</p>
        </div>
    );
}
