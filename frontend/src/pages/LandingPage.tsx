import React from "react";
import {
  Wind,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Clock,
  ArrowRight,
  CheckCircle2,
  Zap,
  AlertTriangle,
  Layers,
  Database,
} from "lucide-react";
import type { NavTab } from "../components/navigation";
import type { UnitType } from "../api/types";
import { formatPower } from "../lib/units";

interface LandingPageProps {
  onNavigate: (tab: NavTab) => void;
  unit: UnitType;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, unit }) => {
  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/50 to-slate-950 p-8 sm:p-12 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Wind className="w-3.5 h-3.5 text-blue-400" />
            UK Wholesale Electricity Trading | Elexon BMRS Verified
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight sm:leading-tight">
            De-Risk Day-Ahead Power Buying Against{" "}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
              Wind Forecast Bias
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl">
            A production analytical platform built for UK power traders, balance responsible parties (BRPs), and procurement desks. 
            Enforces strict zero-lookahead auction decision freezes at 09:00 London time, diagnoses systematic over-forecast risks, and sizes quantitative safety buffers to protect against severe cash-out penalties.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onNavigate("decision")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              Launch Decision Engine
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate("buffer")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Explore Safety Buffers
            </button>

            <button
              onClick={() => onNavigate("accuracy")}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 font-medium text-sm transition-all"
            >
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Accuracy Benchmarks
            </button>
          </div>
        </div>
      </div>

      {/* Key Metric Strip (Jan 2026 Baseline Reference Figures) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>January 2026 Coverage</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">100.0%</div>
          <p className="text-xs text-slate-400 mt-1">744 of 744 target hours (0 gaps)</p>
        </div>

        <div className="bg-slate-900/80 border border-amber-500/20 bg-amber-500/5 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-amber-400 mb-1">
            <span>Systematic Bias</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">
            +{formatPower(1851.53, unit, true)}
          </div>
          <p className="text-xs text-amber-300/80 mt-1">Forecast systematically over-predicts</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Mean Absolute Error</span>
            <BarChart3 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatPower(2127.48, unit, true)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Normalized MAE: 18.37% of actuals</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>P95 Reserve Buffer</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 tracking-tight">
            {formatPower(5350.90, unit, true)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Hedges 95% of extreme shortfalls</p>
        </div>
      </div>

      {/* Feature Showcase Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Platform Analytical Capabilities
            </h2>
            <p className="text-xs text-slate-400">
              Four specialized trading modules designed to transition raw meteorological models into executable power bids
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Decision View */}
          <div
            onClick={() => onNavigate("decision")}
            className="group cursor-pointer bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-xl p-6 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Clock className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-blue-400 group-hover:translate-x-1 transition-transform">
                Open View <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
              Zero-Lookahead Auction Decision Engine
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enforces a strict 09:00 London deadline freeze prior to EPEX SPOT and Nord Pool gate closures. Completely eliminates lookahead bias by selecting only the latest forecast revision published prior to cut-off.
            </p>
          </div>

          {/* Card 2: Accuracy Diagnostics */}
          <div
            onClick={() => onNavigate("accuracy")}
            className="group cursor-pointer bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-xl p-6 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-purple-400 group-hover:translate-x-1 transition-transform">
                Open View <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
              Accuracy & Diurnal Error Diagnostics
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Comprehensive error breakdown across MAE, RMSE, Pearson bias, and error quantiles (P50, P90, P95). Includes a 24-hour diurnal profile identifying morning and evening peak volatility patterns.
            </p>
          </div>

          {/* Card 3: Horizon Degradation */}
          <div
            onClick={() => onNavigate("horizon")}
            className="group cursor-pointer bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-xl p-6 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
                Open View <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
              Lead-Time Horizon Degradation
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Quantifies forecast decay from intraday (0-6h MAE of 1,767 MW) out to day-ahead (18-24h MAE of 2,118 MW) and medium-range (48-72h MAE of 2,863 MW). Essential for scheduling multi-day storage assets.
            </p>
          </div>

          {/* Card 4: Safety Buffer Guidance */}
          <div
            onClick={() => onNavigate("buffer")}
            className="group cursor-pointer bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-xl p-6 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
                Open View <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
              Empirical Safety Buffer Guidance
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculates empirical quantiles of historical over-forecast shortfalls. Directly tells the trading desk how much backup power or battery discharge capacity to procure to achieve 50%, 90%, or 95% certainty.
            </p>
          </div>
        </div>
      </div>

      {/* The Market Reality: Why Procurement Needs Buffers */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="max-w-3xl">
          <h2 className="text-lg font-bold text-white tracking-tight mb-2">
            The Trading Reality: Why Day-Ahead Buyers Face Massive Shortfall Risks
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            In Great Britain, national wind generation forecasts exhibit a systematic positive bias. During cold winter periods like January 2026, forecasts over-estimated wind generation by an average of <span className="font-semibold text-amber-400">+{formatPower(1851.53, unit, true)}</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="border border-slate-800 bg-slate-950/60 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>1. The Unhedged Trap</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Procuring solely based on the nominal forecast leaves buyers physically short, requiring emergency intraday purchases or incurring punitive System Buy Price (SBP) cash-out charges.
            </p>
          </div>

          <div className="border border-slate-800 bg-slate-950/60 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
              <Clock className="w-4 h-4" />
              <span>2. Auction Deadlines</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              EPEX SPOT (09:20) and Nord Pool (09:50) order book closures force a decision freeze at 09:00 D-1. Intraday forecasts arriving after 09:00 cannot help day-ahead auction positioning.
            </p>
          </div>

          <div className="border border-slate-800 bg-slate-950/60 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>3. Quantitative Buffering</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              By co-procuring our recommended P90 or P95 reserve buffer, power buyers eliminate 90% to 95% of unexpected physical shortfalls while optimizing balancing costs.
            </p>
          </div>
        </div>
      </div>

      {/* Architecture & Methodology Callout */}
      <div className="border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Database className="w-4 h-4 text-blue-400" />
            <span>Built on Official Elexon BMRS Datasets</span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Ingesting FUELHH (actual wind generation) and WINDFOR (multi-revision forecasts) with complete DST Europe/London conversion and rigorous backtested mathematical integrity.
          </p>
        </div>

        <button
          onClick={() => onNavigate("methodology")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 whitespace-nowrap transition-colors"
        >
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          Read Full Methodology
        </button>
      </div>
    </div>
  );
};
