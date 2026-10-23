import React, { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { useBufferQuery } from "../hooks/useForecastData";
import { MetricCard } from "../components/MetricCard";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { ErrorAlert } from "../components/ErrorAlert";
import { formatPower, convertValue } from "../lib/units";
import type { UnitType } from "../api/types";

interface BufferPageProps {
  startDate: string;
  endDate: string;
  deadlineHour: number;
  unit: UnitType;
}

export const BufferPage: React.FC<BufferPageProps> = ({
  startDate,
  endDate,
  deadlineHour,
  unit,
}) => {
  const [selectedConfidence, setSelectedConfidence] = useState<number>(0.90);

  const { data, isLoading, error, refetch } = useBufferQuery(
    startDate,
    endDate,
    deadlineHour,
    selectedConfidence
  );

  if (isLoading) {
    return <LoadingSkeleton rows={4} height="h-64" />;
  }

  if (error || !data) {
    return (
      <ErrorAlert
        message={error instanceof Error ? error.message : "Failed to load buffer guidance data"}
        onRetry={() => refetch()}
      />
    );
  }

  const { rows } = data;

  const chartData = rows.map((r) => ({
    hour: `${String(r.hour).padStart(2, "0")}:00`,
    hourNum: r.hour,
    bufferSelected: convertValue(r.bufferMw, unit),
    bufferP90: convertValue(r.bufferP90, unit),
    bufferP95: convertValue(r.bufferP95, unit),
    meanShortfall: convertValue(r.meanOverForecast, unit),
    maxShortfall: convertValue(r.maxShortfall, unit),
    n: r.n,
  }));

  // Summary statistics across 24 hours
  const meanBufferP90 = rows.reduce((acc, r) => acc + r.bufferP90, 0) / rows.length || 0;
  const meanBufferP95 = rows.reduce((acc, r) => acc + r.bufferP95, 0) / rows.length || 0;
  const peakBufferP95 = Math.max(...rows.map((r) => r.bufferP95));
  const peakBufferHour = rows.find((r) => r.bufferP95 === peakBufferP95)?.hour ?? 0;

  return (
    <div className="space-y-6">
      {/* Plain English Trader Explanation Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Why Buffer Sizing Matters: Over-Forecast Shortfall Risk
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  Empirical Quantile Sizing
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                When a wind forecast is higher than outturn (<strong>Error &gt; 0</strong>), the day-ahead trading team under-buys thermal/residual power, expecting wind to meet demand. During actual delivery, wind generation falls short, forcing the utility to buy expensive real-time balancing power or face cash-out imbalance penalties.
              </p>
              <p className="text-xs text-slate-400 mt-1.5">
                <strong>Solution:</strong> Procure a safety buffer sized to the <strong>P90 (90%)</strong> or <strong>P95 (95%)</strong> empirical shortfall quantile for each specific hour of the day.
              </p>
            </div>
          </div>

          {/* Confidence Selector Buttons */}
          <div className="bg-slate-850 p-2 rounded-xl border border-slate-750 flex flex-col gap-1.5 shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
              Protection Target
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedConfidence(0.90)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedConfidence === 0.90
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                P90 (90% Sizing)
              </button>
              <button
                onClick={() => setSelectedConfidence(0.95)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedConfidence === 0.95
                    ? "bg-amber-600 text-white shadow-sm shadow-amber-500/30"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                P95 (95% Sizing)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Average P90 Safety Buffer"
          value={formatPower(meanBufferP90, unit)}
          badge="90% Confidence"
          badgeColor="blue"
          subValue="Covers 9 out of 10 over-forecast shortfalls"
          icon={<ShieldCheck className="w-4 h-4 text-blue-400" />}
        />
        <MetricCard
          label="Average P95 Safety Buffer"
          value={formatPower(meanBufferP95, unit)}
          badge="95% Confidence"
          badgeColor="amber"
          subValue="High confidence extreme shortfall protection"
          icon={<CheckCircle2 className="w-4 h-4 text-amber-400" />}
        />
        <MetricCard
          label="Peak Shortfall Hour"
          value={`${String(peakBufferHour).padStart(2, "0")}:00 London`}
          badge="Max Exposure"
          badgeColor="rose"
          subValue={`Requires up to ${formatPower(peakBufferP95, unit)} buffer`}
          icon={<AlertCircle className="w-4 h-4 text-rose-400" />}
        />
        <MetricCard
          label="Protection Target"
          value={`${(selectedConfidence * 100).toFixed(0)}% Sizing`}
          badge="Active Policy"
          badgeColor="emerald"
          subValue="Quantile applied to hourly shortfall curves"
          icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
        />
      </div>

      {/* 24-Hour Buffer Sizing Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Recommended Procurement Buffer by Hour of Day (00:00 – 23:00)
            </h3>
            <p className="text-xs text-slate-400">
              Values in {unit} calculated from {startDate} to {endDate} at {deadlineHour.toString().padStart(2, "0")}:00 London deadline
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-3 h-1 bg-amber-500 rounded" /> P95 Buffer ({unit})
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-3 h-1 bg-blue-500 rounded" /> P90 Buffer ({unit})
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-1 bg-emerald-500 rounded" /> Mean Shortfall ({unit})
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg shadow-xl text-xs space-y-1.5">
                        <div className="font-bold text-white border-b border-slate-800 pb-1">
                          Delivery Hour: {label} (Local London)
                        </div>
                        <div className="text-amber-400 flex justify-between">
                          <span>P95 Safety Buffer:</span>
                          <span className="font-semibold">{row.bufferP95} {unit}</span>
                        </div>
                        <div className="text-blue-400 flex justify-between">
                          <span>P90 Safety Buffer:</span>
                          <span className="font-semibold">{row.bufferP90} {unit}</span>
                        </div>
                        <div className="text-emerald-400 flex justify-between">
                          <span>Mean Over-Forecast Shortfall:</span>
                          <span>{row.meanShortfall} {unit}</span>
                        </div>
                        <div className="text-rose-400 flex justify-between border-t border-slate-800 pt-1">
                          <span>Max Historical Shortfall:</span>
                          <span className="font-semibold">{row.maxShortfall} {unit}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="bufferP95" fill="#f59e0b" fillOpacity={0.15} stroke="#d97706" strokeWidth={2} name="P95 Buffer" />
              <Line type="monotone" dataKey="bufferP90" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: "#3b82f6" }} name="P90 Buffer" />
              <Line type="monotone" dataKey="meanShortfall" stroke="#10b981" strokeWidth={1.8} strokeDasharray="3 2" dot={false} name="Mean Shortfall" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly Buffer Sizing Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight">
            Hourly Safety Buffer Procurement Guidance Table
          </h3>
          <span className="text-xs text-slate-400">
            24 delivery periods • Target: P{(selectedConfidence * 100).toFixed(0)}
          </span>
        </div>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Delivery Hour</th>
                <th className="py-2.5 px-4">Recommended Buffer ({unit})</th>
                <th className="py-2.5 px-4">P90 Buffer ({unit})</th>
                <th className="py-2.5 px-4">P95 Buffer ({unit})</th>
                <th className="py-2.5 px-4">Mean Shortfall ({unit})</th>
                <th className="py-2.5 px-4">Max Shortfall Observed ({unit})</th>
                <th className="py-2.5 px-4">Risk Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {rows.map((r) => {
                const isHighRisk = r.bufferP95 > meanBufferP95 * 1.1;
                return (
                  <tr key={r.hour} className="hover:bg-slate-855 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-white">
                      {String(r.hour).padStart(2, "0")}:00
                    </td>
                    <td className="py-2.5 px-4 font-bold text-blue-400">
                      {formatPower(r.bufferMw, unit, false)}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-200">
                      {formatPower(r.bufferP90, unit, false)}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-amber-400">
                      {formatPower(r.bufferP95, unit, false)}
                    </td>
                    <td className="py-2.5 px-4 text-emerald-400">
                      {formatPower(r.meanOverForecast, unit, false)}
                    </td>
                    <td className="py-2.5 px-4 text-rose-400 font-semibold">
                      {formatPower(r.maxShortfall, unit, false)}
                    </td>
                    <td className="py-2.5 px-4">
                      {isHighRisk ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Peak Shortfall Risk
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-750 text-slate-300 border border-slate-650">
                          Standard Risk
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
