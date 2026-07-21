"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function FilterDrawer({
    isOpen,
    onClose,
    onApplyFilters,
    initialFilters = {}
}) {
    const [minPrice, setMinPrice] = useState(initialFilters.minPrice || 0);
    const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice || 10000);
    const [selectedGender, setSelectedGender] = useState(initialFilters.gender || "ALL");
    const [selectedSizes, setSelectedSizes] = useState(initialFilters.sizes || []);
    const [selectedSeries, setSelectedSeries] = useState(initialFilters.series || []);
    const [selectedColors, setSelectedColors] = useState(initialFilters.colors || []);

    const genderOptions = ["Men", "Women", "Unisex"];
    const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];
    const seriesOptions = [
        "Travel Series",
        "Coder Series",
        "Biker Series",
        "Techie Series",
        "Nomad Series"
    ];

    const colorOptions = [
        { name: "Red", hex: "#E53E3E" },
        { name: "Light Green", hex: "#9AE6B4" },
        { name: "Dark Brown", hex: "#2D1A10" },
        { name: "Purple", hex: "#805AD5" },
        { name: "Tan", hex: "#D69E2E" },
        { name: "Pink", hex: "#ED64A6" },
        { name: "Blue", hex: "#3182CE" },
        { name: "Dark Green", hex: "#22543D" },
        { name: "Black", hex: "#1A202C" },
        { name: "Violet", hex: "#6B46C1" },
        { name: "Indigo", hex: "#4C51BF" },
        { name: "Sage", hex: "#81E6D9" },
        { name: "Sand", hex: "#E2E8F0" },
        { name: "Crimson", hex: "#C53030" }
    ];

    // Compute active filters count
    const getActiveCount = () => {
        let count = 0;
        if (minPrice > 0 || maxPrice < 10000) count++;
        if (selectedGender !== "ALL") count++;
        if (selectedSizes.length > 0) count += selectedSizes.length;
        if (selectedSeries.length > 0) count += selectedSeries.length;
        if (selectedColors.length > 0) count += selectedColors.length;
        return count;
    };

    const toggleSize = (size) => {
        if (selectedSizes.includes(size)) {
            setSelectedSizes(selectedSizes.filter((s) => s !== size));
        } else {
            setSelectedSizes([...selectedSizes, size]);
        }
    };

    const toggleSeries = (series) => {
        if (selectedSeries.includes(series)) {
            setSelectedSeries(selectedSeries.filter((s) => s !== series));
        } else {
            setSelectedSeries([...selectedSeries, series]);
        }
    };

    const toggleColor = (hex) => {
        if (selectedColors.includes(hex)) {
            setSelectedColors(selectedColors.filter((c) => c !== hex));
        } else {
            setSelectedColors([...selectedColors, hex]);
        }
    };

    const handleClear = () => {
        setMinPrice(0);
        setMaxPrice(10000);
        setSelectedGender("ALL");
        setSelectedSizes([]);
        setSelectedSeries([]);
        setSelectedColors([]);
        onApplyFilters({
            minPrice: 0,
            maxPrice: 10000,
            gender: "ALL",
            sizes: [],
            series: [],
            colors: []
        });
    };

    const handleApply = () => {
        onApplyFilters({
            minPrice,
            maxPrice,
            gender: selectedGender,
            sizes: selectedSizes,
            series: selectedSeries,
            colors: selectedColors
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop Overlay */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Slide-over Drawer Panel */}
            <div className="relative w-full max-w-md bg-[#F4F0EA] h-full flex flex-col justify-between shadow-2xl z-10 overflow-hidden text-black">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200/60 bg-[#F4F0EA]">
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-semibold font-clashDisplay text-black tracking-tight">
                            Filters
                        </h2>
                        {getActiveCount() > 0 && (
                            <span className="text-neutral-500 font-normal text-lg">
                                ({getActiveCount()})
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-neutral-200/80 transition-colors text-black cursor-pointer"
                        aria-label="Close filters"
                    >
                        <X className="w-5 h-5 stroke-[2]" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 no-scrollbar">
                    <style jsx global>{`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .no-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>

                    {/* Section 1: Price Range */}
                    <div className="bg-white/80 rounded-2xl p-5 shadow-xs space-y-3">
                        <div className="flex justify-between items-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                            <span>Price</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-medium text-black pt-1">
                            <div>
                                <span className="text-[10px] text-neutral-400 block">Min</span>
                                <span className="font-semibold text-sm">Rs {minPrice.toLocaleString()}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-neutral-400 block">Max</span>
                                <span className="font-semibold text-sm">Rs {maxPrice.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="space-y-2 pt-2">
                            <input
                                type="range"
                                min={0}
                                max={10000}
                                step={100}
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(Number(e.target.value))}
                                className="w-full accent-black cursor-pointer bg-neutral-200 h-1.5 rounded-lg"
                            />
                        </div>
                    </div>

                    {/* Section 2: Gender */}
                    <div className="bg-white/80 rounded-2xl p-5 shadow-xs space-y-3">
                        <h3 className="text-sm font-semibold text-black">Gender</h3>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {genderOptions.map((g) => {
                                const isSelected = selectedGender === g;
                                return (
                                    <button
                                        key={g}
                                        onClick={() => setSelectedGender(isSelected ? "ALL" : g)}
                                        className={`px-5 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer ${isSelected
                                                ? "bg-black text-white border-black"
                                                : "bg-[#F4F0EA]/60 border-neutral-300/80 text-black hover:border-black"
                                            }`}
                                    >
                                        {g}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 3: Size */}
                    <div className="bg-white/80 rounded-2xl p-5 shadow-xs space-y-3">
                        <h3 className="text-sm font-semibold text-black">Size</h3>
                        <div className="flex flex-wrap gap-2.5 pt-1">
                            {sizeOptions.map((sz) => {
                                const isSelected = selectedSizes.includes(sz);
                                return (
                                    <button
                                        key={sz}
                                        onClick={() => toggleSize(sz)}
                                        className={`w-11 h-11 rounded-full text-xs font-medium border flex items-center justify-center transition-all cursor-pointer ${isSelected
                                                ? "bg-black text-white border-black"
                                                : "bg-[#F4F0EA]/60 border-neutral-300/80 text-black hover:border-black"
                                            }`}
                                    >
                                        {sz}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 4: Category / Series */}
                    <div className="bg-white/80 rounded-2xl p-5 shadow-xs space-y-3">
                        <h3 className="text-sm font-semibold text-black">Category</h3>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {seriesOptions.map((series) => {
                                const isSelected = selectedSeries.includes(series);
                                return (
                                    <button
                                        key={series}
                                        onClick={() => toggleSeries(series)}
                                        className={`px-4 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer ${isSelected
                                                ? "bg-black text-white border-black"
                                                : "bg-[#F4F0EA]/60 border-neutral-300/80 text-black hover:border-black"
                                            }`}
                                    >
                                        {series}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 5: Colours */}
                    <div className="bg-white/80 rounded-2xl p-5 shadow-xs space-y-3">
                        <h3 className="text-sm font-semibold text-black">Colours</h3>
                        <div className="flex flex-wrap gap-3 pt-1">
                            {colorOptions.map((c, i) => {
                                const isSelected = selectedColors.includes(c.hex);
                                return (
                                    <button
                                        key={i}
                                        onClick={() => toggleColor(c.hex)}
                                        style={{ backgroundColor: c.hex }}
                                        className={`w-7 h-7 rounded-full transition-transform cursor-pointer relative ${isSelected ? "scale-110 ring-2 ring-black ring-offset-2" : "hover:scale-105"
                                            }`}
                                        title={c.name}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 bg-[#F4F0EA] border-t border-neutral-200/60 flex items-center gap-3">
                    <button
                        onClick={handleClear}
                        className="flex-1 py-3.5 px-4 rounded-full bg-neutral-200 text-black font-semibold text-sm hover:bg-neutral-300 transition-colors cursor-pointer text-center"
                    >
                        Clear Filters
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-1 py-3.5 px-4 rounded-full bg-[#101820] text-white font-semibold text-sm hover:bg-black transition-colors cursor-pointer text-center shadow-md"
                    >
                        Show Results
                    </button>
                </div>
            </div>
        </div>
    );
}
