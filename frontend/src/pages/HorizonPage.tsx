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
        <div className="h-28 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl" />
        <div className="h-96 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl" />
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
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                Forecast Degradation Engine
              </span>
              <h2 className="text-xl font-light text-white tracking-tight">
                Lead-Time Horizon Error Degradation Curve
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1 font-light">
              Accuracy decay as lead time advances from 0 hours (intraday) out to 72 hours (medium range)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-neutral-950 border border-neutral-800 text-white">
              Auction Horizon: 18-24h
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-400 font-medium">0-6h Horizon (Intraday Baseline)</span>
            <Clock className="w-4 h-4 text-white opacity-80" />
          </div>
          <div className="text-3xl font-light text-white">{baselineBin?.mae.toLocaleString()} <span className="text-base text-neutral-400">{unit}</span></div>
          <div className="mt-1 text-xs text-neutral-400 font-light">Short-term gate closure accuracy</div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-400 font-medium">18-24h Horizon (Day-Ahead Auction)</span>
            <TrendingUp className="w-4 h-4 text-white opacity-80" />
          </div>
          <div className="text-3xl font-light text-white">{dayAheadBin?.mae.toLocaleString()} <span className="text-base text-neutral-400">{unit}</span></div>
          <div className="mt-1 text-xs text-white font-medium">
            +{dayAheadDegPct}% error increase vs intraday
          </div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-400 font-medium">48-72h Horizon (Medium Range)</span>
            <AlertTriangle className="w-4 h-4 text-white opacity-80" />
          </div>
          <div className="text-3xl font-light text-white">{longRangeBin?.mae.toLocaleString()} <span className="text-base text-neutral-400">{unit}</span></div>
          <div className="mt-1 text-xs text-white font-medium">
            +{longRangeDegPct}% error increase vs intraday
          </div>
        </div>
      </div>

      {/* Degradation Chart */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">
              Forecast Error Degradation Across Lead Time Horizons
            </h3>
            <p className="text-xs text-neutral-400 font-light mt-0.5">
              Evaluated across all Elexon WINDFOR revisions (from 0h up to 72h before delivery)
            </p>
          </div>
          <div className="flex items-center gap-5 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-white">
              <span className="w-3 h-1 bg-white rounded" /> MAE ({unit})
            </span>
            <span className="flex items-center gap-1.5 text-neutral-400">
              <span className="w-3 h-1 bg-neutral-400 rounded" /> RMSE ({unit})
            </span>
            <span className="flex items-center gap-1.5 text-neutral-300">
              <span className="w-3 h-1 bg-neutral-300 rounded" /> Bias ({unit})
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
                      <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-xl shadow-xl text-xs space-y-1.5">
                        <div className="text-white font-semibold border-b border-neutral-800 pb-1">
                          Horizon Bucket: {label}
                        </div>
                        <div className="text-white font-medium">MAE: {row.mae} {unit}</div>
                        <div className="text-neutral-300">RMSE: {row.rmse} {unit}</div>
                        <div className="text-white">Bias: +{row.bias} {unit}</div>
                        <div className="text-neutral-500 text-[11px] pt-1 border-t border-neutral-800 font-light">
                          Observations: {row.n.toLocaleString()} pairs (+{row.degradationPct}% vs 0-6h)
                        </div>
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
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">
              Horizon Bucket Metrics Table
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5 font-light">
              Aggregated across 18,080 forecast revisions in January 2026
            </p>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            Values in {unit}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 font-medium">
              <tr>
                <th className="py-3 px-4">Horizon Window</th>
                <th className="py-3 px-4">Market Phase</th>
                <th className="py-3 px-4">Forecast Revisions</th>
                <th className="py-3 px-4">MAE ({unit})</th>
                <th className="py-3 px-4">RMSE ({unit})</th>
                <th className="py-3 px-4">Mean Bias ({unit})</th>
                <th className="py-3 px-4">Error Degradation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/70">
              {bins.map((b: HorizonMetrics, idx: number) => {
                const isAuctionWindow = b.binLabel === "18-24h";
                const degPct = baselineBin && baselineBin.mae ? Math.round(((b.mae - baselineBin.mae) / baselineBin.mae) * 100) : 0;
                return (
                  <tr
                    key={b.binLabel}
                    className={`hover:bg-neutral-850/50 transition-colors ${
                      isAuctionWindow ? "bg-neutral-900/90 font-medium" : ""
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-white">
                      {b.binLabel}
                    </td>
                    <td className="py-3 px-4">
                      {isAuctionWindow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-white border border-neutral-700">
                          Day-Ahead Auction
                        </span>
                      ) : idx < 2 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-white border border-neutral-700">
                          Intraday
                        </span>
                      ) : (
                        <span className="text-neutral-400 font-light">Medium Range</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-neutral-400 font-mono">
                      {b.n.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {b.mae.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-white font-medium">
                      {b.rmse.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-white font-medium">
                      +{b.bias.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-white">
                        {degPct > 0 ? `+${degPct}%` : "Baseline (0%)"}
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
