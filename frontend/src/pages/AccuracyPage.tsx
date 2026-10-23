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
  ScatterChart,
  Scatter,
  ReferenceLine,
} from "recharts";
import { Award, AlertTriangle, BarChart3, Activity } from "lucide-react";
import { useMetricsQuery, useSeriesQuery } from "../hooks/useForecastData";
import { MetricCard } from "../components/MetricCard";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { ErrorAlert } from "../components/ErrorAlert";
import { formatPower, convertValue } from "../lib/units";
import type { UnitType } from "../api/types";

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
  const metricsQuery = useMetricsQuery(startDate, endDate, deadlineHour);
  const seriesQuery = useSeriesQuery(startDate, endDate, deadlineHour);

  if (metricsQuery.isLoading || seriesQuery.isLoading) {
    return <LoadingSkeleton rows={4} height="h-64" />;
  }

  if (metricsQuery.error || seriesQuery.error || !metricsQuery.data || !seriesQuery.data) {
    const errorMsg =
      metricsQuery.error?.message || seriesQuery.error?.message || "Failed to load accuracy data";
    return <ErrorAlert message={errorMsg} onRetry={() => { metricsQuery.refetch(); seriesQuery.refetch(); }} />;
  }

  const { summary, hourly } = metricsQuery.data;
  const seriesPoints = seriesQuery.data.points;

  // Hourly metrics converted
  const hourlyData = hourly.map((h) => ({
    hour: `${String(h.hour).padStart(2, "0")}:00`,
    hourNum: h.hour,
    mae: convertValue(h.mae, unit),
    rmse: convertValue(h.rmse, unit),
    bias: convertValue(h.bias, unit),
    n: h.n,
  }));

  // Time-series points for range chart
  const timeSeriesData = seriesPoints.map((p) => ({
    date: new Date(p.startTime).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
    fullTime: p.startTime,
    forecast: convertValue(p.forecast, unit),
    actual: p.actual !== null ? convertValue(p.actual, unit) : null,
    error: p.error !== null ? convertValue(p.error, unit) : null,
  }));

  // Scatter plot data
  const scatterData = seriesPoints
    .filter((p) => p.actual !== null)
    .map((p) => ({
      actual: convertValue(p.actual ?? 0, unit),
      forecast: convertValue(p.forecast, unit),
      error: convertValue(p.error ?? 0, unit),
    }));

  // Compute error distribution bins for histogram
  const errors = seriesPoints.map((p) => p.error).filter((e): e is number => e !== null);
  const minErr = errors.length ? Math.min(...errors) : 0;
  const maxErr = errors.length ? Math.max(...errors) : 0;
  const binCount = 12;
  const binStep = (maxErr - minErr) / binCount || 1;

  const histogramData = Array.from({ length: binCount }).map((_, idx) => {
    const bStart = minErr + idx * binStep;
    const bEnd = bStart + binStep;
    const count = errors.filter((e) => e >= bStart && (idx === binCount - 1 ? e <= bEnd : e < bEnd)).length;
    return {
      binLabel: `${Math.round(convertValue(bStart, unit))} to ${Math.round(convertValue(bEnd, unit))}`,
      count,
      isPositive: (bStart + bEnd) / 2 > 0,
    };
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="MAE (Mean Absolute Error)"
          value={formatPower(summary.mae, unit)}
          badge="Average Error"
          badgeColor="blue"
          subValue={`Normalized MAE: ${(summary.nmae * 100).toFixed(1)}% of mean generation`}
          icon={<Award className="w-4 h-4 text-blue-400" />}
        />
        <MetricCard
          label="RMSE (Root Mean Square)"
          value={formatPower(summary.rmse, unit)}
          badge="Volatility"
          badgeColor="slate"
          subValue="Penalizes large outlier forecast errors"
          icon={<Activity className="w-4 h-4 text-slate-400" />}
        />
        <MetricCard
          label="Forecast Bias (Mean Error)"
          value={`+${formatPower(summary.bias, unit)}`}
          badge="Over-Forecast"
          badgeColor="amber"
          subValue="Positive bias indicates consistent shortfall risk"
          icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
        />
        <MetricCard
          label="P95 Max Deviation Band"
          value={formatPower(summary.p95, unit)}
          badge="95% Coverage"
          badgeColor="rose"
          subValue={`P50: ${formatPower(summary.p50, unit, false)} | P90: ${formatPower(summary.p90, unit, false)} ${unit}`}
          icon={<BarChart3 className="w-4 h-4 text-rose-400" />}
        />
      </div>

      {/* Date Range Actual vs Forecast Time Series */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Actual vs Decision-Time Forecast Time Series
            </h3>
            <p className="text-xs text-slate-400">
              Evaluated across {summary.n} hourly delivery intervals ({startDate} to {endDate})
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-3 h-1 bg-blue-500 rounded" /> Forecast ({unit})
            </span>
            <span className="flex items-center gap-1.5 text-orange-400">
              <span className="w-3 h-1 bg-orange-500 rounded" /> Outturn Actual ({unit})
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg shadow-xl text-xs space-y-1">
                        <div className="text-white font-semibold">
                          {new Date(row.fullTime).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
                        </div>
                        <div className="text-blue-400">Forecast: {row.forecast} {unit}</div>
                        <div className="text-orange-400">Actual: {row.actual} {unit}</div>
                        {row.error !== null && (
                          <div className={row.error > 0 ? "text-amber-400" : "text-emerald-400"}>
                            Error: {row.error > 0 ? `+${row.error}` : row.error} {unit}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line type="monotone" dataKey="forecast" stroke="#3b82f6" strokeWidth={1.8} dot={false} name="Forecast" />
              <Line type="monotone" dataKey="actual" stroke="#f97316" strokeWidth={1.8} dot={false} strokeDasharray="3 2" name="Actual" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Grid: Error by Hour of Day & Error Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Error Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Error by Local Hour of Day (00:00 - 23:00)
            </h3>
            <p className="text-xs text-slate-400">
              MAE (blue bars) and positive Bias (orange line) across 24 hours
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 10 }} interval={2} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const row = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs space-y-1">
                          <div className="font-semibold text-white">Hour {row.hour}</div>
                          <div className="text-blue-400">MAE: {row.mae} {unit}</div>
                          <div className="text-orange-400">Bias: +{row.bias} {unit}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="mae" fill="#3b82f6" radius={[4, 4, 0, 0]} name="MAE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Error Histogram */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Forecast Error Distribution (MW)
            </h3>
            <p className="text-xs text-slate-400">
              Skew towards positive values illustrates systematic day-ahead over-forecasting
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="binLabel"
                  stroke="#64748b"
                  tick={{ fontSize: 9 }}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const row = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs">
                          <div className="font-semibold text-white">Error Range: {row.binLabel} {unit}</div>
                          <div className="text-slate-300 mt-1">Frequency: {row.count} hours</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Scatter Plot: Actual vs Forecast */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-white tracking-tight">
            Actual vs Forecast Correlation Scatter
          </h3>
          <p className="text-xs text-slate-400">
            Points above the diagonal reference line indicate over-forecast outturns
          </p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="actual" name="Actual Outturn" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: `Actual (${unit})`, position: "insideBottomRight", offset: -5, fontSize: 10, fill: "#94a3b8" }} />
              <YAxis dataKey="forecast" name="Decision Forecast" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: `Forecast (${unit})`, angle: -90, position: "insideLeft", fontSize: 10, fill: "#94a3b8" }} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs space-y-1">
                        <div className="text-orange-400">Actual: {row.actual} {unit}</div>
                        <div className="text-blue-400">Forecast: {row.forecast} {unit}</div>
                        <div className={row.error > 0 ? "text-amber-400" : "text-emerald-400"}>
                          Error: {row.error > 0 ? `+${row.error}` : row.error} {unit}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine stroke="#475569" strokeDasharray="4 4" segment={[{ x: 0, y: 0 }, { x: convertValue(18000, unit), y: convertValue(18000, unit) }]} />
              <Scatter data={scatterData} fill="#38bdf8" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
