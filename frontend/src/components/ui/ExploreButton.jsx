"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";

export default function ExploreButton({
    text = "Explore",
    icon: Icon = ArrowUpRight,
    className = "",
    onClick,
}) {
    return (
        <button
            onClick={onClick}
            className={`group/btn relative inline-flex items-center justify-center border border-white/20 hover:border-white/40 rounded-full py-2 pl-6 pr-6 hover:pr-2 group-hover:pr-2 bg-[#101820]/40 backdrop-blur-md text-white transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[#101820]/60 group-hover:bg-[#101820]/60 cursor-pointer ${className}`}
        >
            <span className="text-sm font-medium tracking-wider select-none">
                {text}
            </span>
            <span className="flex items-center justify-center max-w-0 opacity-0 scale-75 translate-x-8 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover/btn:max-w-10 group-hover/btn:opacity-100 group-hover/btn:scale-100 group-hover/btn:translate-x-0 group-hover/btn:ml-2 group-hover:max-w-10 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 group-hover:ml-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#C5B9AC] text-[#101820] transition-transform duration-700 group-hover/btn:rotate-45 group-hover:rotate-45">
                    {Icon && (
                        <Icon className="h-4 w-4 stroke-[2.5] opacity-0 scale-50 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover/btn:opacity-100 group-hover/btn:scale-100 group-hover:opacity-100 group-hover:scale-100" />
                    )}
                </span>
            </span>
        </button>
    );
}
