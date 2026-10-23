import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { useHorizonQuery } from "../hooks/useForecastData";
import { ErrorAlert } from "../components/ErrorAlert";
import type { UnitType, HorizonMetrics } from "../api/types";

interface HorizonPageProps {
  deadlineHour: number;
  unit: UnitType;
}

export const HorizonPage: React.FC<HorizonPageProps> = ({
  unit,
}) => {
  const { data, isLoading, isError, error, refetch } = useHorizonQuery();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-black/30 border border-white/10 rounded-2xl backdrop-blur-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-black/30 border border-white/10 rounded-2xl backdrop-blur-xl" />
          ))}
        </div>
        <div className="h-80 bg-black/30 border border-white/10 rounded-2xl backdrop-blur-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorAlert
        message={error instanceof Error ? error.message : "Unable to retrieve horizon degradation data"}
        onRetry={refetch}
      />
    );
  }

  const { bins } = data;
  const baselineBin = bins[0];
  const dayAheadBin = bins.find((b: HorizonMetrics) => b.binLabel === "18-24h") || bins[3];
  const longRangeBin = bins[bins.length - 1];

  const dayAheadDegPct = baselineBin && baselineBin.mae && dayAheadBin ? Math.round(((dayAheadBin.mae - baselineBin.mae) / baselineBin.mae) * 100) : 0;
  const longRangeDegPct = baselineBin && baselineBin.mae && longRangeBin ? Math.round(((longRangeBin.mae - baselineBin.mae) / baselineBin.mae) * 100) : 0;

  const chartData = bins.map((b: HorizonMetrics) => ({
    bin: b.binLabel,
    mae: b.mae,
    rmse: b.rmse,
    bias: b.bias,
    n: b.n,
    degradationPct: baselineBin && baselineBin.mae ? Math.round(((b.mae - baselineBin.mae) / baselineBin.mae) * 100) : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/15">
              Decay Engine
            </span>
            <h2 className="text-base sm:text-lg font-light text-white tracking-tight">
              Lead-Time Degradation Curve (0h &rarr; 72h)
            </h2>
          </div>
          <span className="text-xs font-mono text-neutral-300 bg-black/40 px-3 py-1 rounded-full border border-white/15">
            Day-Ahead: 18-24h
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-400 uppercase tracking-wider font-medium">0-6h (Intraday)</span>
            <Clock className="w-4 h-4 text-white opacity-80" />
          </div>
          <div className="text-2xl sm:text-3xl font-light text-white">{baselineBin?.mae.toLocaleString()} <span className="text-sm text-neutral-400">{unit}</span></div>
          <div className="mt-1 text-[11px] text-neutral-400 font-light">Short-term gate baseline</div>
        </div>

        <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-400 uppercase tracking-wider font-medium">18-24h (Auction Gate)</span>
            <TrendingUp className="w-4 h-4 text-white opacity-80" />
          </div>
          <div className="text-2xl sm:text-3xl font-light text-white">{dayAheadBin?.mae.toLocaleString()} <span className="text-sm text-neutral-400">{unit}</span></div>
          <div className="mt-1 text-[11px] text-white font-medium">
            +{dayAheadDegPct}% decay vs intraday
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-400 uppercase tracking-wider font-medium">48-72h (Medium Range)</span>
            <AlertTriangle className="w-4 h-4 text-white opacity-80" />
          </div>
          <div className="text-2xl sm:text-3xl font-light text-white">{longRangeBin?.mae.toLocaleString()} <span className="text-sm text-neutral-400">{unit}</span></div>
          <div className="mt-1 text-[11px] text-white font-medium">
            +{longRangeDegPct}% decay vs intraday
          </div>
        </div>
      </div>

      {/* Degradation Chart */}
      <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">
            Error Growth by Horizon Bucket ({unit})
          </h3>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-white">
              <span className="w-3 h-1 bg-white rounded" /> MAE
            </span>
            <span className="flex items-center gap-1.5 text-neutral-400">
              <span className="w-3 h-1 bg-neutral-400 rounded" /> RMSE
            </span>
            <span className="flex items-center gap-1.5 text-neutral-300">
              <span className="w-3 h-1 bg-neutral-300 rounded" /> Bias
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="bin" stroke="#737373" tick={{ fontSize: 11 }} />
              <YAxis stroke="#737373" tick={{ fontSize: 11 }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload;
                    return (
                      <div className="bg-neutral-950/95 border border-white/15 p-3 rounded-xl shadow-2xl text-xs space-y-1 backdrop-blur-md">
                        <div className="text-white font-semibold border-b border-white/10 pb-1">
                          Horizon: {label}
                        </div>
                        <div className="text-white">MAE: {row.mae} {unit}</div>
                        <div className="text-neutral-300">RMSE: {row.rmse} {unit}</div>
                        <div className="text-white">Bias: +{row.bias} {unit}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line type="monotone" dataKey="mae" stroke="#ffffff" strokeWidth={2.5} dot={{ r: 4, fill: "#ffffff" }} name="MAE" />
              <Line type="monotone" dataKey="rmse" stroke="#a3a3a3" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 3, fill: "#a3a3a3" }} name="RMSE" />
              <Line type="monotone" dataKey="bias" stroke="#d4d4d4" strokeWidth={1.5} dot={false} name="Bias" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Degradation Breakdown Table */}
      <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">
            Horizon Buckets Overview
          </h3>
          <span className="text-xs text-neutral-400 font-mono">
            {unit}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950/80 text-neutral-400 border-b border-white/10 font-medium backdrop-blur-md">
              <tr>
                <th className="py-2.5 px-4">Window</th>
                <th className="py-2.5 px-4">Phase</th>
                <th className="py-2.5 px-4">Updates</th>
                <th className="py-2.5 px-4">MAE</th>
                <th className="py-2.5 px-4">RMSE</th>
                <th className="py-2.5 px-4">Bias</th>
                <th className="py-2.5 px-4">Decay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bins.map((b: HorizonMetrics, idx: number) => {
                const isAuctionWindow = b.binLabel === "18-24h";
                const degPct = baselineBin && baselineBin.mae ? Math.round(((b.mae - baselineBin.mae) / baselineBin.mae) * 100) : 0;
                return (
                  <tr
                    key={b.binLabel}
                    className={`hover:bg-white/5 transition-colors ${
                      isAuctionWindow ? "bg-white/5 font-medium" : ""
                    }`}
                  >
                    <td className="py-2.5 px-4 font-semibold text-white">
                      {b.binLabel}
                    </td>
                    <td className="py-2.5 px-4">
                      {isAuctionWindow ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white border border-white/15">
                          Auction Gate
                        </span>
                      ) : idx < 2 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-neutral-300 border border-white/10">
                          Intraday
                        </span>
                      ) : (
                        <span className="text-neutral-400 font-light">Medium</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-400 font-mono">
                      {b.n.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-white">
                      {b.mae.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-white">
                      {b.rmse.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-white">
                      +{b.bias.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-medium text-white">
                        {degPct > 0 ? `+${degPct}%` : "0%"}
                      </span>
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
