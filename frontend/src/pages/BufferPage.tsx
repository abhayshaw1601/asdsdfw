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
      {/* Trader Explanation Banner */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-sm">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-white tracking-tight">
                  Why Buffer Sizing Matters: Over-Forecast Shortfall Risk
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/10 font-medium">
                  Empirical Quantile Sizing
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-2 max-w-3xl leading-relaxed font-light">
                When a wind forecast is higher than outturn (<strong>Error &gt; 0</strong>), the day-ahead trading team under-buys thermal or residual power, expecting wind to meet demand. During actual delivery, wind generation falls short, forcing the utility to buy expensive real-time balancing power or face cash-out imbalance penalties.
              </p>
              <p className="text-xs text-neutral-400 mt-1.5 font-light">
                <strong>Solution:</strong> Procure a safety buffer sized to the <strong>P90 (90%)</strong> or <strong>P95 (95%)</strong> empirical shortfall quantile for each specific hour of the day.
              </p>
            </div>
          </div>

          {/* Confidence Selector Buttons */}
          <div className="bg-neutral-950/80 p-2.5 rounded-2xl border border-neutral-800 flex flex-col gap-2 shrink-0">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider text-center">
              Protection Target
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedConfidence(0.90)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  selectedConfidence === 0.90
                    ? "bg-white text-neutral-950 shadow-sm"
                    : "bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700/80"
                }`}
              >
                P90 (90% Sizing)
              </button>
              <button
                onClick={() => setSelectedConfidence(0.95)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  selectedConfidence === 0.95
                    ? "bg-white text-neutral-950 shadow-sm"
                    : "bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700/80"
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
          badgeColor="slate"
          subValue="Covers 9 out of 10 over-forecast shortfalls"
          icon={<ShieldCheck className="w-4 h-4 text-white" />}
        />
        <MetricCard
          label="Average P95 Safety Buffer"
          value={formatPower(meanBufferP95, unit)}
          badge="95% Confidence"
          badgeColor="slate"
          subValue="High confidence extreme shortfall protection"
          icon={<CheckCircle2 className="w-4 h-4 text-white" />}
        />
        <MetricCard
          label="Peak Shortfall Hour"
          value={`${String(peakBufferHour).padStart(2, "0")}:00 London`}
          badge="Max Exposure"
          badgeColor="slate"
          subValue={`Requires up to ${formatPower(peakBufferP95, unit)} buffer`}
          icon={<AlertCircle className="w-4 h-4 text-white" />}
        />
        <MetricCard
          label="Protection Target"
          value={`${(selectedConfidence * 100).toFixed(0)}% Sizing`}
          badge="Active Policy"
          badgeColor="slate"
          subValue="Quantile applied to hourly shortfall curves"
          icon={<ShieldCheck className="w-4 h-4 text-white" />}
        />
      </div>

      {/* 24-Hour Buffer Sizing Chart */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Recommended Procurement Buffer by Hour of Day (00:00 - 23:00)
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5 font-light">
              Values in {unit} calculated from {startDate} to {endDate} at {deadlineHour.toString().padStart(2, "0")}:00 London deadline
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-white font-medium">
              <span className="w-3 h-1 bg-white rounded-full" /> P95 Buffer ({unit})
            </span>
            <span className="flex items-center gap-1.5 text-neutral-300">
              <span className="w-3 h-1 bg-neutral-400 rounded-full" /> P90 Buffer ({unit})
            </span>
            <span className="flex items-center gap-1.5 text-neutral-400">
              <span className="w-3 h-1 bg-neutral-600 rounded-full" /> Mean Shortfall ({unit})
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="hour" stroke="#737373" tick={{ fontSize: 11, fill: "#a3a3a3" }} />
              <YAxis stroke="#737373" tick={{ fontSize: 11, fill: "#a3a3a3" }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload;
                    return (
                      <div className="bg-neutral-950/95 border border-neutral-800 p-3.5 rounded-xl shadow-2xl text-xs space-y-1.5 backdrop-blur-md">
                        <div className="font-semibold text-white border-b border-neutral-800 pb-1.5">
                          Delivery Hour: {label} (Local London)
                        </div>
                        <div className="text-white flex justify-between gap-6">
                          <span>P95 Safety Buffer:</span>
                          <span className="font-medium">{row.bufferP95} {unit}</span>
                        </div>
                        <div className="text-neutral-300 flex justify-between gap-6">
                          <span>P90 Safety Buffer:</span>
                          <span className="font-medium">{row.bufferP90} {unit}</span>
                        </div>
                        <div className="text-neutral-400 flex justify-between gap-6">
                          <span>Mean Over-Forecast Shortfall:</span>
                          <span>{row.meanShortfall} {unit}</span>
                        </div>
                        <div className="text-neutral-300 flex justify-between gap-6 border-t border-neutral-800 pt-1.5">
                          <span>Max Historical Shortfall:</span>
                          <span className="font-medium text-white">{row.maxShortfall} {unit}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="bufferP95" fill="#ffffff" fillOpacity={0.08} stroke="#ffffff" strokeWidth={2} name="P95 Buffer" />
              <Line type="monotone" dataKey="bufferP90" stroke="#d4d4d4" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 2.5, fill: "#ffffff" }} name="P90 Buffer" />
              <Line type="monotone" dataKey="meanShortfall" stroke="#737373" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Mean Shortfall" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly Buffer Sizing Table */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl overflow-hidden backdrop-blur-sm shadow-sm">
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white tracking-tight">
            Hourly Safety Buffer Procurement Guidance Table
          </h3>
          <span className="text-xs text-neutral-400 font-light">
            24 delivery periods | Target: P{(selectedConfidence * 100).toFixed(0)}
          </span>
        </div>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950/80 text-neutral-400 sticky top-0 border-b border-neutral-800 font-medium">
              <tr>
                <th className="py-3 px-4">Delivery Hour</th>
                <th className="py-3 px-4">Recommended Buffer ({unit})</th>
                <th className="py-3 px-4">P90 Buffer ({unit})</th>
                <th className="py-3 px-4">P95 Buffer ({unit})</th>
                <th className="py-3 px-4">Mean Shortfall ({unit})</th>
                <th className="py-3 px-4">Max Shortfall Observed ({unit})</th>
                <th className="py-3 px-4">Risk Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {rows.map((r) => {
                const isHighRisk = r.bufferP95 > meanBufferP95 * 1.1;
                return (
                  <tr key={r.hour} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-white">
                      {String(r.hour).padStart(2, "0")}:00
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {formatPower(r.bufferMw, unit, false)}
                    </td>
                    <td className="py-3 px-4 text-neutral-200">
                      {formatPower(r.bufferP90, unit, false)}
                    </td>
                    <td className="py-3 px-4 text-white font-medium">
                      {formatPower(r.bufferP95, unit, false)}
                    </td>
                    <td className="py-3 px-4 text-neutral-300">
                      {formatPower(r.meanOverForecast, unit, false)}
                    </td>
                    <td className="py-3 px-4 text-neutral-200">
                      {formatPower(r.maxShortfall, unit, false)}
                    </td>
                    <td className="py-3 px-4">
                      {isHighRisk ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white border border-white/20">
                          Peak Risk
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800/80 text-neutral-400 border border-neutral-700/60">
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
