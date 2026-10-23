import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "./components/Header";
import { FilterBar } from "./components/FilterBar";
import { type NavTab } from "./components/navigation";
import { DecisionPage } from "./pages/DecisionPage";
import { AccuracyPage } from "./pages/AccuracyPage";
import { HorizonPage } from "./pages/HorizonPage";
import { BufferPage } from "./pages/BufferPage";
import { MethodologyPage } from "./pages/MethodologyPage";
import type { UnitType } from "./api/types";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("decision");
  const [selectedDay, setSelectedDay] = useState<string>("2026-01-15");
  const [startDate, setStartDate] = useState<string>("2026-01-01");
  const [endDate, setEndDate] = useState<string>("2026-01-31");
  const [deadlineHour, setDeadlineHour] = useState<number>(9);
  const [unit, setUnit] = useState<UnitType>("MW");

  const handleUnitToggle = () => {
    setUnit((prev) => (prev === "MW" ? "GW" : "MW"));
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unit={unit}
        onUnitToggle={handleUnitToggle}
      />

      {/* Sticky Filter Bar */}
      <FilterBar
        activeTab={activeTab}
        selectedDay={selectedDay}
        onDayChange={setSelectedDay}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={handleDateRangeChange}
        deadlineHour={deadlineHour}
        onDeadlineHourChange={setDeadlineHour}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "decision" && (
          <DecisionPage day={selectedDay} deadlineHour={deadlineHour} unit={unit} />
        )}
        {activeTab === "accuracy" && (
          <AccuracyPage
            startDate={startDate}
            endDate={endDate}
            deadlineHour={deadlineHour}
            unit={unit}
          />
        )}
        {activeTab === "horizon" && (
          <HorizonPage deadlineHour={deadlineHour} unit={unit} />
        )}
        {activeTab === "buffer" && (
          <BufferPage
            startDate={startDate}
            endDate={endDate}
            deadlineHour={deadlineHour}
            unit={unit}
          />
        )}
        {activeTab === "methodology" && <MethodologyPage />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Wind Forecast Decision Portal | Built for UK Day-Ahead Electricity Buying
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Elexon BMRS Datasets (FUELHH & WINDFOR)</span>
            <span>|</span>
            <button
              onClick={() => setActiveTab("methodology")}
              className="hover:text-blue-400 transition-colors"
            >
              Methodology & Docs
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
