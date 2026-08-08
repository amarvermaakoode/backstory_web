"use client";

import { X } from "lucide-react";

export default function CustomConfirmModal({ modalData }) {
  if (!modalData) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative space-y-4 animate-fade-in border border-neutral-100">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h4 className="font-clashDisplay text-base font-semibold text-neutral-900">
            {modalData.title || "Confirm Action"}
          </h4>
          <button
            type="button"
            onClick={() => (modalData.onCancel ? modalData.onCancel() : modalData.onConfirm())}
            className="p-1 rounded-full text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-neutral-600 leading-relaxed font-medium">
          {modalData.message}
        </p>

        {modalData.type === "prompt" && (
          <input
            type="text"
            autoFocus
            value={modalData.inputValue || ""}
            onChange={(e) => modalData.onInputChange && modalData.onInputChange(e.target.value)}
            placeholder={modalData.placeholder}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black font-medium"
          />
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-100">
          {modalData.type !== "alert" && (
            <button
              type="button"
              onClick={() => modalData.onCancel && modalData.onCancel()}
              className="px-4 py-2 rounded-full border border-neutral-200 hover:bg-neutral-100 text-xs font-semibold text-neutral-700 transition-colors cursor-pointer"
            >
              {modalData.cancelText || "Cancel"}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (modalData.type === "prompt") {
                modalData.onConfirm(modalData.inputValue);
              } else {
                modalData.onConfirm();
              }
            }}
            className={`px-5 py-2 rounded-full text-xs font-semibold text-white transition-all cursor-pointer shadow-xs ${modalData.isDanger ? "bg-red-600 hover:bg-red-700" : "bg-[#101820] hover:bg-black"}`}
          >
            {modalData.confirmText || "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
