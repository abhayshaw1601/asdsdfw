import React from "react";
import { BookOpen, ShieldCheck, CheckCircle2, Database, Cpu, Layers } from "lucide-react";

export const MethodologyPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Intro Header */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.05] hover:bg-white/[0.07] backdrop-blur-2xl border border-white/20 p-5 sm:p-6 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.25),0_12px_36px_rgba(0,0,0,0.45)] transition-all">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
              System Architecture & Methodology Specifications
            </h2>
            <p className="text-xs text-neutral-300 font-light mt-0.5">
              Technical standards and mathematical formulation for zero-lookahead day-ahead wind power decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Decision Rule & No-Lookahead Guarantee */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="relative overflow-hidden rounded-2xl bg-white/[0.05] hover:bg-white/[0.07] backdrop-blur-2xl border border-white/20 p-5 sm:p-6 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.25),0_12px_36px_rgba(0,0,0,0.45)] transition-all space-y-3">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
          <div className="flex items-center gap-2 text-white font-semibold text-xs sm:text-sm">
            <ShieldCheck className="w-4 h-4 text-white" />
            Auction Gate Closure Rule
          </div>
          <p className="text-xs text-neutral-300 font-light">
            Electricity orders on UK day-ahead auctions close between <strong>09:20 and 09:50 UK time</strong>.
          </p>
          <div className="bg-white/[0.06] p-3 rounded-xl border border-white/15 text-xs space-y-1 font-light backdrop-blur-md">
            <span className="font-medium text-white">Default Freeze: </span>
            <span className="text-neutral-200">09:00 Europe/London (D-1)</span>
            <p className="text-[11px] text-neutral-300">20-minute operational buffer before auction gate.</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-white/[0.05] hover:bg-white/[0.07] backdrop-blur-2xl border border-white/20 p-5 sm:p-6 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.25),0_12px_36px_rgba(0,0,0,0.45)] transition-all space-y-3">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
          <div className="flex items-center gap-2 text-white font-semibold text-xs sm:text-sm">
            <CheckCircle2 className="w-4 h-4 text-white" />
            Strict No-Lookahead Guarantee
          </div>
          <p className="text-xs text-neutral-300 font-light">
            Enforces strict temporal separation to eliminate retrospective bias:
          </p>
          <div className="bg-white/[0.06] p-3 rounded-xl border border-white/15 font-mono text-xs text-white backdrop-blur-md">
            publishTime &le; deadline_utc(delivery_day(t))
          </div>
          <p className="text-[11px] text-neutral-300 font-light">
            Forecasts published after deadline are mathematically barred. Verified by unit tests.
          </p>
        </div>
      </div>

      {/* Risk Asymmetry */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.05] hover:bg-white/[0.07] backdrop-blur-2xl border border-white/20 p-5 sm:p-6 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.25),0_12px_36px_rgba(0,0,0,0.45)] transition-all space-y-3">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
        <h3 className="text-xs sm:text-sm font-semibold text-white tracking-tight flex items-center gap-2">
          <Layers className="w-4 h-4 text-white" />
          Commercial Risk Asymmetry
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="bg-white/[0.06] border border-white/15 rounded-xl p-3.5 text-xs space-y-1 backdrop-blur-md">
            <span className="font-semibold text-white">Over-Forecast (Error &gt; 0) &rarr; Shortfall</span>
            <p className="text-neutral-300 text-[11px] font-light">
              Wind falls short of procurement. Buyer must purchase expensive balancing power at cash-out prices.
            </p>
          </div>
          <div className="bg-white/[0.06] border border-white/15 rounded-xl p-3.5 text-xs space-y-1 backdrop-blur-md">
            <span className="font-semibold text-white">Under-Forecast (Error &lt; 0) &rarr; Spill</span>
            <p className="text-neutral-300 text-[11px] font-light">
              Generation exceeds expectations. Excess power is sold in intraday or system buy price.
            </p>
          </div>
        </div>
      </div>

      {/* Mathematical Formulas */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.05] hover:bg-white/[0.07] backdrop-blur-2xl border border-white/20 p-5 sm:p-6 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.25),0_12px_36px_rgba(0,0,0,0.45)] transition-all space-y-4">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
        <h3 className="text-xs sm:text-sm font-semibold text-white tracking-tight flex items-center gap-2">
          <Cpu className="w-4 h-4 text-white" />
          Mathematical Metric Definitions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white/[0.06] p-3 rounded-xl border border-white/15 space-y-1 backdrop-blur-md">
            <span className="text-[10px] text-neutral-300 uppercase tracking-wider font-light">Error</span>
            <div className="font-mono text-white text-xs">Forecast - Actual</div>
          </div>
          <div className="bg-white/[0.06] p-3 rounded-xl border border-white/15 space-y-1 backdrop-blur-md">
            <span className="text-[10px] text-neutral-300 uppercase tracking-wider font-light">MAE</span>
            <div className="font-mono text-white text-xs">(1/N) &sum; |Error|</div>
          </div>
          <div className="bg-white/[0.06] p-3 rounded-xl border border-white/15 space-y-1 backdrop-blur-md">
            <span className="text-[10px] text-neutral-300 uppercase tracking-wider font-light">RMSE</span>
            <div className="font-mono text-white text-xs">&radic;((1/N) &sum; Error&sup2;)</div>
          </div>
          <div className="bg-white/[0.06] p-3 rounded-xl border border-white/15 space-y-1 backdrop-blur-md">
            <span className="text-[10px] text-neutral-300 uppercase tracking-wider font-light">nMAE</span>
            <div className="font-mono text-white text-xs">MAE / Mean(Actual)</div>
          </div>
          <div className="bg-white/[0.06] p-3 rounded-xl border border-white/15 space-y-1 backdrop-blur-md">
            <span className="text-[10px] text-neutral-300 uppercase tracking-wider font-light">Bias</span>
            <div className="font-mono text-white text-xs">(1/N) &sum; Error</div>
          </div>
          <div className="bg-white/[0.06] p-3 rounded-xl border border-white/15 space-y-1 backdrop-blur-md">
            <span className="text-[10px] text-neutral-300 uppercase tracking-wider font-light">Buffer(q, h)</span>
            <div className="font-mono text-white text-xs">Quantile_q(max(E, 0))</div>
          </div>
        </div>
      </div>

      {/* Data Ingestion Pipeline Specifications */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.05] hover:bg-white/[0.07] backdrop-blur-2xl border border-white/20 p-5 sm:p-6 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.25),0_12px_36px_rgba(0,0,0,0.45)] transition-all space-y-3">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
        <h3 className="text-xs sm:text-sm font-semibold text-white tracking-tight flex items-center gap-2">
          <Database className="w-4 h-4 text-white" />
          Ingested National Streams
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-white/[0.06] border border-white/15 rounded-xl p-3.5 space-y-1 backdrop-blur-md">
            <span className="font-semibold text-white">FUELHH (Actuals)</span>
            <p className="text-neutral-300 text-[11px] font-light">
              1,488 half-hours covering 100% of January 2026. Zero missing periods.
            </p>
          </div>
          <div className="bg-white/[0.06] border border-white/15 rounded-xl p-3.5 space-y-1 backdrop-blur-md">
            <span className="font-semibold text-white">WINDFOR (Forecasts)</span>
            <p className="text-neutral-300 text-[11px] font-light">
              18,080 forecast revisions from Dec 15, 2025 to Feb 1, 2026.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
