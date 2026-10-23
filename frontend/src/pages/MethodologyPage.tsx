import React from "react";
import { BookOpen, ShieldCheck, CheckCircle2, Database, Cpu, Layers } from "lucide-react";

export const MethodologyPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Methodology, System Architecture & Operational Assumptions
            </h2>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">
              Complete reference documentation for energy traders, risk managers, and engineering reviewers evaluating the Wind Forecast Decision Portal.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Decision Rule & No-Lookahead Guarantee */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            1. The Decision Rule & Gate Closure
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            In the UK electricity wholesale market, electricity is procured on day $D-1$ for physical delivery on day $D$. Power purchase orders on the day-ahead auction close between <strong>09:20 and 09:50 UK time</strong>.
          </p>
          <div className="bg-slate-850 p-3 rounded-lg border border-slate-750 text-xs text-slate-300 space-y-1">
            <div className="font-semibold text-amber-400">Default Decision Deadline:</div>
            <div>D-1 at 09:00 Europe/London</div>
            <div className="text-slate-400 text-[11px] mt-1">
              Provides a 20-minute operational buffer before auction gate closure.
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-white" />
            2. Strict No-Lookahead Guarantee
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            To prevent retrospective bias in historical simulations, our decision selection algorithm strictly enforces:
          </p>
          <div className="bg-slate-850 p-3 rounded-lg border border-slate-750 font-mono text-xs text-white">
            publishTime &le; deadline_utc(delivery_day(t))
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Any forecast revision published after the auction deadline (even by 1 second) is mathematically barred from selection. Verified by automated unit tests.
          </p>
        </div>
      </div>

      {/* Over-Forecast Shortfall Asymmetry */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          3. The Risk Asymmetry: Why Over-Forecasts Cause Shortfalls
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Wind forecast errors have asymmetric commercial consequences for an energy utility:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-3 text-xs space-y-1">
            <div className="font-bold text-amber-300">Over-Forecast ($Error &gt; 0$) &rarr; Shortfall Risk</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              The forecast estimates higher wind production than actual outturn. The trader procures less thermal/market power on D-1. During delivery, the utility experiences a power deficit and must purchase expensive balancing power at imbalance settlement prices.
            </p>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3 text-xs space-y-1">
            <div className="font-bold text-white">Under-Forecast ($Error &lt; 0$) &rarr; Spill/Surplus</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Actual wind generation exceeds expectations. The utility has excess power that can be sold back into the intraday market or settled through the system buy price.
            </p>
          </div>
        </div>
      </div>

      {/* Mathematical Formulas */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <Cpu className="w-4 h-4 text-white" />
          4. Mathematical Metric Definitions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-850 p-3.5 rounded-lg border border-slate-750 space-y-1">
            <span className="font-semibold text-white">Error Definition</span>
            <div className="font-mono text-white mt-1">Error = Forecast - Actual (MW)</div>
            <p className="text-[11px] text-slate-400">Evaluated at target delivery half-hour / hour.</p>
          </div>
          <div className="bg-slate-850 p-3.5 rounded-lg border border-slate-750 space-y-1">
            <span className="font-semibold text-white">Mean Absolute Error (MAE)</span>
            <div className="font-mono text-white mt-1">MAE = (1/N) &sum; |Error|</div>
            <p className="text-[11px] text-slate-400">Average magnitude of error across all delivery periods.</p>
          </div>
          <div className="bg-slate-850 p-3.5 rounded-lg border border-slate-750 space-y-1">
            <span className="font-semibold text-white">Root Mean Squared Error (RMSE)</span>
            <div className="font-mono text-white mt-1">RMSE = &radic;((1/N) &sum; Error&sup2;)</div>
            <p className="text-[11px] text-slate-400">Heavily penalizes large outlier deviations.</p>
          </div>
          <div className="bg-slate-850 p-3.5 rounded-lg border border-slate-750 space-y-1">
            <span className="font-semibold text-white">Normalized MAE (nMAE)</span>
            <div className="font-mono text-white mt-1">nMAE = MAE / Mean(Actual)</div>
            <p className="text-[11px] text-slate-400">Percentage error relative to total outturn capacity (~18.4%).</p>
          </div>
          <div className="bg-slate-850 p-3.5 rounded-lg border border-slate-750 space-y-1">
            <span className="font-semibold text-white">Forecast Bias</span>
            <div className="font-mono text-white mt-1">Bias = (1/N) &sum; Error</div>
            <p className="text-[11px] text-slate-400">Systematic directional tendency (+1,851.53 MW in Jan 2026).</p>
          </div>
          <div className="bg-slate-850 p-3.5 rounded-lg border border-slate-750 space-y-1">
            <span className="font-semibold text-white">Safety Buffer Sizing</span>
            <div className="font-mono text-emerald-300 mt-1">Buffer(q, h) = Quantile_q(max(Error, 0))</div>
            <p className="text-[11px] text-slate-400">Non-negative shortfall quantile sized per hour-of-day.</p>
          </div>
        </div>
      </div>

      {/* Data Pipeline Reference */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          5. Data Source & Validation Specifications
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Ingested directly from Elexon BMRS national stream APIs:
        </p>
        <ul className="list-disc list-inside text-xs text-slate-300 space-y-1.5 pl-2">
          <li>
            <strong className="text-white">FUELHH (Actuals):</strong> Fuel-half-hourly outturn filtered for <code className="text-cyan-400">fuelType == "WIND"</code>. Exactly <strong>1,488 half-hours</strong> covering 100% of January 2026 with zero missing periods.
          </li>
          <li>
            <strong className="text-white">WINDFOR (Forecasts):</strong> National wind generation forecasts published between <strong>December 15, 2025 and February 1, 2026</strong>. 18,080 forecast updates covering all 744 January delivery hours.
          </li>
        </ul>
      </div>
    </div>
  );
};
