import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "./components/Header";
import { FilterBar } from "./components/FilterBar";
import { LandingPage } from "./pages/LandingPage";
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
    <div className="min-h-screen bg-[#070b09] text-white flex flex-col font-sans selection:bg-neutral-700 selection:text-white relative overflow-x-hidden">
      {/* Rich Atmospheric Glows & Organic Lighting (enables true glassmorphic refraction) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top ambient forest light */}
        <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[1200px] h-[750px] bg-[radial-gradient(ellipse_at_center,rgba(40,95,65,0.40),rgba(15,45,30,0.18)_50%,transparent_75%)] blur-2xl" />
        {/* Upper-left teal/moss orb */}
        <div className="absolute top-[18%] left-[8%] w-[550px] h-[550px] rounded-full bg-[radial-gradient(circle,rgba(25,85,65,0.30),rgba(12,40,30,0.10)_55%,transparent_75%)] blur-3xl" />
        {/* Upper-right emerald aura */}
        <div className="absolute top-[28%] right-[5%] w-[650px] h-[650px] rounded-full bg-[radial-gradient(circle,rgba(35,90,70,0.28),rgba(15,45,35,0.08)_50%,transparent_75%)] blur-3xl" />
        {/* Mid-lower ambient glow */}
        <div className="absolute top-[60%] left-[20%] w-[800px] h-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(20,70,50,0.22),transparent_70%)] blur-3xl" />
        {/* Subtle geometric grid texture */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,#000_65%,transparent_100%)] opacity-50" />
      </div>

      {/* Unified Global Header (Persistent across all pages) */}
      <Header unit={unit} onUnitToggle={handleUnitToggle} />

      {/* Multi-Page Routes */}
      <main className="flex-1 w-full relative z-10">
        <Routes>
          {/* Landing / Overview Page */}
          <Route path="/" element={<LandingPage unit={unit} />} />

          {/* Decision Engine Page */}
          <Route
            path="/decision"
            element={
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
                <FilterBar
                  activeTab="decision"
                  selectedDay={selectedDay}
                  onDayChange={setSelectedDay}
                  startDate={startDate}
                  endDate={endDate}
                  onDateRangeChange={handleDateRangeChange}
                  deadlineHour={deadlineHour}
                  onDeadlineHourChange={setDeadlineHour}
                />
                <DecisionPage day={selectedDay} deadlineHour={deadlineHour} unit={unit} />
              </div>
            }
          />

          {/* Accuracy & Diagnostics Page */}
          <Route
            path="/accuracy"
            element={
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
                <FilterBar
                  activeTab="accuracy"
                  selectedDay={selectedDay}
                  onDayChange={setSelectedDay}
                  startDate={startDate}
                  endDate={endDate}
                  onDateRangeChange={handleDateRangeChange}
                  deadlineHour={deadlineHour}
                  onDeadlineHourChange={setDeadlineHour}
                />
                <AccuracyPage
                  startDate={startDate}
                  endDate={endDate}
                  deadlineHour={deadlineHour}
                  unit={unit}
                />
              </div>
            }
          />

          {/* Horizon Degradation Page */}
          <Route
            path="/horizon"
            element={
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
                <FilterBar
                  activeTab="horizon"
                  selectedDay={selectedDay}
                  onDayChange={setSelectedDay}
                  startDate={startDate}
                  endDate={endDate}
                  onDateRangeChange={handleDateRangeChange}
                  deadlineHour={deadlineHour}
                  onDeadlineHourChange={setDeadlineHour}
                />
                <HorizonPage deadlineHour={deadlineHour} unit={unit} />
              </div>
            }
          />

          {/* Safety Buffers Page */}
          <Route
            path="/buffer"
            element={
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
                <FilterBar
                  activeTab="buffer"
                  selectedDay={selectedDay}
                  onDayChange={setSelectedDay}
                  startDate={startDate}
                  endDate={endDate}
                  onDateRangeChange={handleDateRangeChange}
                  deadlineHour={deadlineHour}
                  onDeadlineHourChange={setDeadlineHour}
                />
                <BufferPage
                  startDate={startDate}
                  endDate={endDate}
                  deadlineHour={deadlineHour}
                  unit={unit}
                />
              </div>
            }
          />

          {/* Methodology Page */}
          <Route
            path="/methodology"
            element={
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
                <MethodologyPage />
              </div>
            }
          />

          {/* Fallback to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Unified Global Footer */}
      <footer className="border-t border-neutral-800 bg-[#070b09]/90 py-8 text-xs text-neutral-400 mt-12 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            Wind Forecast Decision Portal | Built for UK Day-Ahead Electricity Buying
          </div>
          <div className="flex items-center gap-6 text-neutral-400">
            <span>Elexon BMRS Verified</span>
            <span>Europe/London DST Handled</span>
            <span>Jan 2026 Dataset</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
