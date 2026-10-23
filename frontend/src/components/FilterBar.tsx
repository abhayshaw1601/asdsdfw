import React from "react";
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import type { NavTab } from "./navigation";

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

  return (
    <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 sm:p-4 mb-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Date Selector(s) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isDecisionView ? (
            /* Single Day Picker for Decision View */
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5 mr-1">
                <Calendar className="w-3.5 h-3.5 text-white opacity-80" />
                Day:
              </span>
              <button
                onClick={() => handleDayStep(-1)}
                disabled={selectedDay <= "2026-01-01"}
                className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/15 disabled:opacity-20 text-white transition-colors"
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
                className="bg-black/40 border border-white/15 hover:border-white/30 text-white text-xs rounded-full px-3 py-1.5 focus:outline-none focus:border-white/60 font-medium cursor-pointer"
              />
              <button
                onClick={() => handleDayStep(1)}
                disabled={selectedDay >= "2026-01-31"}
                className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/15 disabled:opacity-20 text-white transition-colors"
                title="Next Day"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Date Range Pickers for Accuracy/Horizon/Buffer */
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5 mr-1">
                <Calendar className="w-3.5 h-3.5 text-white opacity-80" />
                Range:
              </span>
              <input
                type="date"
                min="2026-01-01"
                max="2026-01-31"
                value={startDate}
                onChange={(e) => onDateRangeChange(e.target.value, endDate)}
                className="bg-black/40 border border-white/15 hover:border-white/30 text-white text-xs rounded-full px-3 py-1.5 focus:outline-none focus:border-white/60 font-medium cursor-pointer"
              />
              <span className="text-xs text-neutral-500 font-light">&rarr;</span>
              <input
                type="date"
                min="2026-01-01"
                max="2026-01-31"
                value={endDate}
                onChange={(e) => onDateRangeChange(startDate, e.target.value)}
                className="bg-black/40 border border-white/15 hover:border-white/30 text-white text-xs rounded-full px-3 py-1.5 focus:outline-none focus:border-white/60 font-medium cursor-pointer"
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
                    className="px-2.5 py-1 bg-black/40 hover:bg-black/60 border border-white/15 rounded-full text-[10px] text-neutral-300 hover:text-white font-medium transition-colors"
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
          <label className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-white opacity-80" />
            Freeze:
          </label>
          <select
            value={deadlineHour}
            onChange={(e) => onDeadlineHourChange(Number(e.target.value))}
            className="bg-black/40 border border-white/15 hover:border-white/30 text-white text-xs rounded-full px-3 py-1.5 focus:outline-none focus:border-white/60 font-medium cursor-pointer"
          >
            {Array.from({ length: 24 }).map((_, h) => (
              <option key={h} value={h} className="bg-neutral-950 text-white">
                {String(h).padStart(2, "0")}:00 London
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
