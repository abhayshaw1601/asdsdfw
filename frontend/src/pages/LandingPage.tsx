import React from "react";
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle2,
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
  const scrollToFeatures = () => {
    const el = document.getElementById("features-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="w-full bg-[#070b09] text-white font-sans antialiased selection:bg-emerald-600 selection:text-white">
      {/* Full-Bleed Cinematic Hero Section */}
      <div className="relative min-h-[95vh] w-full flex flex-col justify-between overflow-hidden bg-black">
        {/* Cinematic Background Image with Gradient Overlays */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-100"
          style={{ backgroundImage: `url('/hero-bg.jpg')` }}
        >
          {/* Subtle Top & Bottom Cinematic Vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-[#070b09]" />
          <div className="absolute inset-0 bg-radial-at-c from-transparent via-black/15 to-black/60" />
        </div>

        {/* Minimalist Floating Navigation Bar (Matching Reference) */}
        <header className="relative z-30 w-full max-w-7xl mx-auto px-6 sm:px-10 pt-8 pb-4 flex items-center justify-between">
          {/* Brand Glyph Logo */}
          <div
            onClick={() => onNavigate("overview")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
              {/* Reference-style geometric crescent glyph */}
              <svg
                className="w-10 h-7 text-neutral-900 fill-neutral-900 drop-shadow-sm"
                viewBox="0 0 54 36"
                fill="currentColor"
              >
                <path d="M10 18 C10 8 15 2 19 2 C16 7 16 29 19 34 C15 34 10 28 10 18 Z" />
                <path d="M22 18 C22 6 27 0 31 0 C28 5 28 31 31 36 C27 36 22 30 22 18 Z" />
                <circle cx="43" cy="18" r="9" />
              </svg>
            </div>
            <span className="font-semibold text-neutral-900 tracking-tight text-sm hidden sm:inline-block">
              Elexon Portal
            </span>
          </div>

          {/* Clean Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-neutral-900/90 tracking-wide">
            <button
              onClick={() => onNavigate("decision")}
              className="hover:text-black transition-colors"
            >
              Technology
            </button>
            <button
              onClick={() => onNavigate("accuracy")}
              className="hover:text-black transition-colors"
            >
              Accuracy
            </button>
            <button
              onClick={() => onNavigate("horizon")}
              className="hover:text-black transition-colors"
            >
              Horizon
            </button>
            <button
              onClick={() => onNavigate("buffer")}
              className="hover:text-black transition-colors"
            >
              Buffer Guidance
            </button>
            <button
              onClick={() => onNavigate("methodology")}
              className="hover:text-black transition-colors"
            >
              Vision & Mission
            </button>
          </nav>

          {/* Right Action Button (Black Pill with Arrow) */}
          <button
            onClick={() => onNavigate("decision")}
            className="inline-flex items-center gap-2.5 pl-5 pr-2 py-2 rounded-full bg-neutral-950 hover:bg-neutral-900 text-white text-xs font-medium tracking-wide shadow-lg shadow-black/20 hover:shadow-black/40 transition-all group"
          >
            <span>Contact us</span>
            <span className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </span>
          </button>
        </header>

        {/* Hero Headline & Subhead (Lower Half of Screen) */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 pb-16 sm:pb-24 pt-32 sm:pt-48 flex flex-col justify-end">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            {/* Big Elegant Title */}
            <div className="lg:col-span-8 space-y-3">
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-light text-white tracking-tight leading-[1.08]">
                Shaping Tomorrow&apos;s Energy
                <br />
                <span className="font-normal text-neutral-100">with Smart Solutions</span>
              </h1>
            </div>

            {/* Right Supporting Text */}
            <div className="lg:col-span-4 lg:pb-3">
              <p className="text-xs sm:text-sm text-neutral-300/90 leading-relaxed font-light max-w-md">
                Offering quantitative, zero-lookahead UK wind forecast decision intelligence. Minimizing the severe physical shortfall risks and imbalance cash-out costs for day-ahead power buyers.
              </p>
            </div>
          </div>

          {/* Action Buttons in Pill Shape (Matching Reference) */}
          <div className="flex items-center gap-3 pt-8 sm:pt-10">
            <button
              onClick={scrollToFeatures}
              className="px-6 py-2.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-950 text-xs font-semibold tracking-wide transition-all shadow-md shadow-black/10 active:scale-95"
            >
              Discover
            </button>
            <button
              onClick={() => onNavigate("decision")}
              className="px-6 py-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/30 backdrop-blur-md text-xs font-medium tracking-wide transition-all active:scale-95"
            >
              Technology
            </button>
          </div>
        </div>
      </div>

      {/* Content Section: Ground-Truth Performance Numbers */}
      <div id="features-section" className="max-w-7xl mx-auto px-6 sm:px-10 py-16 space-y-16">
        {/* KPI Strip */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <span className="text-[11px] uppercase tracking-widest text-emerald-400 font-semibold">
                January 2026 Ground Truth
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
                Elexon BMRS Verified Benchmark Metrics
              </h2>
            </div>
            <span className="text-xs text-neutral-400 font-mono hidden sm:inline-block">
              Freeze: 09:00 Europe/London D-1
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                <span>Month Coverage</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-light text-white tracking-tight">100.0%</div>
              <p className="text-[11px] text-neutral-500 mt-1">744 of 744 target hours (0 gaps)</p>
            </div>

            <div className="bg-neutral-900/60 border border-amber-500/20 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-amber-400 mb-2">
                <span>Systematic Bias</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-light text-amber-400 tracking-tight">
                +{formatPower(1851.53, unit, true)}
              </div>
              <p className="text-[11px] text-amber-300/70 mt-1">Forecast systematically over-predicts</p>
            </div>

            <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                <span>Mean Absolute Error</span>
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div className="text-3xl font-light text-white tracking-tight">
                {formatPower(2127.48, unit, true)}
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">Normalized MAE: 18.37% of actuals</p>
            </div>

            <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-white mb-2">
                <span>P95 Reserve Buffer</span>
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div className="text-3xl font-light text-white tracking-tight">
                {formatPower(5350.90, unit, true)}
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">Hedges 95% of extreme shortfalls</p>
            </div>
          </div>
        </div>

        {/* 4 Specialized Trading Modules */}
        <div className="space-y-6">
          <div className="max-w-2xl">
            <span className="text-[11px] uppercase tracking-widest text-emerald-400 font-semibold">
              Platform Architecture
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
              Four Core Quantitative Modules
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Engineered to convert volatile weather predictions into actionable, de-risked trading orders
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1 */}
            <div
              onClick={() => onNavigate("decision")}
              className="group cursor-pointer rounded-2xl border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900/80 p-8 transition-all hover:border-neutral-600"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center text-xs font-medium text-white group-hover:translate-x-1 transition-transform">
                  Launch View <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-white transition-colors">
                Zero-Lookahead Auction Decision Engine
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-light">
                Enforces a strict 09:00 London deadline freeze prior to EPEX SPOT (09:20) and Nord Pool (09:50) auction gate closures. Completely eliminates lookahead bias by filtering only revisions physically published prior to cutoff.
              </p>
            </div>

            {/* Card 2 */}
            <div
              onClick={() => onNavigate("accuracy")}
              className="group cursor-pointer rounded-2xl border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900/80 p-8 transition-all hover:border-neutral-600"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center text-xs font-medium text-white group-hover:translate-x-1 transition-transform">
                  Launch View <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-white transition-colors">
                Accuracy & Diurnal Error Diagnostics
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-light">
                Comprehensive error breakdown across MAE, RMSE, Pearson bias, and error quantiles (P50, P90, P95). Includes a 24-hour diurnal profile identifying morning and evening peak volatility windows.
              </p>
            </div>

            {/* Card 3 */}
            <div
              onClick={() => onNavigate("horizon")}
              className="group cursor-pointer rounded-2xl border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900/80 p-8 transition-all hover:border-neutral-600"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center text-xs font-medium text-white group-hover:translate-x-1 transition-transform">
                  Launch View <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-white transition-colors">
                Lead-Time Horizon Degradation
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-light">
                Quantifies forecast decay from intraday (0-6h MAE of 1,768 MW) out to standard day-ahead (18-24h MAE of 2,119 MW) and medium-range (48-72h MAE of 2,864 MW). Critical for battery and storage dispatch.
              </p>
            </div>

            {/* Card 4 */}
            <div
              onClick={() => onNavigate("buffer")}
              className="group cursor-pointer rounded-2xl border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900/80 p-8 transition-all hover:border-neutral-600"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center text-xs font-medium text-white group-hover:translate-x-1 transition-transform">
                  Launch View <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-white transition-colors">
                Empirical Safety Buffer Guidance
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-light">
                Calculates empirical quantiles of historical over-forecast shortfalls. Informs the trading desk exactly how much firm baseload power or battery discharge to procure for 50%, 90%, or 95% certainty.
              </p>
            </div>
          </div>
        </div>

        {/* The Day-Ahead Trading Reality */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8 sm:p-10 space-y-6">
          <div className="max-w-3xl">
            <span className="text-[11px] uppercase tracking-widest text-emerald-400 font-semibold">
              Market Economics
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1 mb-2">
              Why Day-Ahead Power Buyers Must Procure with Buffers
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-light">
              In Great Britain, national wind forecasts systematically over-predict generation during winter peak demand. In January 2026, the average over-estimation was <span className="font-semibold text-amber-400">+{formatPower(1851.53, unit, true)}</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="border border-neutral-800/80 bg-black/40 rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>1. The Unhedged Trap</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-light">
                Procuring solely based on nominal forecasts leaves buyers short, exposing them to punitive System Buy Price (SBP) cash-out imbalance penalties from the National Grid.
              </p>
            </div>

            <div className="border border-neutral-800/80 bg-black/40 rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold text-xs">
                <Clock className="w-4 h-4" />
                <span>2. Auction Gate Deadlines</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-light">
                EPEX SPOT (09:20) and Nord Pool (09:50) order book closures force a decision freeze at 09:00 D-1. Later forecasts cannot assist day-ahead positioning.
              </p>
            </div>

            <div className="border border-neutral-800/80 bg-black/40 rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>3. Quantitative Buffering</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-light">
                Co-procuring our recommended P90 or P95 reserve buffer eliminates 90% to 95% of unexpected physical shortfalls while optimizing balancing spend.
              </p>
            </div>
          </div>
        </div>

        {/* Methodology & Data Callout */}
        <div className="rounded-2xl border border-neutral-800 bg-gradient-to-r from-neutral-900/80 via-neutral-900/40 to-neutral-950 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Official Elexon BMRS Ingestion Pipeline</span>
            </div>
            <p className="text-xs text-neutral-400 max-w-2xl font-light">
              Ingesting FUELHH (actual wind generation) and WINDFOR (multi-revision forecasts) with complete DST Europe/London conversion and rigorous backtested mathematical integrity.
            </p>
          </div>

          <button
            onClick={() => onNavigate("methodology")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-neutral-200 text-xs font-semibold text-neutral-950 whitespace-nowrap transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            Explore Methodology
          </button>
        </div>
      </div>
    </div>
  );
};
