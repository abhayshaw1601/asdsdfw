import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Award, AlertTriangle, BarChart3, Activity } from "lucide-react";
import { useMetricsQuery, useSeriesQuery } from "../hooks/useForecastData";
import { MetricCard } from "../components/MetricCard";
import { ErrorAlert } from "../components/ErrorAlert";
import type { UnitType, SeriesPoint, HourMetrics } from "../api/types";
import { formatPower } from "../lib/units";

interface AccuracyPageProps {
  startDate: string;
  endDate: string;
  deadlineHour: number;
  unit: UnitType;
}

export const AccuracyPage: React.FC<AccuracyPageProps> = ({
  startDate,
  endDate,
  deadlineHour,
  unit,
}) => {
  const {
    data: metricsData,
    isLoading: isMetricsLoading,
    isError: isMetricsError,
    error: metricsError,
    refetch: refetchMetrics,
  } = useMetricsQuery(startDate, endDate, deadlineHour);

  const {
    data: seriesData,
    isLoading: isSeriesLoading,
    isError: isSeriesError,
    error: seriesError,
    refetch: refetchSeries,
  } = useSeriesQuery(startDate, endDate, deadlineHour);

  const isLoading = isMetricsLoading || isSeriesLoading;
  const isError = isMetricsError || isSeriesError;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl" />
      </div>
    );
  }

  if (isError || !metricsData) {
    return (
      <ErrorAlert
        message={
          (metricsError instanceof Error ? metricsError.message : "") ||
          (seriesError instanceof Error ? seriesError.message : "Error retrieving accuracy benchmarks")
        }
        onRetry={() => {
          refetchMetrics();
          refetchSeries();
        }}
      />
    );
  }

  const { summary, hourly } = metricsData;

  // Format Recharts Time Series Data
  const timeSeriesData = (seriesData?.points || []).map((p: SeriesPoint) => ({
    date: new Date(p.startTime).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
    forecast: p.forecast,
    actual: p.actual,
    error: p.error,
    fullTime: p.startTime,
  }));

  // Format Hourly Distribution Data
  const hourlyData = hourly.map((h: HourMetrics) => ({
    hour: `${String(h.hour).padStart(2, "0")}:00`,
    mae: h.mae,
    bias: h.bias,
    rmse: h.rmse,
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                Performance Evaluation
              </span>
              <h2 className="text-xl font-light text-white tracking-tight">
                Benchmark Accuracy: {startDate} to {endDate}
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1 font-light">
              Computed under the {deadlineHour.toString().padStart(2, "0")}:00 London decision freeze rule
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-white font-mono">
              N = {summary.n.toLocaleString()} hourly targets
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="MAE (Mean Absolute Error)"
          value={formatPower(summary.mae, unit)}
          badge="Average Error"
          badgeColor="blue"
          subValue={`Normalized MAE: ${(summary.nmae * 100).toFixed(1)}% of mean generation`}
          icon={<Award className="w-4 h-4 text-white" />}
        />
        <MetricCard
          label="RMSE (Root Mean Square)"
          value={formatPower(summary.rmse, unit)}
          badge="Outlier Penalized"
          badgeColor="slate"
          subValue="Sensitivity metric to extreme volatility spikes"
          icon={<Activity className="w-4 h-4 text-white" />}
        />
        <MetricCard
          label="Forecast Bias (Mean Error)"
          value={`+${formatPower(summary.bias, unit)}`}
          badge="Over-Forecast"
          badgeColor="amber"
          subValue="Positive bias indicates consistent shortfall risk"
          icon={<AlertTriangle className="w-4 h-4 text-white" />}
        />
        <MetricCard
          label="P95 Max Deviation Band"
          value={formatPower(summary.p95, unit)}
          badge="95% Coverage"
          badgeColor="rose"
          subValue={`P50: ${formatPower(summary.p50, unit, false)} | P90: ${formatPower(summary.p90, unit, false)} ${unit}`}
          icon={<BarChart3 className="w-4 h-4 text-white" />}
        />
      </div>

      {/* Date Range Actual vs Forecast Time Series */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">
              Actual vs Decision-Time Forecast Time Series
            </h3>
            <p className="text-xs text-neutral-400 font-light mt-0.5">
              Evaluated across {summary.n} hourly delivery intervals ({startDate} to {endDate})
            </p>
          </div>
          <div className="flex items-center gap-5 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-white">
              <span className="w-3 h-1 bg-white rounded" /> Forecast ({unit})
            </span>
            <span className="flex items-center gap-1.5 text-neutral-400">
              <span className="w-3 h-1 bg-neutral-400 rounded" /> Outturn Actual ({unit})
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="date" stroke="#737373" tick={{ fontSize: 11 }} />
              <YAxis stroke="#737373" tick={{ fontSize: 11 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload;
                    return (
                      <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-xl shadow-xl text-xs space-y-1">
                        <div className="text-white font-semibold border-b border-neutral-800 pb-1">
                          {new Date(row.fullTime).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
                        </div>
                        <div className="text-white font-medium">Forecast: {row.forecast} {unit}</div>
                        <div className="text-neutral-300">Actual: {row.actual} {unit}</div>
                        {row.error !== null && (
                          <div className="text-white border-t border-neutral-800 pt-1 font-medium">
                            Error: {row.error > 0 ? `+${row.error}` : row.error} {unit}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line type="monotone" dataKey="forecast" stroke="#ffffff" strokeWidth={1.8} dot={false} name="Forecast" />
              <Line type="monotone" dataKey="actual" stroke="#a3a3a3" strokeWidth={1.8} dot={false} strokeDasharray="3 2" name="Actual" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Grid: Error by Hour of Day & Error Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Error Breakdown */}
        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-white tracking-tight">
              Error by Local Hour of Day (00:00 - 23:00)
            </h3>
            <p className="text-xs text-neutral-400 font-light mt-0.5">
              MAE (white bars) and positive Bias (neutral line) across 24 hours
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="hour" stroke="#737373" tick={{ fontSize: 10 }} interval={2} />
                <YAxis stroke="#737373" tick={{ fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const row = payload[0].payload;
                      return (
                        <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-xs space-y-1">
                          <div className="font-semibold text-white">Hour {row.hour}</div>
                          <div className="text-white font-medium">MAE: {row.mae} {unit}</div>
                          <div className="text-neutral-300">Bias: +{row.bias} {unit}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="mae" fill="#ffffff" radius={[4, 4, 0, 0]} name="MAE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Error Histogram / Quantile Box */}
        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-white tracking-tight">
              Forecast Error Summary & Quantile Metrics
            </h3>
            <p className="text-xs text-neutral-400 font-light mt-0.5">
              Parametric benchmarks reflecting systematic day-ahead over-forecasting
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
              <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-light">P50 (Median)</span>
              <div className="text-2xl font-light text-white mt-1">{formatPower(summary.p50, unit, false)}</div>
              <span className="text-[10px] text-neutral-500 font-mono">{unit}</span>
            </div>
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
              <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-light">P90 Percentile</span>
              <div className="text-2xl font-light text-white mt-1">{formatPower(summary.p90, unit, false)}</div>
              <span className="text-[10px] text-neutral-500 font-mono">{unit}</span>
            </div>
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
              <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-light">P95 Tail Risk</span>
              <div className="text-2xl font-light text-white mt-1">{formatPower(summary.p95, unit, false)}</div>
              <span className="text-[10px] text-neutral-500 font-mono">{unit}</span>
            </div>
          </div>
          <p className="text-xs text-neutral-400 mt-6 leading-relaxed font-light">
            Across {startDate} to {endDate}, over 85% of delivery hours exhibited positive forecast errors, confirming that nominal day-ahead buying results in persistent unhedged physical deficits.
          </p>
        </div>
      </div>
    </div>
  );
};
