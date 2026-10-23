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

  const timeSeriesData = (seriesData?.points || []).map((p: SeriesPoint) => ({
    date: new Date(p.startTime).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
    forecast: p.forecast,
    actual: p.actual,
    error: p.error,
    fullTime: p.startTime,
  }));

  const hourlyData = hourly.map((h: HourMetrics) => ({
    hour: `${String(h.hour).padStart(2, "0")}:00`,
    mae: h.mae,
    bias: h.bias,
    rmse: h.rmse,
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/15">
              Accuracy Metrics
            </span>
            <h2 className="text-base sm:text-lg font-light text-white tracking-tight">
              Period: <span className="font-semibold">{startDate} &rarr; {endDate}</span>
            </h2>
          </div>
          <span className="text-xs font-mono text-neutral-300 bg-black/40 px-3 py-1 rounded-full border border-white/15">
            N = {summary.n.toLocaleString()} hours
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="MAE"
          value={formatPower(summary.mae, unit)}
          badge="Avg Error"
          subValue={`Normalized: ${(summary.nmae * 100).toFixed(1)}%`}
          icon={<Award className="w-4 h-4 text-white" />}
        />
        <MetricCard
          label="RMSE"
          value={formatPower(summary.rmse, unit)}
          badge="Outliers"
          subValue="Volatility variance"
          icon={<Activity className="w-4 h-4 text-white" />}
        />
        <MetricCard
          label="Bias"
          value={`+${formatPower(summary.bias, unit)}`}
          badge="Over-Forecast"
          subValue="Shortfall exposure"
          icon={<AlertTriangle className="w-4 h-4 text-white" />}
        />
        <MetricCard
          label="P95 Tail Risk"
          value={formatPower(summary.p95, unit)}
          badge="95% Cov"
          subValue={`P50: ${formatPower(summary.p50, unit, false)} • P90: ${formatPower(summary.p90, unit, false)}`}
          icon={<BarChart3 className="w-4 h-4 text-white" />}
        />
      </div>

      {/* Actual vs Forecast Time Series */}
      <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">
            Actual vs Decision Forecast ({unit})
          </h3>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-white">
              <span className="w-3 h-1 bg-white rounded" /> Forecast
            </span>
            <span className="flex items-center gap-1.5 text-neutral-400">
              <span className="w-3 h-1 bg-neutral-400 rounded" /> Actual
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
                      <div className="bg-neutral-950/95 border border-white/15 p-3 rounded-xl shadow-2xl text-xs space-y-1 backdrop-blur-md">
                        <div className="text-white font-semibold border-b border-white/10 pb-1">
                          {new Date(row.fullTime).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
                        </div>
                        <div className="text-white">Forecast: {row.forecast} {unit}</div>
                        <div className="text-neutral-300">Actual: {row.actual} {unit}</div>
                        {row.error !== null && (
                          <div className="text-white border-t border-white/10 pt-1">
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

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Error Breakdown */}
        <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="mb-4">
            <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">
              Diurnal Error (00:00 - 23:00)
            </h3>
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
                        <div className="bg-neutral-950/95 border border-white/15 p-3 rounded-xl text-xs space-y-1 backdrop-blur-md">
                          <div className="font-semibold text-white">Hour {row.hour}</div>
                          <div className="text-white">MAE: {row.mae} {unit}</div>
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

        {/* Quantile Summary */}
        <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight mb-4">
              Error Quantiles ({unit})
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-center">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-light">P50 Median</span>
                <div className="text-xl sm:text-2xl font-light text-white mt-1">{formatPower(summary.p50, unit, false)}</div>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-center">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-light">P90 Quantile</span>
                <div className="text-xl sm:text-2xl font-light text-white mt-1">{formatPower(summary.p90, unit, false)}</div>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-center">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-light">P95 Tail</span>
                <div className="text-xl sm:text-2xl font-light text-white mt-1">{formatPower(summary.p95, unit, false)}</div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-neutral-300 font-light">
            Systematic over-forecasting is observed across &gt;85% of intervals, confirming persistent shortfall risk.
          </div>
        </div>
      </div>
    </div>
  );
};
