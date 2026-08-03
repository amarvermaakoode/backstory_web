"use client";

import { AlertTriangle, Trash2, AlertCircle, X } from "lucide-react";

/**
 * Reusable Confirmation & Action Modal Component
 * Replaces native browser confirm() and alert() dialogs with a premium styled modal.
 */
export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Are you sure?",
    message = "This action cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "danger", // "danger", "warning", "info"
    loading = false,
}) {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case "danger":
                return <Trash2 className="w-6 h-6 text-red-600" />;
            case "warning":
                return <AlertTriangle className="w-6 h-6 text-amber-600" />;
            default:
                return <AlertCircle className="w-6 h-6 text-neutral-800" />;
        }
    };

    const getConfirmBtnStyle = () => {
        switch (type) {
            case "danger":
                return "bg-red-600 hover:bg-red-700 text-white";
            case "warning":
                return "bg-amber-600 hover:bg-amber-700 text-white";
            default:
                return "bg-neutral-900 hover:bg-neutral-800 text-white";
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5 animate-fade-in border border-neutral-100">
                {/* Header with Icon and Close Button */}
                <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center">
                        {getIcon()}
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold font-clashDisplay text-neutral-900">
                        {title}
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed font-normal">
                        {message}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-3">
                    {cancelText && (
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 border border-neutral-200 rounded-xl py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 ${getConfirmBtnStyle()}`}
                    >
                        {loading ? "Processing..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
