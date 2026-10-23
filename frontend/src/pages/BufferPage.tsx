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

  const meanBufferP90 = rows.reduce((acc, r) => acc + r.bufferP90, 0) / rows.length || 0;
  const meanBufferP95 = rows.reduce((acc, r) => acc + r.bufferP95, 0) / rows.length || 0;
  const peakBufferP95 = Math.max(...rows.map((r) => r.bufferP95));
  const peakBufferHour = rows.find((r) => r.bufferP95 === peakBufferP95)?.hour ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Banner with Policy Toggle */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.05] hover:bg-white/[0.07] backdrop-blur-2xl border border-white/20 p-4 sm:p-5 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.25),0_12px_36px_rgba(0,0,0,0.45)] transition-all">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
              Quantile Hedging
            </span>
            <h2 className="text-base sm:text-lg font-light text-white tracking-tight">
              Safety Buffer Guidance ({startDate} &rarr; {endDate})
            </h2>
          </div>

          {/* Confidence Selector Buttons */}
          <div className="flex items-center gap-1.5 bg-white/[0.08] p-1 rounded-full border border-white/20 backdrop-blur-md">
            <button
              onClick={() => setSelectedConfidence(0.90)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                selectedConfidence === 0.90
                  ? "bg-white text-neutral-950 font-semibold shadow-sm"
                  : "text-neutral-300 hover:text-white"
              }`}
            >
              P90 (90%)
            </button>
            <button
              onClick={() => setSelectedConfidence(0.95)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                selectedConfidence === 0.95
                  ? "bg-white text-neutral-950 font-semibold shadow-sm"
                  : "text-neutral-300 hover:text-white"
              }`}
            >
              P95 (95%)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="P90 Mean Buffer"
          value={formatPower(meanBufferP90, unit)}
          badge="90% Cov"
          subValue="90% shortfall protection"
          icon={<ShieldCheck className="w-4 h-4 text-white" />}
        />
        <MetricCard
          label="P95 Mean Buffer"
          value={formatPower(meanBufferP95, unit)}
          badge="95% Cov"
          subValue="High confidence coverage"
          icon={<CheckCircle2 className="w-4 h-4 text-white" />}
        />
        <MetricCard
          label="Peak Risk Hour"
          value={`${String(peakBufferHour).padStart(2, "0")}:00`}
          badge="Max Shortfall"
          subValue={`Up to ${formatPower(peakBufferP95, unit)}`}
          icon={<AlertCircle className="w-4 h-4 text-white" />}
        />
        <MetricCard
          label="Active Target"
          value={`P${(selectedConfidence * 100).toFixed(0)}`}
          badge="Policy"
          subValue="Hourly quantile sizing"
          icon={<ShieldCheck className="w-4 h-4 text-white" />}
        />
      </div>

      {/* 24-Hour Buffer Sizing Chart */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.05] hover:bg-white/[0.07] backdrop-blur-2xl border border-white/20 p-5 sm:p-6 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.25),0_12px_36px_rgba(0,0,0,0.45)] transition-all">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">
            Procurement Buffer by Hour ({unit})
          </h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-white font-medium">
              <span className="w-3 h-1 bg-white rounded-full" /> P95 Buffer
            </span>
            <span className="flex items-center gap-1.5 text-neutral-300">
              <span className="w-3 h-1 bg-neutral-400 rounded-full" /> P90 Buffer
            </span>
            <span className="flex items-center gap-1.5 text-neutral-400">
              <span className="w-3 h-1 bg-neutral-600 rounded-full" /> Mean Shortfall
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
                      <div className="bg-neutral-950/95 border border-white/15 p-3 rounded-xl shadow-2xl text-xs space-y-1 backdrop-blur-md">
                        <div className="font-semibold text-white border-b border-white/10 pb-1">
                          Hour: {label}
                        </div>
                        <div className="text-white flex justify-between gap-4">
                          <span>P95 Buffer:</span>
                          <span className="font-semibold">{row.bufferP95} {unit}</span>
                        </div>
                        <div className="text-neutral-300 flex justify-between gap-4">
                          <span>P90 Buffer:</span>
                          <span>{row.bufferP90} {unit}</span>
                        </div>
                        <div className="text-neutral-400 flex justify-between gap-4">
                          <span>Mean Shortfall:</span>
                          <span>{row.meanShortfall} {unit}</span>
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

      {/* Hourly Buffer Table */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.05] hover:bg-white/[0.07] backdrop-blur-2xl border border-white/20 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.25),0_12px_36px_rgba(0,0,0,0.45)] transition-all">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
        <div className="p-4 sm:p-5 border-b border-white/15 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">
            Hourly Buffer Sizing Guidance
          </h3>
          <span className="text-xs text-neutral-300 font-mono">
            Target: P{(selectedConfidence * 100).toFixed(0)} ({unit})
          </span>
        </div>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-white/[0.05] text-neutral-300 sticky top-0 border-b border-white/15 font-medium backdrop-blur-md">
              <tr>
                <th className="py-2.5 px-4">Hour</th>
                <th className="py-2.5 px-4">Buffer ({unit})</th>
                <th className="py-2.5 px-4">P90</th>
                <th className="py-2.5 px-4">P95</th>
                <th className="py-2.5 px-4">Mean Shortfall</th>
                <th className="py-2.5 px-4">Max Shortfall</th>
                <th className="py-2.5 px-4">Risk Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r) => {
                const isHighRisk = r.bufferP95 > meanBufferP95 * 1.1;
                return (
                  <tr key={r.hour} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-white">
                      {String(r.hour).padStart(2, "0")}:00
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-white">
                      {formatPower(r.bufferMw, unit, false)}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-300">
                      {formatPower(r.bufferP90, unit, false)}
                    </td>
                    <td className="py-2.5 px-4 text-white font-medium">
                      {formatPower(r.bufferP95, unit, false)}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-400">
                      {formatPower(r.meanOverForecast, unit, false)}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-300">
                      {formatPower(r.maxShortfall, unit, false)}
                    </td>
                    <td className="py-2.5 px-4">
                      {isHighRisk ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white border border-white/20">
                          Peak
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-neutral-400 border border-white/10">
                          Standard
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
