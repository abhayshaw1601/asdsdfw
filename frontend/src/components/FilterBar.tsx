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
  // Step single day
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
    <div className="bg-[#070b09]/95 border-b border-neutral-800/80 py-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Date Selector(s) */}
        <div className="flex flex-wrap items-center gap-3">
          {isDecisionView ? (
            /* Single Day Picker for Decision View */
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-white" />
                Delivery Day:
              </span>
              <button
                onClick={() => handleDayStep(-1)}
                disabled={selectedDay <= "2026-01-01"}
                className="p-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 disabled:opacity-30 disabled:hover:bg-neutral-900 text-white transition-colors"
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
                className="bg-neutral-900 border border-neutral-700/80 text-white text-xs rounded-full px-3 py-1.5 focus:outline-none focus:border-white font-medium"
              />
              <button
                onClick={() => handleDayStep(1)}
                disabled={selectedDay >= "2026-01-31"}
                className="p-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 disabled:opacity-30 disabled:hover:bg-neutral-900 text-white transition-colors"
                title="Next Day"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Date Range Pickers for Accuracy/Horizon/Buffer */
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-white" />
                Delivery Range:
              </span>
              <input
                type="date"
                min="2026-01-01"
                max="2026-01-31"
                value={startDate}
                onChange={(e) => onDateRangeChange(e.target.value, endDate)}
                className="bg-neutral-900 border border-neutral-700/80 text-white text-xs rounded-full px-3 py-1.5 focus:outline-none focus:border-white font-medium"
              />
              <span className="text-xs text-neutral-500 font-light">to</span>
              <input
                type="date"
                min="2026-01-01"
                max="2026-01-31"
                value={endDate}
                onChange={(e) => onDateRangeChange(startDate, e.target.value)}
                className="bg-neutral-900 border border-neutral-700/80 text-white text-xs rounded-full px-3 py-1.5 focus:outline-none focus:border-white font-medium"
              />

              {/* Quick Preset Buttons */}
              <div className="hidden md:flex items-center gap-1.5 ml-2">
                <button
                  onClick={() => onDateRangeChange("2026-01-01", "2026-01-31")}
                  className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 rounded-full text-[11px] text-white font-medium transition-colors"
                >
                  Full Jan
                </button>
                <button
                  onClick={() => onDateRangeChange("2026-01-01", "2026-01-07")}
                  className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 rounded-full text-[11px] text-white font-medium transition-colors"
                >
                  Week 1
                </button>
                <button
                  onClick={() => onDateRangeChange("2026-01-08", "2026-01-14")}
                  className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 rounded-full text-[11px] text-white font-medium transition-colors"
                >
                  Week 2
                </button>
                <button
                  onClick={() => onDateRangeChange("2026-01-15", "2026-01-21")}
                  className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 rounded-full text-[11px] text-white font-medium transition-colors"
                >
                  Week 3
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Decision Deadline Selector (Global) */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-white" />
            Decision Deadline (D-1):
          </label>
          <select
            value={deadlineHour}
            onChange={(e) => onDeadlineHourChange(Number(e.target.value))}
            className="bg-neutral-900 border border-neutral-700/80 text-white text-xs rounded-full px-3 py-1.5 focus:outline-none focus:border-white font-medium cursor-pointer"
          >
            {Array.from({ length: 24 }).map((_, h) => (
              <option key={h} value={h} className="bg-neutral-900 text-white">
                {String(h).padStart(2, "0")}:00 London
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
