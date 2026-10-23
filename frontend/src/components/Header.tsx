import React from "react";
import { Zap } from "lucide-react";
import { NAV_ITEMS, type NavTab } from "./navigation";
import type { UnitType } from "../api/types";

interface HeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  unit: UnitType;
  onUnitToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  unit,
  onUnitToggle,
}) => {
  return (
    <header className="border-b border-neutral-800/80 bg-[#070b09]/95 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity matching landing page */}
          <button
            onClick={() => onTabChange("overview")}
            className="flex items-center gap-3 text-left focus:outline-none group"
          >
            <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
              <svg
                className="w-8 h-6 text-white fill-white drop-shadow-sm"
                viewBox="0 0 54 36"
                fill="currentColor"
              >
                <path d="M10 18 C10 8 15 2 19 2 C16 7 16 29 19 34 C15 34 10 28 10 18 Z" />
                <path d="M22 18 C22 6 27 0 31 0 C28 5 28 31 31 36 C27 36 22 30 22 18 Z" />
                <circle cx="43" cy="18" r="9" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-tight text-base sm:text-lg">
                  Wind Forecast Decision Portal
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-white border border-neutral-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Elexon BMRS 2026
                </span>
              </div>
              <p className="text-xs text-neutral-400 hidden sm:block font-light">
                Day-ahead power procurement & shortfall buffer sizing
              </p>
            </div>
          </button>

          {/* Right Controls: Unit Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={onUnitToggle}
              title={`Switch unit to ${unit === "MW" ? "GW" : "MW"}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 rounded-full text-xs font-semibold text-white transition-colors shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-white opacity-80" />
              <span className="text-neutral-400 font-light">Unit:</span>
              <span className="text-white font-bold">{unit}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 border-t border-neutral-850/80 pt-1.5 pb-2.5 overflow-x-auto no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-white text-black font-semibold shadow-sm shadow-white/10"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
