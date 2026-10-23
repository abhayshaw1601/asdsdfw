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
        <div className="h-20 bg-black/30 border border-white/10 rounded-2xl backdrop-blur-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
        message={error instanceof Error ? error.message : "Unable to retrieve decision data"}
        onRetry={refetch}
      />
    );
  }

  const { points, summary, deadlineLocal } = data;

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
      <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/15">
              Decision Snapshot
            </span>
            <h2 className="text-base sm:text-lg font-light text-white tracking-tight">
              Delivery: <span className="font-semibold text-white">{new Date(day).toLocaleDateString("en-GB", { dateStyle: "medium" })}</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 bg-black/40 px-3.5 py-1.5 rounded-full border border-white/15">
            <Clock className="w-3.5 h-3.5 text-white opacity-80" />
            <span className="text-xs text-neutral-300 font-light">
              Freeze: <strong className="text-white font-medium">{deadlineLocal}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Mean Power"
          value={formatPower(summary.meanForecastMw, unit)}
          badge="Average"
          subValue={`24h: ${formatPower(summary.totalEnergyMwh, unit, false)} ${unit === "MW" ? "MWh" : "GWh"}`}
          icon={<Zap className="w-4 h-4 text-white" />}
        />
        <MetricCard
          label="Peak Generation"
          value={formatPower(summary.maxForecastMw, unit)}
          badge="Max"
          subValue="Maximum production peak"
          icon={<TrendingUp className="w-4 h-4 text-white" />}
        />
        <MetricCard
          label="Minimum Trough"
          value={formatPower(summary.minForecastMw, unit)}
          badge="Min"
          subValue="Baseload generation floor"
          icon={<TrendingDown className="w-4 h-4 text-white" />}
        />
        <MetricCard
          label="Auction Horizon"
          value="15h - 39h"
          badge="D-1 Gate"
          subValue="Lead time to delivery"
          icon={<Clock className="w-4 h-4 text-white" />}
        />
      </div>

      {/* Main Intraday Profile Chart */}
      <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">
              24-Hour Wind Profile ({unit})
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-white">
              <span className="w-3 h-1 bg-white rounded" /> Decision Forecast
            </span>
            <span className="flex items-center gap-1.5 text-neutral-400">
              <span className="w-3 h-1 bg-neutral-400 rounded" /> Outturn Actual
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
                      <div className="bg-neutral-950/95 border border-white/15 p-3 rounded-xl shadow-2xl text-xs space-y-1 min-w-[180px] backdrop-blur-md">
                        <div className="font-semibold text-white border-b border-white/10 pb-1">
                          Delivery: {label} UTC
                        </div>
                        <div className="flex justify-between text-white">
                          <span>Forecast:</span>
                          <span className="font-semibold">{row.forecast} {unit}</span>
                        </div>
                        {row.actual !== null && (
                          <div className="flex justify-between text-neutral-300">
                            <span>Actual:</span>
                            <span>{row.actual} {unit}</span>
                          </div>
                        )}
                        {row.error !== null && (
                          <div className="flex justify-between text-white border-t border-white/10 pt-1">
                            <span>Deviation:</span>
                            <span>{row.error > 0 ? `+${row.error}` : row.error} {unit}</span>
                          </div>
                        )}
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
      <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">
            Hourly Schedule ({day})
          </h3>
          <span className="text-xs text-neutral-400 font-mono">
            {unit}
          </span>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950/80 text-neutral-400 sticky top-0 border-b border-white/10 font-medium backdrop-blur-md">
              <tr>
                <th className="py-2.5 px-4">Time (UTC)</th>
                <th className="py-2.5 px-4">Forecast</th>
                <th className="py-2.5 px-4">Actual</th>
                <th className="py-2.5 px-4">Deviation</th>
                <th className="py-2.5 px-4">Published</th>
                <th className="py-2.5 px-4">Horizon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {points.map((p: SeriesPoint, idx: number) => {
                const isOver = p.error !== null && p.error > 0;
                return (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-white">
                      {new Date(p.startTime).toISOString().slice(11, 16)}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-white">
                      {formatPower(p.forecast, unit, false)}
                    </td>
                    <td className="py-2.5 px-4 text-white font-medium">
                      {p.actual !== null ? formatPower(p.actual, unit, false) : "-"}
                    </td>
                    <td className="py-2.5 px-4">
                      {p.error !== null ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white border border-white/15">
                          {isOver ? `+${formatPower(p.error, unit, false)} Short` : `${formatPower(p.error, unit, false)} Surplus`}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-400 font-mono">
                      {new Date(p.publishTime).toISOString().slice(11, 16)}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-300">
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
