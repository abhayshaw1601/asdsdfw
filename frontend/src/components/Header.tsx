import React from "react";
import { Wind, Zap } from "lucide-react";
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
    <header className="border-b border-slate-800 bg-slate-950/95 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <button
            onClick={() => onTabChange("overview")}
            className="flex items-center gap-3 text-left focus:outline-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-tight text-base sm:text-lg">
                  Wind Forecast Decision Portal
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Elexon BMRS 2026
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Day-ahead power procurement & shortfall buffer sizing
              </p>
            </div>
          </button>

          {/* Right Controls: Unit Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={onUnitToggle}
              title={`Switch unit to ${unit === "MW" ? "GW" : "MW"}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-colors shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Unit:</span>
              <span className="text-white font-bold">{unit}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 border-t border-slate-850 pt-1 pb-2 overflow-x-auto no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-white text-black font-semibold shadow-sm shadow-white/10"
                    : "text-slate-300 hover:text-white hover:bg-slate-900"
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
