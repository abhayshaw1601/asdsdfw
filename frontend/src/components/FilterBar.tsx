import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { ACCURACY_SUB_ITEMS, type NavTab } from "./navigation";

interface FilterBarProps {
  activeTab: NavTab;
  selectedDay: string;
  onDayChange: (day: string) => void;
  startDate: string;
  endDate: string;
  onDateRangeChange: (start: string, end: string) => void;
  deadlineHour: number;
  onDeadlineHourChange: (hour: number) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeTab,
  selectedDay,
  onDayChange,
  startDate,
  endDate,
  onDateRangeChange,
  deadlineHour,
  onDeadlineHourChange,
}) => {
  const handleDayStep = (delta: number) => {
    const d = new Date(selectedDay);
    d.setDate(d.getDate() + delta);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const newDay = `${yyyy}-${mm}-${dd}`;
    if (newDay >= "2026-01-01" && newDay <= "2026-01-31") {
      onDayChange(newDay);
    }
  };

  const isDecisionView = activeTab === "decision";
  const isAccuracyDomain = ["accuracy", "horizon", "buffer"].includes(activeTab);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/[0.05] hover:bg-white/[0.07] backdrop-blur-2xl border border-white/20 p-3.5 sm:p-4 mb-6 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.25),0_12px_36px_rgba(0,0,0,0.45)] transition-all">
      {/* Top specular highlight line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

      {/* Sub-Navigation for Accuracy & Risk Domain */}
      {isAccuracyDomain && (
        <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-white/10 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mr-1">
              Analytics View:
            </span>
            {ACCURACY_SUB_ITEMS.map((sub) => {
              const isActive = activeTab === sub.id;
              return (
                <Link
                  key={sub.id}
                  to={sub.path}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? "bg-white text-neutral-950 font-semibold shadow-sm"
                      : "text-neutral-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/10"
                  }`}
                >
                  {sub.label}
                </Link>
              );
            })}
          </div>
          <span className="text-[11px] text-neutral-400 hidden md:inline">
            Elexon January 2026 Quantitative Error Benchmarks
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Date Selector(s) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isDecisionView ? (
            /* Single Day Picker for Decision View */
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-neutral-300 flex items-center gap-1.5 mr-1">
                <Calendar className="w-3.5 h-3.5 text-white opacity-80" />
                Day:
              </span>
              <button
                onClick={() => handleDayStep(-1)}
                disabled={selectedDay <= "2026-01-01"}
                className="p-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 disabled:opacity-20 text-white transition-colors cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <input
                type="date"
                min="2026-01-01"
                max="2026-01-31"
                value={selectedDay}
                onChange={(e) => onDayChange(e.target.value)}
                className="bg-white/[0.08] border border-white/20 hover:border-white/40 text-white text-xs rounded-full px-3 py-1.5 focus:outline-none focus:border-white font-medium cursor-pointer backdrop-blur-md"
              />
              <button
                onClick={() => handleDayStep(1)}
                disabled={selectedDay >= "2026-01-31"}
                className="p-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 disabled:opacity-20 text-white transition-colors cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Date Range Pickers for Accuracy/Horizon/Buffer */
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-neutral-300 flex items-center gap-1.5 mr-1">
                <Calendar className="w-3.5 h-3.5 text-white opacity-80" />
                Range:
              </span>
              <input
                type="date"
                min="2026-01-01"
                max="2026-01-31"
                value={startDate}
                onChange={(e) => onDateRangeChange(e.target.value, endDate)}
                className="bg-white/[0.08] border border-white/20 hover:border-white/40 text-white text-xs rounded-full px-3 py-1.5 focus:outline-none focus:border-white font-medium cursor-pointer backdrop-blur-md"
              />
              <span className="text-xs text-neutral-400 font-light">&rarr;</span>
              <input
                type="date"
                min="2026-01-01"
                max="2026-01-31"
                value={endDate}
                onChange={(e) => onDateRangeChange(startDate, e.target.value)}
                className="bg-white/[0.08] border border-white/20 hover:border-white/40 text-white text-xs rounded-full px-3 py-1.5 focus:outline-none focus:border-white font-medium cursor-pointer backdrop-blur-md"
              />

              {/* Quick Preset Buttons */}
              <div className="hidden md:flex items-center gap-1 ml-1.5">
                {[
                  { label: "Jan '26", s: "2026-01-01", e: "2026-01-31" },
                  { label: "W1", s: "2026-01-01", e: "2026-01-07" },
                  { label: "W2", s: "2026-01-08", e: "2026-01-14" },
                  { label: "W3", s: "2026-01-15", e: "2026-01-21" },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => onDateRangeChange(preset.s, preset.e)}
                    className="px-2.5 py-1 bg-white/[0.08] hover:bg-white/[0.16] border border-white/20 rounded-full text-[10px] text-neutral-200 hover:text-white font-medium transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Decision Deadline Selector (Global) */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-white opacity-80" />
            Freeze (UK):
          </label>
          <select
            value={deadlineHour}
            onChange={(e) => onDeadlineHourChange(Number(e.target.value))}
            className="bg-white/[0.08] border border-white/20 hover:border-white/40 text-white text-xs rounded-full px-3 py-1.5 focus:outline-none focus:border-white font-medium cursor-pointer backdrop-blur-md"
          >
            {Array.from({ length: 24 }).map((_, h) => (
              <option key={h} value={h} className="bg-neutral-950 text-white">
                {String(h).padStart(2, "0")}:00{h === 9 ? " (Auction Default)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
