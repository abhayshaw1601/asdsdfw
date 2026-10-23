import React from "react";
import { BookOpen, ShieldCheck, CheckCircle2, Database, Cpu, Layers } from "lucide-react";

export const MethodologyPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Intro Header */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-8 backdrop-blur-sm shadow-sm">
        <div className="flex items-start gap-5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Methodology, System Architecture & Operational Assumptions
            </h2>
            <p className="text-sm text-neutral-300 mt-1 leading-relaxed font-light">
              Complete reference documentation for energy traders, risk managers, and engineering reviewers evaluating the Wind Forecast Decision Portal.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Decision Rule & No-Lookahead Guarantee */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-white font-semibold text-sm">
            <ShieldCheck className="w-4 h-4 text-white" />
            1. The Decision Rule & Gate Closure
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed font-light">
            In the UK electricity wholesale market, electricity is procured on day $D-1$ for physical delivery on day $D$. Power purchase orders on the day-ahead auction close between <strong>09:20 and 09:50 UK time</strong>.
          </p>
          <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800 text-xs text-neutral-300 space-y-1.5 font-light">
            <div className="font-semibold text-white">Default Decision Deadline:</div>
            <div className="text-neutral-200">D-1 at 09:00 Europe/London</div>
            <div className="text-neutral-400 text-[11px] mt-1">
              Provides a 20-minute operational buffer before auction gate closure.
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-white font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4 text-white" />
            2. Strict No-Lookahead Guarantee
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed font-light">
            To prevent retrospective bias in historical simulations, our decision selection algorithm strictly enforces:
          </p>
          <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800 font-mono text-xs text-white">
            publishTime &le; deadline_utc(delivery_day(t))
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed font-light">
            Any forecast revision published after the auction deadline (even by 1 second) is mathematically barred from selection. Verified by automated unit tests.
          </p>
        </div>
      </div>

      {/* Over-Forecast Shortfall Asymmetry */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-white" />
          3. The Risk Asymmetry: Why Over-Forecasts Cause Shortfalls
        </h3>
        <p className="text-xs text-neutral-300 leading-relaxed font-light">
          Wind forecast errors have asymmetric commercial consequences for an energy utility:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 text-xs space-y-1.5">
            <div className="font-semibold text-white">Over-Forecast ($Error &gt; 0$) &rarr; Shortfall Risk</div>
            <p className="text-neutral-400 text-[11px] leading-relaxed font-light">
              The forecast estimates higher wind production than actual outturn. The trader procures less thermal/market power on D-1. During delivery, the utility experiences a power deficit and must purchase expensive balancing power at imbalance settlement prices.
            </p>
          </div>
          <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 text-xs space-y-1.5">
            <div className="font-semibold text-white">Under-Forecast ($Error &lt; 0$) &rarr; Spill/Surplus</div>
            <p className="text-neutral-400 text-[11px] leading-relaxed font-light">
              Actual wind generation exceeds expectations. The utility has excess power that can be sold back into the intraday market or settled through the system buy price.
            </p>
          </div>
        </div>
      </div>

      {/* Mathematical Formulas */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-sm space-y-5">
        <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2.5">
          <Cpu className="w-4 h-4 text-white" />
          4. Mathematical Metric Definitions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800 space-y-1.5">
            <span className="font-medium text-white">Error Definition</span>
            <div className="font-mono text-white mt-1">Error = Forecast - Actual (MW)</div>
            <p className="text-[11px] text-neutral-400 font-light">Evaluated at target delivery half-hour / hour.</p>
          </div>
          <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800 space-y-1.5">
            <span className="font-medium text-white">Mean Absolute Error (MAE)</span>
            <div className="font-mono text-white mt-1">MAE = (1/N) &sum; |Error|</div>
            <p className="text-[11px] text-neutral-400 font-light">Average magnitude of error across all delivery periods.</p>
          </div>
          <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800 space-y-1.5">
            <span className="font-medium text-white">Root Mean Squared Error (RMSE)</span>
            <div className="font-mono text-white mt-1">RMSE = &radic;((1/N) &sum; Error&sup2;)</div>
            <p className="text-[11px] text-neutral-400 font-light">Heavily penalizes large outlier deviations.</p>
          </div>
          <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800 space-y-1.5">
            <span className="font-medium text-white">Normalized MAE (nMAE)</span>
            <div className="font-mono text-white mt-1">nMAE = MAE / Mean(Actual)</div>
            <p className="text-[11px] text-neutral-400 font-light">Percentage error relative to total outturn capacity (~18.4%).</p>
          </div>
          <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800 space-y-1.5">
            <span className="font-medium text-white">Forecast Bias</span>
            <div className="font-mono text-white mt-1">Bias = (1/N) &sum; Error</div>
            <p className="text-[11px] text-neutral-400 font-light">Systematic directional tendency (+1,851.53 MW in Jan 2026).</p>
          </div>
          <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800 space-y-1.5">
            <span className="font-medium text-white">Safety Buffer Sizing</span>
            <div className="font-mono text-white mt-1">Buffer(q, h) = Quantile_q(max(Error, 0))</div>
            <p className="text-[11px] text-neutral-400 font-light">Non-negative shortfall quantile sized per hour-of-day.</p>
          </div>
        </div>
      </div>

      {/* Data Pipeline Reference */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2.5">
          <Database className="w-4 h-4 text-white" />
          5. Data Source & Validation Specifications
        </h3>
        <p className="text-xs text-neutral-300 leading-relaxed font-light">
          Ingested directly from Elexon BMRS national stream APIs:
        </p>
        <ul className="list-disc list-inside text-xs text-neutral-300 space-y-2 pl-2 font-light">
          <li>
            <strong className="text-white font-medium">FUELHH (Actuals):</strong> Fuel-half-hourly outturn filtered for <code className="text-neutral-200 bg-neutral-800/80 px-1.5 py-0.5 rounded font-mono">fuelType == "WIND"</code>. Exactly <strong>1,488 half-hours</strong> covering 100% of January 2026 with zero missing periods.
          </li>
          <li>
            <strong className="text-white font-medium">WINDFOR (Forecasts):</strong> National wind generation forecasts published between <strong>December 15, 2025 and February 1, 2026</strong>. 18,080 forecast updates covering all 744 January delivery hours.
          </li>
        </ul>
      </div>
    </div>
  );
};
