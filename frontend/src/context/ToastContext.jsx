"use client";

import { createContext, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = "success", duration = 3500) => {
        const id = Date.now() + Math.random();
        const newToast = { id, message, type };

        setToasts((prev) => [...prev, newToast]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* High-Visibility Top Center Toast Container */}
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2.5 max-w-md w-full pointer-events-none px-4">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="w-full bg-neutral-900 text-white rounded-2xl px-5 py-3.5 shadow-2xl border border-neutral-700/80 flex items-center justify-between gap-3.5 pointer-events-auto transition-all animate-in fade-in slide-in-from-top-4 duration-200"
                    >
                        <div className="flex items-center gap-3">
                            {toast.type === "success" && (
                                <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                </div>
                            )}
                            {toast.type === "error" && (
                                <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                                    <AlertCircle className="w-4 h-4 text-red-400" />
                                </div>
                            )}
                            {toast.type === "info" && (
                                <div className="w-7 h-7 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
                                    <Info className="w-4 h-4 text-sky-400" />
                                </div>
                            )}
                            <p className="text-xs sm:text-sm font-semibold text-neutral-100 leading-snug">
                                {toast.message}
                            </p>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-neutral-400 hover:text-white p-1 transition-colors cursor-pointer shrink-0"
                            aria-label="Dismiss notification"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        return { showToast: (msg) => console.log("Toast:", msg) };
    }
    return context;
}
