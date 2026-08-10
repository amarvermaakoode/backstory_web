"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function FilterDrawer({
    isOpen,
    onClose,
    onApplyFilters,
    initialFilters = {},
    maxCatalogPrice = 10000,
    availableColors = [],
    availableSizes = []
}) {
    const maxLimit = maxCatalogPrice > 0 ? maxCatalogPrice : 10000;
    const [minPrice, setMinPrice] = useState(initialFilters.minPrice || 0);
    const [maxPrice, setMaxPrice] = useState(
        initialFilters.maxPrice !== undefined && initialFilters.maxPrice !== 10000 && initialFilters.maxPrice !== Infinity
            ? initialFilters.maxPrice
            : maxLimit
    );
    const [selectedGender, setSelectedGender] = useState(initialFilters.gender || "ALL");
    const [selectedSizes, setSelectedSizes] = useState(initialFilters.sizes || []);
    const [selectedSeries, setSelectedSeries] = useState(initialFilters.series || []);
    const [selectedColors, setSelectedColors] = useState(initialFilters.colors || []);
    const [showAllColors, setShowAllColors] = useState(false);

    const [fetchedColors, setFetchedColors] = useState([]);
    const [fetchedSizes, setFetchedSizes] = useState([]);

    // Fetch catalog colors directly from backend if availableColors is empty
    useEffect(() => {
        if (!availableColors || availableColors.length === 0) {
            fetch(`${API_BASE_URL}/frontend/colors`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && Array.isArray(data.data)) {
                        setFetchedColors(data.data.map(c => ({ name: c.name, hex: c.hexCode || "#CCCCCC" })));
                    }
                })
                .catch(err => console.error("Error fetching frontend colors:", err));
        }
    }, [availableColors]);

    // Fetch catalog size guides directly from backend DB
    useEffect(() => {
        fetch(`${API_BASE_URL}/frontend/size-guides`)
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.sizes)) {
                    setFetchedSizes(data.sizes);
                }
            })
            .catch(err => console.error("Error fetching frontend size guides:", err));
    }, []);

    // Sync max limit when catalog max price changes
    useEffect(() => {
        if (initialFilters.maxPrice === undefined || initialFilters.maxPrice === 10000 || initialFilters.maxPrice === Infinity) {
            setMaxPrice(maxLimit);
        }
    }, [maxLimit, initialFilters.maxPrice]);

    const genderOptions = ["Men", "Women", "Unisex"];
    const activeSizes = (availableSizes && availableSizes.length > 0) ? availableSizes : fetchedSizes;
    const seriesOptions = [
        "Travel Series",
        "Coder Series",
        "Biker Series",
        "Techie Series",
        "Nomad Series"
    ];

    // Compute active filters count
    const getActiveCount = () => {
        let count = 0;
        if (minPrice > 0 || maxPrice < maxLimit) count++;
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
        setMaxPrice(maxLimit);
        setSelectedGender("ALL");
        setSelectedSizes([]);
        setSelectedSeries([]);
        setSelectedColors([]);
        setShowAllColors(false);
        onApplyFilters({
            minPrice: 0,
            maxPrice: maxLimit,
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

    // Convert slider position (0-100) to actual price value
    const sliderToPrice = (val, maxP) => {
        if (maxP <= 10000) {
            return Math.round((val / 100) * maxP / 100) * 100;
        }
        if (val <= 50) {
            return Math.round(((val / 50) * 10000) / 100) * 100;
        } else {
            const ratio = (val - 50) / 50;
            const extra = Math.pow(ratio, 2) * (maxP - 10000);
            return Math.round((10000 + extra) / 500) * 500;
        }
    };

    // Convert actual price value to slider position (0-100)
    const priceToSlider = (price, maxP) => {
        if (maxP <= 10000) {
            return Math.min(100, Math.max(0, (price / maxP) * 100));
        }
        if (price <= 10000) {
            return Math.min(50, Math.max(0, (price / 10000) * 50));
        } else {
            const ratio = Math.sqrt(Math.max(0, price - 10000) / Math.max(1, maxP - 10000));
            return Math.min(100, Math.max(50, 50 + ratio * 50));
        }
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
                            <span>Price Range</span>
                        </div>



                        {/* Numeric Inputs */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div>
                                <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                                    Min Price (Rs)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={maxPrice}
                                    value={minPrice}
                                    onChange={(e) => {
                                        const v = Math.max(0, Number(e.target.value) || 0);
                                        setMinPrice(v);
                                    }}
                                    className="w-full bg-[#F4F0EA]/60 border border-neutral-200 focus:border-black rounded-xl px-3 py-1.5 text-xs font-semibold outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                                    Max Price (Rs)
                                </label>
                                <input
                                    type="number"
                                    min={minPrice}
                                    max={maxLimit}
                                    value={maxPrice}
                                    onChange={(e) => {
                                        const valStr = e.target.value;
                                        if (valStr === "") {
                                            setMaxPrice(0);
                                        } else {
                                            const v = Math.max(minPrice, Number(valStr) || 0);
                                            setMaxPrice(v);
                                        }
                                    }}
                                    className="w-full bg-[#F4F0EA]/60 border border-neutral-200 focus:border-black rounded-xl px-3 py-1.5 text-xs font-semibold outline-none transition-colors"
                                />
                            </div>
                        </div>

                        {/* Smooth Slider */}
                        <div className="space-y-1 pt-2">
                            <input
                                type="range"
                                min={0}
                                max={100}
                                step={0.5}
                                value={priceToSlider(maxPrice, maxLimit)}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    const calculatedPrice = sliderToPrice(val, maxLimit);
                                    setMaxPrice(calculatedPrice);
                                }}
                                className="w-full accent-black cursor-pointer bg-neutral-200 h-1.5 rounded-lg"
                            />
                            <div className="flex justify-between text-[10px] text-neutral-400 font-medium pt-1">
                                <span>Rs {minPrice.toLocaleString()}</span>
                                <span>Rs {maxPrice.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Gender */}
                    <div className="bg-white/80 rounded-2xl p-5 shadow-xs space-y-3">
                        <h3 className="text-sm font-semibold text-black">Gender</h3>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {[
                                { label: "All", value: "ALL" },
                                { label: "Men", value: "Men" },
                                { label: "Women", value: "Women" },
                                { label: "Unisex", value: "Unisex" }
                            ].map((g) => {
                                const isSelected = selectedGender === g.value;
                                return (
                                    <button
                                        key={g.value}
                                        onClick={() => setSelectedGender(g.value)}
                                        className={`px-5 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer ${isSelected
                                            ? "bg-black text-white border-black"
                                            : "bg-[#F4F0EA]/60 border-neutral-300/80 text-black hover:border-black"
                                            }`}
                                    >
                                        {g.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 3: Size */}
                    <div className="bg-white/80 rounded-2xl p-5 shadow-xs space-y-3">
                        <h3 className="text-sm font-semibold text-black">Size</h3>
                        <div className="flex flex-wrap gap-2.5 pt-1">
                            <button
                                type="button"
                                onClick={() => setSelectedSizes([])}
                                className={`h-11 px-4 rounded-full text-xs font-medium border flex items-center justify-center transition-all cursor-pointer ${selectedSizes.length === 0
                                    ? "bg-black text-white border-black"
                                    : "bg-[#F4F0EA]/60 border-neutral-300/80 text-black hover:border-black"
                                    }`}
                            >
                                All
                            </button>
                            {activeSizes.map((sz) => {
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
                            <button
                                type="button"
                                onClick={() => setSelectedSeries([])}
                                className={`px-4 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer ${selectedSeries.length === 0
                                    ? "bg-black text-white border-black"
                                    : "bg-[#F4F0EA]/60 border-neutral-300/80 text-black hover:border-black"
                                    }`}
                            >
                                All
                            </button>
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
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-black">Colours</h3>
                            {availableColors && availableColors.length > 8 && (
                                <button
                                    type="button"
                                    onClick={() => setShowAllColors(!showAllColors)}
                                    className="text-xs text-neutral-500 hover:text-black font-medium transition-colors cursor-pointer"
                                >
                                    {showAllColors ? "Show Less" : `View All (${availableColors.length})`}
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-3 pt-1">
                            {(() => {
                                const list = (availableColors && availableColors.length > 0) ? availableColors : fetchedColors;
                                const hasMoreThan8 = list.length > 8;
                                const displayedList = (hasMoreThan8 && !showAllColors) ? list.slice(0, 8) : list;

                                return (
                                    <>
                                        {/* All Colors Swatch Button */}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedColors([])}
                                            className={`w-7 h-7 rounded-full overflow-hidden transition-transform cursor-pointer relative grid grid-cols-2 grid-rows-2 border border-neutral-300 ${selectedColors.length === 0 ? "scale-110 ring-2 ring-black ring-offset-2" : "hover:scale-105 opacity-80 hover:opacity-100"
                                                }`}
                                            title="All Colors"
                                        >
                                            <span className="bg-[#E53E3E]" />
                                            <span className="bg-[#ED8936]" />
                                            <span className="bg-[#3182CE]" />
                                            <span className="bg-[#38A169]" />
                                        </button>

                                        {displayedList.map((c, i) => {
                                            const isSelected = selectedColors.includes(c.hex);
                                            return (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => toggleColor(c.hex)}
                                                    style={{ backgroundColor: c.hex }}
                                                    className={`w-7 h-7 rounded-full transition-transform cursor-pointer relative ${isSelected ? "scale-110 ring-2 ring-black ring-offset-2" : "hover:scale-105"
                                                        }`}
                                                    title={c.name}
                                                />
                                            );
                                        })}
                                    </>
                                );
                            })()}
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
