import React from "react";
import { useNavigate } from "react-router-dom";
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
import type { UnitType } from "../api/types";
import { formatPower } from "../lib/units";

interface LandingPageProps {
  unit: UnitType;
}

export const LandingPage: React.FC<LandingPageProps> = ({ unit }) => {
  const navigate = useNavigate();

  const scrollToFeatures = () => {
    const el = document.getElementById("features-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="w-full bg-[#070b09] text-white font-sans antialiased selection:bg-neutral-700 selection:text-white">
      {/* Full-Bleed Cinematic Hero Section */}
      <div className="relative min-h-[85vh] w-full flex flex-col justify-end overflow-hidden bg-black pb-16 sm:pb-20 pt-20 sm:pt-28">
        {/* Cinematic Background Image with Gradient Overlays */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-100"
          style={{ backgroundImage: `url('/hero-bg.jpg')` }}
        >
          {/* Top & Bottom Cinematic Vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#070b09]/80 via-transparent to-[#070b09]" />
          <div className="absolute inset-0 bg-radial-at-c from-transparent via-black/20 to-black/60" />
        </div>

        {/* Hero Headline & Subhead */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-8 space-y-2">
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-light text-white tracking-tight leading-[1.08]">
                Shaping Tomorrow&apos;s Energy
                <br />
                <span className="font-normal text-neutral-100">with Smart Solutions</span>
              </h1>
            </div>

            <div className="lg:col-span-4 lg:pb-2">
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-light max-w-md">
                Quantitative UK wind forecast intelligence. Zero-lookahead decision precision for day-ahead electricity buying.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-6 sm:pt-8">
            <button
              onClick={scrollToFeatures}
              className="px-6 py-2.5 rounded-full bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold tracking-wide transition-all shadow-md shadow-black/10 active:scale-95"
            >
              Discover
            </button>
            <button
              onClick={() => navigate("/decision")}
              className="px-6 py-2.5 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/30 backdrop-blur-md text-xs font-medium tracking-wide transition-all active:scale-95 flex items-center gap-2"
            >
              <span>Explore Engine</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div id="features-section" className="max-w-7xl mx-auto px-6 sm:px-10 py-12 space-y-12">
        {/* KPI Strip: Clean & Punchy */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <span className="text-[11px] uppercase tracking-widest text-neutral-400 font-medium">
                Verified Benchmark
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                January 2026 Ground Truth
              </h2>
            </div>
            <span className="text-xs text-neutral-400 font-mono hidden sm:inline-block">
              Freeze: 09:00 Europe/London D-1
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-5 backdrop-blur-sm hover:border-neutral-700 transition-colors">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                <span>Month Coverage</span>
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div className="text-3xl font-light text-white tracking-tight">100.0%</div>
              <p className="text-[11px] text-neutral-500 mt-1">744 of 744 target hours</p>
            </div>

            <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-5 backdrop-blur-sm hover:border-neutral-700 transition-colors">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                <span>Systematic Bias</span>
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <div className="text-3xl font-light text-white tracking-tight">
                +{formatPower(1851.53, unit, true)}
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">Consistent over-forecast</p>
            </div>

            <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-5 backdrop-blur-sm hover:border-neutral-700 transition-colors">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                <span>Mean Absolute Error</span>
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div className="text-3xl font-light text-white tracking-tight">
                {formatPower(2127.48, unit, true)}
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">18.37% normalized MAE</p>
            </div>

            <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-5 backdrop-blur-sm hover:border-neutral-700 transition-colors">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                <span>P95 Safety Buffer</span>
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div className="text-3xl font-light text-white tracking-tight">
                {formatPower(5350.90, unit, true)}
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">95% shortfall protection</p>
            </div>
          </div>
        </div>

        {/* 4 Specialized Modules: Concise & Visual */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-widest text-neutral-400 font-medium">
                Decision Suite
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                Four Core Analytics Engines
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1 */}
            <div
              onClick={() => navigate("/decision")}
              className="group cursor-pointer rounded-2xl border border-neutral-800/80 bg-neutral-900/40 hover:bg-neutral-900/80 p-6 transition-all hover:border-neutral-600"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="inline-flex items-center text-xs font-medium text-white group-hover:translate-x-1 transition-transform">
                  Launch <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">
                Auction Decision Engine
              </h3>
              <p className="text-xs text-neutral-400 font-light leading-relaxed mb-4">
                Locks latest forecast published before the 09:00 D-1 deadline, eliminating retrospective lookahead bias for auction bidding.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700/60 font-medium">
                  09:00 Freeze
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700/60 font-medium">
                  EPEX & Nord Pool
                </span>
              </div>
            </div>

            {/* Card 2 */}
            <div
              onClick={() => navigate("/accuracy")}
              className="group cursor-pointer rounded-2xl border border-neutral-800/80 bg-neutral-900/40 hover:bg-neutral-900/80 p-6 transition-all hover:border-neutral-600"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span className="inline-flex items-center text-xs font-medium text-white group-hover:translate-x-1 transition-transform">
                  Launch <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">
                Accuracy & Diurnal Diagnostics
              </h3>
              <p className="text-xs text-neutral-400 font-light leading-relaxed mb-4">
                Full January error profile tracking MAE, RMSE, Pearson bias, and 24-hour diurnal patterns across morning and evening peak hours.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700/60 font-medium">
                  24h Diurnal Curve
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700/60 font-medium">
                  P50 / P90 / P95
                </span>
              </div>
            </div>

            {/* Card 3 */}
            <div
              onClick={() => navigate("/horizon")}
              className="group cursor-pointer rounded-2xl border border-neutral-800/80 bg-neutral-900/40 hover:bg-neutral-900/80 p-6 transition-all hover:border-neutral-600"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="inline-flex items-center text-xs font-medium text-white group-hover:translate-x-1 transition-transform">
                  Launch <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">
                Lead-Time Horizon Degradation
              </h3>
              <p className="text-xs text-neutral-400 font-light leading-relaxed mb-4">
                Measures error decay across 18,080 forecast revisions from short-term intraday (0-6h) to day-ahead auction (18-24h) and beyond.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700/60 font-medium">
                  Horizon Decay
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700/60 font-medium">
                  0-72h Lead Times
                </span>
              </div>
            </div>

            {/* Card 4 */}
            <div
              onClick={() => navigate("/buffer")}
              className="group cursor-pointer rounded-2xl border border-neutral-800/80 bg-neutral-900/40 hover:bg-neutral-900/80 p-6 transition-all hover:border-neutral-600"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="inline-flex items-center text-xs font-medium text-white group-hover:translate-x-1 transition-transform">
                  Launch <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">
                Empirical Safety Buffer Sizing
              </h3>
              <p className="text-xs text-neutral-400 font-light leading-relaxed mb-4">
                Recommends hourly reserve procurement sized to historical empirical shortfall quantiles (P90 and P95) to minimize imbalance penalties.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700/60 font-medium">
                  Hourly Sizing
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700/60 font-medium">
                  Hedging Risk
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Market Economics: Visual 3-Column Strip (Not Text Heavy) */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-4">
            <div>
              <span className="text-[11px] uppercase tracking-widest text-neutral-400 font-medium">
                Day-Ahead Reality
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                Why Power Buyers Must Buffer
              </h3>
            </div>
            <span className="text-xs text-neutral-400 font-light">
              Average Over-Prediction: <strong className="text-white font-semibold">+{formatPower(1851.53, unit, false)}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-neutral-800/80 bg-neutral-950/60 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-white font-medium text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-white" />
                <span>1. Over-Forecast Trap</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-light">
                Unhedged nominal buying leaves traders short during physical delivery, incurring punitive imbalance cash-out prices.
              </p>
            </div>

            <div className="border border-neutral-800/80 bg-neutral-950/60 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-white font-medium text-xs">
                <Clock className="w-3.5 h-3.5 text-white" />
                <span>2. Gate Deadlines</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-light">
                EPEX SPOT (09:20) and Nord Pool (09:50) close early, requiring decisions to freeze at 09:00 D-1.
              </p>
            </div>

            <div className="border border-neutral-800/80 bg-neutral-950/60 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-white font-medium text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                <span>3. Quantile Hedging</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-light">
                Procuring empirical P90 or P95 reserve buffers hedges 90% to 95% of unexpected physical shortfalls.
              </p>
            </div>
          </div>
        </div>

        {/* Compact Methodology Banner */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
              <Database className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-white text-xs sm:text-sm">
                Official Elexon BMRS Stream Pipeline
              </div>
              <p className="text-[11px] text-neutral-400 font-light mt-0.5">
                FUELHH actuals & WINDFOR forecasts with complete Europe/London DST handling.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/methodology")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-neutral-200 text-xs font-semibold text-neutral-950 whitespace-nowrap transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            Explore Methodology
          </button>
        </div>
      </div>
    </div>
  );
};
