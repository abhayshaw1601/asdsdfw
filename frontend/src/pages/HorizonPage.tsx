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
import { Clock } from "lucide-react";
import { useHorizonQuery } from "../hooks/useForecastData";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { ErrorAlert } from "../components/ErrorAlert";
import { formatPower, convertValue } from "../lib/units";
import type { UnitType } from "../api/types";

interface HorizonPageProps {
  deadlineHour: number;
  unit: UnitType;
}

export const HorizonPage: React.FC<HorizonPageProps> = ({ deadlineHour, unit }) => {
  const { data, isLoading, error, refetch } = useHorizonQuery();

  if (isLoading) {
    return <LoadingSkeleton rows={3} height="h-64" />;
  }

  if (error || !data) {
    return (
      <ErrorAlert
        message={error instanceof Error ? error.message : "Failed to load horizon data"}
        onRetry={() => refetch()}
      />
    );
  }

  const { bins } = data;

  // Base MAE for relative degradation comparison (0-6h bin)
  const baseMae = bins[0]?.mae || 1;

  const chartData = bins.map((b) => {
    const maeConverted = convertValue(b.mae, unit);
    const rmseConverted = convertValue(b.rmse, unit);
    const biasConverted = convertValue(b.bias, unit);
    const degradationPct = (((b.mae - baseMae) / baseMae) * 100).toFixed(1);

    return {
      bin: b.binLabel,
      n: b.n,
      mae: maeConverted,
      rmse: rmseConverted,
      bias: biasConverted,
      degradationPct: Number(degradationPct),
    };
  });

  return (
    <div className="space-y-6">
      {/* Callout Card Explaining the Auction Horizon */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Day-Ahead Auction Lead Horizon Window: ~15h – 39h
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                  Frozen at {deadlineHour.toString().padStart(2, "0")}:00 London
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                UK power purchase orders on D-1 close around 09:20–09:50 UK time. Freezing forecasts at {deadlineHour.toString().padStart(2, "0")}:00 D-1 implies a <strong>15-hour lead time</strong> for midnight delivery (00:00 D) and up to a <strong>39-hour lead time</strong> for late evening delivery (23:00 D).
              </p>
            </div>
          </div>
          <div className="bg-slate-800/80 px-4 py-2.5 rounded-lg border border-slate-750 text-xs shrink-0 space-y-1">
            <div className="text-slate-400">Intraday MAE (0-6h): <span className="text-white font-semibold">{formatPower(bins[0]?.mae, unit)}</span></div>
            <div className="text-slate-400">Day-Ahead MAE (18-24h): <span className="text-amber-400 font-semibold">{formatPower(bins[3]?.mae, unit)}</span></div>
            <div className="text-slate-400">Degradation: <span className="text-rose-400 font-semibold">+{chartData[3]?.degradationPct}% error</span></div>
          </div>
        </div>
      </div>

      {/* Main Horizon Degradation Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Forecast Error Degradation Across Lead Time Horizons
            </h3>
            <p className="text-xs text-slate-400">
              Evaluated across all Elexon WINDFOR revisions (from 0h up to 72h before delivery)
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-3 h-1 bg-blue-500 rounded" /> MAE ({unit})
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-3 h-1 bg-rose-500 rounded" /> RMSE ({unit})
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-3 h-1 bg-amber-500 rounded" /> Bias ({unit})
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="bin" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg shadow-xl text-xs space-y-1.5">
                        <div className="text-white font-bold border-b border-slate-800 pb-1">
                          Horizon Bucket: {label}
                        </div>
                        <div className="text-blue-400">MAE: {row.mae} {unit}</div>
                        <div className="text-rose-400">RMSE: {row.rmse} {unit}</div>
                        <div className="text-amber-400">Bias: +{row.bias} {unit}</div>
                        <div className="text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                          Observations: {row.n.toLocaleString()} pairs (+{row.degradationPct}% vs 0-6h)
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line type="monotone" dataKey="mae" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: "#3b82f6" }} name="MAE" />
              <Line type="monotone" dataKey="rmse" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3.5, fill: "#f43f5e" }} strokeDasharray="4 2" name="RMSE" />
              <Line type="monotone" dataKey="bias" stroke="#f59e0b" strokeWidth={1.8} dot={{ r: 3, fill: "#f59e0b" }} name="Bias" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Horizon Bins Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight">
            Horizon Degradation Ledger
          </h3>
          <span className="text-xs text-slate-400">
            {bins.length} lead time intervals
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Horizon Bin</th>
                <th className="py-2.5 px-4">Market Regime</th>
                <th className="py-2.5 px-4">Sample Count ($N$)</th>
                <th className="py-2.5 px-4">MAE ({unit})</th>
                <th className="py-2.5 px-4">RMSE ({unit})</th>
                <th className="py-2.5 px-4">Bias ({unit})</th>
                <th className="py-2.5 px-4">Error Degradation vs Intraday</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {chartData.map((b, idx) => {
                const isAuctionWindow = b.bin === "12-18h" || b.bin === "18-24h" || b.bin === "24-36h";
                return (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-855 transition-colors ${
                      isAuctionWindow ? "bg-blue-950/20" : ""
                    }`}
                  >
                    <td className="py-2.5 px-4 font-semibold text-white">
                      {b.bin}
                    </td>
                    <td className="py-2.5 px-4">
                      {isAuctionWindow ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Day-Ahead Auction
                        </span>
                      ) : idx < 2 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Intraday
                        </span>
                      ) : (
                        <span className="text-slate-400">Medium Range</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 font-mono">
                      {b.n.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-blue-400">
                      {b.mae.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-rose-400 font-semibold">
                      {b.rmse.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-amber-400 font-semibold">
                      +{b.bias.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`font-semibold ${b.degradationPct > 20 ? "text-rose-400" : "text-slate-300"}`}>
                        {b.degradationPct > 0 ? `+${b.degradationPct}%` : "Baseline (0%)"}
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
