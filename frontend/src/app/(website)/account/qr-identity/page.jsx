"use client";

import { useUserAuth } from "@/context/UserAuthContext";
import { Scan } from "lucide-react";

export default function AccountQrIdentityPage() {
    const { user } = useUserAuth();

    return (
        <div className="text-center py-16 max-w-md mx-auto">
            <Scan className="w-12 h-12 stroke-[1.2] text-neutral-800 mx-auto mb-4" />
            <h3 className="text-xl font-bold font-clashDisplay text-neutral-900 mb-2">QR Identity</h3>
            <p className="text-sm text-neutral-500 mb-6">Your unique digital identity card for exclusive events & instore benefits.</p>
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 flex flex-col items-center">
                <div className="w-36 h-36 bg-neutral-900 rounded-xl flex items-center justify-center text-white mb-4">
                    <Scan className="w-20 h-20 stroke-[1.2]" />
                </div>
                <span className="text-xs font-mono font-bold text-neutral-700 uppercase tracking-widest">
                    {user?.id ? `ID: ${user.id}` : "ID: BAC-884920"}
                </span>
            </div>
        </div>
    );
}
