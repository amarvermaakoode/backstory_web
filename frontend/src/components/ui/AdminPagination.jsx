"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminPagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems = 0,
  itemsPerPage = 10,
}) {
  if (totalPages <= 1) return null;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-neutral-200/80 text-xs text-neutral-500">
      {totalItems > 0 && (
        <div>
          Showing <span className="font-semibold text-neutral-900">{startIndex + 1}</span> to{" "}
          <span className="font-semibold text-neutral-900">{endIndex}</span> of{" "}
          <span className="font-semibold text-neutral-900">{totalItems}</span> entries
        </div>
      )}

      <div className="flex items-center gap-1.5 ml-auto">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => {
            if (currentPage > 1) {
              onPageChange(currentPage - 1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className={`p-2 rounded-lg border border-neutral-200 flex items-center justify-center transition-colors cursor-pointer ${
            currentPage === 1
              ? "opacity-30 cursor-not-allowed bg-neutral-50 text-neutral-400"
              : "hover:bg-neutral-100 hover:text-neutral-900 text-neutral-700 bg-white"
          }`}
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => {
              onPageChange(page);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center ${
              currentPage === page
                ? "bg-[#101820] text-white font-bold shadow-xs"
                : "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => {
            if (currentPage < totalPages) {
              onPageChange(currentPage + 1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className={`p-2 rounded-lg border border-neutral-200 flex items-center justify-center transition-colors cursor-pointer ${
            currentPage === totalPages
              ? "opacity-30 cursor-not-allowed bg-neutral-50 text-neutral-400"
              : "hover:bg-neutral-100 hover:text-neutral-900 text-neutral-700 bg-white"
          }`}
          aria-label="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
