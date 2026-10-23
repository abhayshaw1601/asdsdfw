import React from "react";
import {
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ComposedChart,
} from "recharts";
import { Clock, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { useDecisionQuery } from "../hooks/useForecastData";
import { MetricCard } from "../components/MetricCard";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { ErrorAlert } from "../components/ErrorAlert";
import { formatPower, convertValue } from "../lib/units";
import type { UnitType } from "../api/types";

interface DecisionPageProps {
  day: string;
  deadlineHour: number;
  unit: UnitType;
}

export const DecisionPage: React.FC<DecisionPageProps> = ({
  day,
  deadlineHour,
  unit,
}) => {
  const { data, isLoading, error, refetch } = useDecisionQuery(day, deadlineHour);

  if (isLoading) {
    return <LoadingSkeleton rows={4} height="h-64" />;
  }

  if (error || !data) {
    return (
      <ErrorAlert
        message={error instanceof Error ? error.message : "Failed to load decision data"}
        onRetry={() => refetch()}
      />
    );
  }

  const { points, summary, deadlineLocal, deadlineUtc } = data;

  // Transform points for chart display with converted units
  const chartData = points.map((p) => {
    const timeLabel = new Date(p.startTime).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
    return {
      time: timeLabel,
      fullTime: p.startTime,
      forecast: convertValue(p.forecast, unit),
      actual: p.actual !== null ? convertValue(p.actual, unit) : null,
      error: p.error !== null ? convertValue(p.error, unit) : null,
      horizon: p.horizonHours,
      publishTime: new Date(p.publishTime).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      }),
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Context Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-white border border-white/20">
                Decision Snapshot
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Delivery Day: {new Date(day).toLocaleDateString("en-GB", { dateStyle: "full" })}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Forecasts strictly frozen at gate closure on D-1. No post-deadline data lookahead is permitted.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-lg border border-slate-700/60">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-400">Decision Freeze: </span>
              <span className="font-semibold text-white">{deadlineLocal}</span>
              <span className="text-slate-500 ml-1">({new Date(deadlineUtc).toISOString().slice(11, 16)} UTC)</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Mean Expected Power"
          value={formatPower(summary.meanForecastMw, unit)}
          badge="Average"
          badgeColor="blue"
          subValue={`Day total: ${formatPower(summary.totalEnergyMwh, unit, false)} ${unit === "MW" ? "MWh" : "GWh"}`}
          icon={<Zap className="w-4 h-4 text-white" />}
        />
        <MetricCard
          label="Peak Generation Output"
          value={formatPower(summary.maxForecastMw, unit)}
          badge="Peak"
          badgeColor="emerald"
          subValue="Maximum hourly wind production"
          icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
        />
        <MetricCard
          label="Minimum Trough Output"
          value={formatPower(summary.minForecastMw, unit)}
          badge="Trough"
          badgeColor="slate"
          subValue="Minimum hourly generation base"
          icon={<TrendingDown className="w-4 h-4 text-slate-400" />}
        />
        <MetricCard
          label="Decision Lead Time"
          value="~15h - 39h"
          badge="Auction Gate"
          badgeColor="amber"
          subValue="Time between D-1 09:00 and delivery hours"
          icon={<Clock className="w-4 h-4 text-amber-400" />}
        />
      </div>

      {/* Main Intraday Profile Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              24-Hour Wind Profile: Decision Forecast vs Outturn Actuals
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Hourly comparison for power purchase decisions (values in {unit})
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-white">
              <span className="w-3 h-1 bg-white rounded" /> Decision Forecast
            </span>
            <span className="flex items-center gap-1.5 text-orange-400">
              <span className="w-3 h-1 bg-orange-500 rounded" /> Outturn Actual (FUELHH)
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg shadow-xl text-xs space-y-1.5 min-w-[200px]">
                        <div className="font-bold text-white border-b border-slate-800 pb-1">
                          Delivery Time: {label} UTC
                        </div>
                        <div className="flex justify-between text-white">
                          <span>Decision Forecast:</span>
                          <span className="font-semibold">{row.forecast} {unit}</span>
                        </div>
                        {row.actual !== null && (
                          <div className="flex justify-between text-orange-400">
                            <span>Outturn Actual:</span>
                            <span className="font-semibold">{row.actual} {unit}</span>
                          </div>
                        )}
                        {row.error !== null && (
                          <div className={`flex justify-between font-semibold ${row.error > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                            <span>{row.error > 0 ? "Over-Forecast (Shortfall):" : "Under-Forecast:"}</span>
                            <span>{row.error > 0 ? `+${row.error}` : row.error} {unit}</span>
                          </div>
                        )}
                        <div className="border-t border-slate-800 pt-1 text-slate-400 flex justify-between">
                          <span>Latest Revision:</span>
                          <span>{row.publishTime} UTC ({row.horizon}h lead)</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#3b82f6" }}
                name="Decision Forecast"
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#f97316"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={{ r: 2.5, fill: "#f97316" }}
                name="Outturn Actual"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Decision Points Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight">
            Hourly Audit & Revision Ledger
          </h3>
          <span className="text-xs text-slate-400">
            {points.length} hourly delivery targets
          </span>
        </div>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Delivery Target (UTC)</th>
                <th className="py-2.5 px-4">Decision Forecast ({unit})</th>
                <th className="py-2.5 px-4">Outturn Actual ({unit})</th>
                <th className="py-2.5 px-4">Error ({unit})</th>
                <th className="py-2.5 px-4">Selected Publish Time</th>
                <th className="py-2.5 px-4">Lead Horizon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {points.map((p, idx) => {
                const isOver = p.error !== null && p.error > 0;
                return (
                  <tr key={idx} className="hover:bg-slate-855 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-white">
                      {new Date(p.startTime).toISOString().slice(11, 16)} UTC
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-white">
                      {formatPower(p.forecast, unit, false)}
                    </td>
                    <td className="py-2.5 px-4 text-orange-400 font-semibold">
                      {p.actual !== null ? formatPower(p.actual, unit, false) : "-"}
                    </td>
                    <td className="py-2.5 px-4">
                      {p.error !== null ? (
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                            isOver
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {isOver ? `+${formatPower(p.error, unit, false)} (Shortfall)` : `${formatPower(p.error, unit, false)} (Surplus)`}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 font-mono">
                      {new Date(p.publishTime).toISOString().slice(11, 16)} UTC
                    </td>
                    <td className="py-2.5 px-4 text-slate-300 font-medium">
                      {p.horizonHours}h
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
