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
    <div className="w-full text-white font-sans antialiased selection:bg-neutral-700 selection:text-white">
      {/* Cinematic Hero Section */}
      <div className="relative min-h-[85vh] w-full flex flex-col justify-end overflow-hidden pb-16 sm:pb-20 pt-20 sm:pt-28">
        {/* Background Image with Gradient Overlays */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-100"
          style={{ backgroundImage: `url('/hero-bg.jpg')` }}
        >
          {/* Subtle vignette letting the scenery show through */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#070b09]" />
          <div className="absolute inset-0 bg-radial-at-c from-transparent via-black/10 to-black/50" />
        </div>

        {/* Hero Headline & Actions */}
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
              <p className="text-xs sm:text-sm text-neutral-300 font-light max-w-sm">
                Zero-lookahead UK wind intelligence for day-ahead power buyers.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-6 sm:pt-8">
            <button
              onClick={scrollToFeatures}
              className="px-6 py-2.5 rounded-full bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold tracking-wide transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Discover
            </button>
            <button
              onClick={() => navigate("/decision")}
              className="px-6 py-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/20 backdrop-blur-md text-xs font-medium tracking-wide transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>Explore Engine</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div id="features-section" className="max-w-7xl mx-auto px-6 sm:px-10 py-10 space-y-10">
        {/* KPI Strip */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
              January 2026 Ground Truth
            </h2>
            <span className="text-xs text-neutral-400 font-mono">
              Freeze: 09:00 London D-1
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl hover:border-white/20 transition-all">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
                <span className="uppercase tracking-wider text-[11px]">Coverage</span>
                <CheckCircle2 className="w-4 h-4 text-white opacity-80" />
              </div>
              <div className="text-2xl sm:text-3xl font-light text-white tracking-tight">100%</div>
              <p className="text-[11px] text-neutral-400 mt-1">744 of 744 hours</p>
            </div>

            <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl hover:border-white/20 transition-all">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
                <span className="uppercase tracking-wider text-[11px]">Mean Bias</span>
                <AlertTriangle className="w-4 h-4 text-white opacity-80" />
              </div>
              <div className="text-2xl sm:text-3xl font-light text-white tracking-tight">
                +{formatPower(1851.53, unit, true)}
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">Systematic over-forecast</p>
            </div>

            <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl hover:border-white/20 transition-all">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
                <span className="uppercase tracking-wider text-[11px]">MAE</span>
                <BarChart3 className="w-4 h-4 text-white opacity-80" />
              </div>
              <div className="text-2xl sm:text-3xl font-light text-white tracking-tight">
                {formatPower(2127.48, unit, true)}
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">18.4% normalized</p>
            </div>

            <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl hover:border-white/20 transition-all">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
                <span className="uppercase tracking-wider text-[11px]">P95 Buffer</span>
                <ShieldCheck className="w-4 h-4 text-white opacity-80" />
              </div>
              <div className="text-2xl sm:text-3xl font-light text-white tracking-tight">
                {formatPower(5350.90, unit, true)}
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">Shortfall protection</p>
            </div>
          </div>
        </div>

        {/* 4 Specialized Modules: Glassmorphism */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
              Analytical Decision Suite
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1 */}
            <div
              onClick={() => navigate("/decision")}
              className="group cursor-pointer rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl hover:bg-black/45 hover:border-white/25 p-5 sm:p-6 transition-all shadow-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="inline-flex items-center text-xs font-medium text-white group-hover:translate-x-1 transition-transform">
                  Launch <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
                Auction Decision Engine
              </h3>
              <p className="text-xs text-neutral-400 font-light mb-3">
                Zero-lookahead forecast snapshot frozen at 09:00 D-1 auction gate.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/15">
                  09:00 Freeze
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/15">
                  EPEX & Nord Pool
                </span>
              </div>
            </div>

            {/* Card 2 */}
            <div
              onClick={() => navigate("/accuracy")}
              className="group cursor-pointer rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl hover:bg-black/45 hover:border-white/25 p-5 sm:p-6 transition-all shadow-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span className="inline-flex items-center text-xs font-medium text-white group-hover:translate-x-1 transition-transform">
                  Launch <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
                Accuracy & Diurnal Diagnostics
              </h3>
              <p className="text-xs text-neutral-400 font-light mb-3">
                24-hour diurnal profiling, MAE, RMSE, and quantiles (P50/P90/P95).
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/15">
                  Diurnal Curve
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/15">
                  P50 / P90 / P95
                </span>
              </div>
            </div>

            {/* Card 3 */}
            <div
              onClick={() => navigate("/horizon")}
              className="group cursor-pointer rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl hover:bg-black/45 hover:border-white/25 p-5 sm:p-6 transition-all shadow-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="inline-flex items-center text-xs font-medium text-white group-hover:translate-x-1 transition-transform">
                  Launch <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
                Horizon Error Degradation
              </h3>
              <p className="text-xs text-neutral-400 font-light mb-3">
                Lead-time error decay tracking from 0h intraday out to 72h medium-range.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/15">
                  18,080 Updates
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/15">
                  0-72h Lead
                </span>
              </div>
            </div>

            {/* Card 4 */}
            <div
              onClick={() => navigate("/buffer")}
              className="group cursor-pointer rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl hover:bg-black/45 hover:border-white/25 p-5 sm:p-6 transition-all shadow-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="inline-flex items-center text-xs font-medium text-white group-hover:translate-x-1 transition-transform">
                  Launch <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
                Empirical Safety Buffer Sizing
              </h3>
              <p className="text-xs text-neutral-400 font-light mb-3">
                Hourly reserve procurement sized to historical P90/P95 shortfalls.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/15">
                  Hourly Sizing
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/15">
                  Hedge Risk
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual 3-Pillar Bar (Crisp, Low-Text) */}
        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-5 sm:p-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-white/10 bg-black/40 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white font-medium text-xs mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-white" />
                <span>Over-Forecast Asymmetry</span>
              </div>
              <p className="text-[11px] text-neutral-400 font-light">
                Average +1,852 MW surplus expectation exposes unhedged buyers to imbalance penalties.
              </p>
            </div>

            <div className="border border-white/10 bg-black/40 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white font-medium text-xs mb-1">
                <Clock className="w-3.5 h-3.5 text-white" />
                <span>Gate Closure Disciplines</span>
              </div>
              <p className="text-[11px] text-neutral-400 font-light">
                Day-ahead auctions freeze at 09:20 (EPEX) and 09:50 (Nord Pool).
              </p>
            </div>

            <div className="border border-white/10 bg-black/40 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white font-medium text-xs mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                <span>Empirical Protection</span>
              </div>
              <p className="text-[11px] text-neutral-400 font-light">
                Procuring empirical P90 or P95 reserve covers 90% to 95% of unexpected dropouts.
              </p>
            </div>
          </div>
        </div>

        {/* Compact Methodology Banner */}
        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
              <Database className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-white text-xs">
                Elexon BMRS Stream Pipeline
              </div>
              <p className="text-[11px] text-neutral-400 font-light">
                FUELHH actuals & WINDFOR forecasts • Full DST handling • MongoDB persistence
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/methodology")}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-neutral-200 text-xs font-semibold text-neutral-950 whitespace-nowrap transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            Methodology
          </button>
        </div>
      </div>
    </div>
  );
};
