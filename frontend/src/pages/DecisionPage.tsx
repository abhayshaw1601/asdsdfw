import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Flame,
  ShieldCheck,
  Sliders,
  Download,
  BookmarkPlus,
  Check,
} from "lucide-react";
import { useDecisionQuery } from "../hooks/useForecastData";
import { MetricCard } from "../components/MetricCard";
import { ErrorAlert } from "../components/ErrorAlert";
import { EnergyCopilot } from "../components/EnergyCopilot";
import { TradeJournal } from "../components/TradeJournal";
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

  // Consumer demand state in MW (default: 18,000 MW typical GB winter utility baseload)
  const [consumerDemandMw, setConsumerDemandMw] = useState<number>(18000);
  const [showDemandOverlay, setShowDemandOverlay] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState(false);
  const [portfolioSaved, setPortfolioSaved] = useState(false);
  const [customPortfolios, setCustomPortfolios] = useState<Array<{ name: string; demandMw: number }>>([]);
  const [imbalancePrice, setImbalancePrice] = useState<number>(125);

  const fetchCustomPortfolios = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setCustomPortfolios([]);
      return;
    }
    try {
      const res = await fetch("/api/v1/trader/portfolios", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCustomPortfolios(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCustomPortfolios();
  }, []);

  const handleExportOrderSheet = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      alert("Please sign in as a trader to export Day-Ahead auction bidding sheets.");
      return;
    }
    try {
      setIsExporting(true);
      const url = `/api/v1/trader/export-order-sheet?day=${day}&deadline_hour=${deadlineHour}&demand_mw=${consumerDemandMw}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to export order sheet");
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `UK_DayAhead_OrderSheet_${day}_Freeze${deadlineHour.toString().padStart(2, "0")}London.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSavePortfolio = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      alert("Please sign in to save custom utility demand portfolios.");
      return;
    }
    const name = prompt("Enter a name for this demand profile:", `Portfolio ${consumerDemandMw / 1000}GW`);
    if (!name) return;

    try {
      const res = await fetch("/api/v1/trader/portfolios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          demandMw: consumerDemandMw,
          description: `Custom consumer baseline for ${day}`,
        }),
      });
      if (res.ok) {
        setPortfolioSaved(true);
        setTimeout(() => setPortfolioSaved(false), 3000);
        await fetchCustomPortfolios();
      }
    } catch {
      // ignore
    }
  };

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

  // Demand scaled to current unit (MW or GW)
  const displayDemand = unit === "GW" ? consumerDemandMw / 1000 : consumerDemandMw;

  // Format Recharts data with demand & thermal gap
  const chartData = points.map((p: SeriesPoint) => {
    const forecastVal = unit === "GW" ? p.forecast / 1000 : p.forecast;
    const actualVal = p.actual !== null ? (unit === "GW" ? p.actual / 1000 : p.actual) : null;
    const thermalGap = Math.max(0, displayDemand - forecastVal);

    return {
      time: new Date(p.startTime).toISOString().slice(11, 16),
      forecast: Number(forecastVal.toFixed(2)),
      actual: actualVal !== null ? Number(actualVal.toFixed(2)) : null,
      demand: Number(displayDemand.toFixed(2)),
      thermalGap: Number(thermalGap.toFixed(2)),
      error: p.error,
      horizon: p.horizonHours,
      fullTime: p.startTime,
    };
  });

  // Calculate Net Thermal Procurement metrics
  const netThermalNeededMw = Math.max(0, consumerDemandMw - summary.meanForecastMw);
  const p90SafetyBufferMw = 1851; // Benchmark P90 wind shortfall hedge
  const totalRecommendedThermalBuyMw = netThermalNeededMw + p90SafetyBufferMw;

  return (
    <div className="space-y-6">
      {/* Top Banner Context Card */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.05] hover:bg-white/[0.07] backdrop-blur-2xl border border-white/20 p-4 sm:p-5 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.25),0_12px_36px_rgba(0,0,0,0.45)] transition-all">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
              Decision Snapshot
            </span>
            <h2 className="text-base sm:text-lg font-light text-white tracking-tight">
              Delivery: <span className="font-semibold text-white">{new Date(day).toLocaleDateString("en-GB", { dateStyle: "medium" })}</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 bg-white/[0.08] px-3.5 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
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
          label="Mean Wind Power"
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

      {/* Thermal Procurement & Residual Demand Card (Challenge Requirement) */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.05] hover:bg-white/[0.07] backdrop-blur-2xl border border-white/20 p-5 sm:p-6 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.25),0_12px_36px_rgba(0,0,0,0.45)] transition-all">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white border border-white/20">
                UK Day-Ahead Procurement Desk
              </span>
              <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">
                Thermal Power Purchase Requirement
              </h3>
            </div>
            <p className="text-xs text-neutral-300 font-light">
              Calculates additional thermal power (e.g., CCGT peakers) required to serve consumer demand beyond forecasted wind.
            </p>
          </div>

          {/* Consumer Demand Target Controls & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-300 font-medium flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-white opacity-80" />
              Consumer Demand:
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { label: "14 GW", mw: 14000 },
                { label: "18 GW", mw: 18000 },
                { label: "22 GW", mw: 22000 },
                ...customPortfolios.map((p) => ({ label: p.name, mw: p.demandMw })),
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setConsumerDemandMw(preset.mw)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                    consumerDemandMw === preset.mw
                      ? "bg-white text-neutral-950 font-semibold"
                      : "bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 border border-white/10"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 ml-1">
              <button
                onClick={handleSavePortfolio}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 rounded-full text-xs font-medium text-white transition-colors cursor-pointer"
                title="Save this demand baseline to MongoDB"
              >
                {portfolioSaved ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <BookmarkPlus className="w-3.5 h-3.5 text-white opacity-80" />
                )}
                <span>{portfolioSaved ? "Saved" : "Save Profile"}</span>
              </button>
              <button
                onClick={handleExportOrderSheet}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-neutral-200 text-neutral-950 rounded-full text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                title="Download EPEX SPOT / Nord Pool bidding schedule CSV"
              >
                <Download className="w-3.5 h-3.5 text-neutral-950" />
                <span>{isExporting ? "Exporting..." : "Order Sheet (CSV)"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Procurement Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3.5">
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider block mb-1">
              Target Consumer Demand
            </span>
            <div className="text-xl font-bold text-white">
              {formatPower(consumerDemandMw, unit)}
            </div>
            <span className="text-[11px] text-neutral-300">Utility client load</span>
          </div>

          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3.5">
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider block mb-1">
              Forecast Wind Generation
            </span>
            <div className="text-xl font-bold text-white">
              {formatPower(summary.meanForecastMw, unit)}
            </div>
            <span className="text-[11px] text-neutral-300">Renewable supply at freeze</span>
          </div>

          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-neutral-400 uppercase tracking-wider block">
                Net Thermal Deficit
              </span>
              <Flame className="w-3.5 h-3.5 text-white opacity-80" />
            </div>
            <div className="text-xl font-bold text-white">
              {formatPower(netThermalNeededMw, unit)}
            </div>
            <span className="text-[11px] text-neutral-300">Demand minus wind forecast</span>
          </div>

          <div className="bg-white/[0.08] border border-white/20 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-neutral-300 uppercase tracking-wider font-semibold block">
                Recommended Order (P90)
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="text-xl font-bold text-white">
              {formatPower(totalRecommendedThermalBuyMw, unit)}
            </div>
            <span className="text-[11px] text-neutral-300">Includes +{formatPower(p90SafetyBufferMw, unit)} hedge</span>
          </div>
        </div>

        {/* Financial Imbalance Risk Mitigation Banner */}
        <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-neutral-300">
              <strong className="text-white font-medium">Imbalance Risk Mitigated:</strong> Estimated{" "}
              <span className="text-white font-semibold">
                £{Math.round(1851.53 * 2.5 * Math.max(15, imbalancePrice - 78) * 0.90).toLocaleString()}/day
              </span>{" "}
              in cash-out penalties avoided via P90 buffer.
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-neutral-400 font-mono">Cash-out SBP:</span>
            {[90, 125, 180].map((price) => (
              <button
                key={price}
                onClick={() => setImbalancePrice(price)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  imbalancePrice === price
                    ? "bg-white text-neutral-950 font-bold"
                    : "bg-white/10 text-neutral-300 hover:text-white"
                }`}
              >
                £{price}/MWh
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Intraday Profile Chart */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.05] hover:bg-white/[0.07] backdrop-blur-2xl border border-white/20 p-5 sm:p-6 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.25),0_12px_36px_rgba(0,0,0,0.45)] transition-all">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">
              24-Hour Wind Profile & Demand ({unit})
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium flex-wrap">
            <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300 hover:text-white mr-2">
              <input
                type="checkbox"
                checked={showDemandOverlay}
                onChange={(e) => setShowDemandOverlay(e.target.checked)}
                className="rounded border-white/20 bg-white/10 text-white focus:ring-0 cursor-pointer"
              />
              <span>Overlay Demand</span>
            </label>
            <span className="flex items-center gap-1.5 text-white">
              <span className="w-3 h-1 bg-white rounded" /> Wind Forecast
            </span>
            <span className="flex items-center gap-1.5 text-neutral-400">
              <span className="w-3 h-1 bg-neutral-400 rounded" /> Outturn Actual
            </span>
            {showDemandOverlay && (
              <span className="flex items-center gap-1.5 text-neutral-300">
                <span className="w-3 h-0.5 border-b border-dashed border-neutral-300" /> Consumer Demand
              </span>
            )}
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
                        {showDemandOverlay && (
                          <>
                            <div className="flex justify-between text-neutral-400 border-t border-white/10 pt-1">
                              <span>Demand:</span>
                              <span>{row.demand} {unit}</span>
                            </div>
                            <div className="flex justify-between text-white font-semibold">
                              <span>Thermal Deficit:</span>
                              <span>{row.thermalGap} {unit}</span>
                            </div>
                          </>
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
                name="Wind Forecast"
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
              {showDemandOverlay && (
                <Line
                  type="monotone"
                  dataKey="demand"
                  stroke="#d4d4d4"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Consumer Demand"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly Data Table */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.05] hover:bg-white/[0.07] backdrop-blur-2xl border border-white/20 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.25),0_12px_36px_rgba(0,0,0,0.45)] transition-all">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
        <div className="p-4 sm:p-5 border-b border-white/15 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">
              Hourly Schedule & Procurement Balance ({day})
            </h3>
            <p className="text-xs text-neutral-400 font-light mt-0.5">
              Target delivery periods with residual thermal procurement requirements
            </p>
          </div>
          <span className="text-xs text-neutral-300 font-mono">
            {unit}
          </span>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-white/[0.05] text-neutral-300 sticky top-0 border-b border-white/15 font-medium backdrop-blur-md">
              <tr>
                <th className="py-2.5 px-4">Time (UTC)</th>
                <th className="py-2.5 px-4">Wind Forecast</th>
                <th className="py-2.5 px-4">Thermal Buy</th>
                <th className="py-2.5 px-4">Actual Wind</th>
                <th className="py-2.5 px-4">Deviation</th>
                <th className="py-2.5 px-4">Published</th>
                <th className="py-2.5 px-4">Horizon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {points.map((p: SeriesPoint, idx: number) => {
                const isOver = p.error !== null && p.error > 0;
                const thermalGap = Math.max(0, consumerDemandMw - p.forecast);
                return (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-white">
                      {new Date(p.startTime).toISOString().slice(11, 16)}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-white">
                      {formatPower(p.forecast, unit, false)}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-white">
                      {formatPower(thermalGap, unit, false)}
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

      {/* Operational Trade Journal & Decision Notes (Phase 9 Logged-in Feature) */}
      <TradeJournal
        day={day}
        onOpenAuth={() => {
          const authBtn = document.querySelector<HTMLButtonElement>("header button:last-child");
          authBtn?.click();
        }}
      />

      {/* Groq-Powered Energy AI Copilot Drawer */}
      <EnergyCopilot
        day={day}
        deadlineHour={deadlineHour}
        meanForecastMw={summary.meanForecastMw}
        consumerDemandMw={consumerDemandMw}
        unit={unit}
        onOpenAuth={() => {
          const authBtn = document.querySelector<HTMLButtonElement>("header button:last-child");
          authBtn?.click();
        }}
      />
    </div>
  );
};

