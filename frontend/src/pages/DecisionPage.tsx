import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Clock, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { useDecisionQuery } from "../hooks/useForecastData";
import { MetricCard } from "../components/MetricCard";
import { ErrorAlert } from "../components/ErrorAlert";
import type { UnitType, SeriesPoint } from "../api/types";
import { formatPower } from "../lib/units";

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
  const { data, isLoading, isError, error, refetch } = useDecisionQuery(
    day,
    deadlineHour
  );

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorAlert
        message={error instanceof Error ? error.message : "Unable to retrieve decision data"}
        onRetry={refetch}
      />
    );
  }

  const { points, summary, deadlineLocal, deadlineUtc } = data;

  // Format Recharts data
  const chartData = points.map((p: SeriesPoint) => ({
    time: new Date(p.startTime).toISOString().slice(11, 16),
    forecast: p.forecast,
    actual: p.actual,
    error: p.error,
    horizon: p.horizonHours,
    fullTime: p.startTime,
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner Context Card */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                Decision Snapshot
              </span>
              <h2 className="text-xl font-light text-white tracking-tight">
                Delivery Day: <span className="font-normal">{new Date(day).toLocaleDateString("en-GB", { dateStyle: "full" })}</span>
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1 font-light">
              Forecasts strictly frozen at gate closure on D-1. No post-deadline data lookahead is permitted.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-neutral-950 px-4 py-2 rounded-full border border-neutral-800">
            <Clock className="w-4 h-4 text-white shrink-0" />
            <div className="text-xs">
              <span className="text-neutral-400 font-light">Decision Freeze: </span>
              <span className="font-medium text-white">{deadlineLocal}</span>
              <span className="text-neutral-500 ml-1">({new Date(deadlineUtc).toISOString().slice(11, 16)} UTC)</span>
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
          icon={<TrendingUp className="w-4 h-4 text-white" />}
        />
        <MetricCard
          label="Minimum Trough Output"
          value={formatPower(summary.minForecastMw, unit)}
          badge="Trough"
          badgeColor="slate"
          subValue="Minimum hourly generation base"
          icon={<TrendingDown className="w-4 h-4 text-white" />}
        />
        <MetricCard
          label="Decision Lead Time"
          value="~15h - 39h"
          badge="Auction Gate"
          badgeColor="amber"
          subValue="Time between D-1 09:00 and delivery hours"
          icon={<Clock className="w-4 h-4 text-white" />}
        />
      </div>

      {/* Main Intraday Profile Chart */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">
              24-Hour Wind Profile: Decision Forecast vs Outturn Actuals
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5 font-light">
              Hourly comparison for power purchase decisions (values in {unit})
            </p>
          </div>
          <div className="flex items-center gap-5 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-white">
              <span className="w-3 h-1 bg-white rounded" /> Decision Forecast
            </span>
            <span className="flex items-center gap-1.5 text-neutral-400">
              <span className="w-3 h-1 bg-neutral-400 rounded" /> Outturn Actual (FUELHH)
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="time" stroke="#737373" tick={{ fontSize: 11 }} />
              <YAxis stroke="#737373" tick={{ fontSize: 11 }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload;
                    return (
                      <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[200px]">
                        <div className="font-semibold text-white border-b border-neutral-800 pb-1">
                          Delivery Time: {label} UTC
                        </div>
                        <div className="flex justify-between text-white font-medium">
                          <span>Decision Forecast:</span>
                          <span>{row.forecast} {unit}</span>
                        </div>
                        {row.actual !== null && (
                          <div className="flex justify-between text-neutral-300">
                            <span>Outturn Actual:</span>
                            <span>{row.actual} {unit}</span>
                          </div>
                        )}
                        {row.error !== null && (
                          <div className="flex justify-between text-white border-t border-neutral-800/80 pt-1">
                            <span>Deviation:</span>
                            <span>{row.error > 0 ? `+${row.error}` : row.error} {unit}</span>
                          </div>
                        )}
                        <div className="text-neutral-500 text-[11px] font-light">
                          Horizon: {row.horizon}h lead time
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
                stroke="#ffffff"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#ffffff" }}
                name="Decision Forecast"
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#a3a3a3"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 2.5, fill: "#a3a3a3" }}
                name="Outturn Actual"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly Data Table */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">
              Hourly Forecasts & Actuals Schedule
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5 font-light">
              24 hourly delivery settlement windows for {day}
            </p>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            Values in {unit}
          </span>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950 text-neutral-400 sticky top-0 border-b border-neutral-800 font-medium">
              <tr>
                <th className="py-3 px-4">Delivery Time (UTC)</th>
                <th className="py-3 px-4">Decision Forecast</th>
                <th className="py-3 px-4">Actual Outturn</th>
                <th className="py-3 px-4">Error / Deviation</th>
                <th className="py-3 px-4">Publish Timestamp</th>
                <th className="py-3 px-4">Lead Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/70">
              {points.map((p: SeriesPoint, idx: number) => {
                const isOver = p.error !== null && p.error > 0;
                return (
                  <tr key={idx} className="hover:bg-neutral-850/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-white">
                      {new Date(p.startTime).toISOString().slice(11, 16)} UTC
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {formatPower(p.forecast, unit, false)}
                    </td>
                    <td className="py-3 px-4 text-white font-medium">
                      {p.actual !== null ? formatPower(p.actual, unit, false) : "-"}
                    </td>
                    <td className="py-3 px-4">
                      {p.error !== null ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-800 text-white border border-neutral-700">
                          {isOver ? `+${formatPower(p.error, unit, false)} (Shortfall)` : `${formatPower(p.error, unit, false)} (Surplus)`}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 px-4 text-neutral-400 font-mono">
                      {new Date(p.publishTime).toISOString().slice(11, 16)} UTC
                    </td>
                    <td className="py-3 px-4 text-neutral-300 font-medium">
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
