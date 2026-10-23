export const NAV_ITEMS = [
  { id: "overview", label: "Overview", path: "/" },
  { id: "decision", label: "Day-Ahead Decision", path: "/decision" },
  { id: "accuracy", label: "Accuracy & Risk", path: "/accuracy" },
  { id: "methodology", label: "Methodology", path: "/methodology" },
] as const;

export const ACCURACY_SUB_ITEMS = [
  { id: "accuracy", label: "Error Benchmarks", path: "/accuracy" },
  { id: "horizon", label: "Lead-Time Decay", path: "/horizon" },
  { id: "buffer", label: "Safety Buffers", path: "/buffer" },
] as const;

export type NavTab = "overview" | "decision" | "accuracy" | "horizon" | "buffer" | "methodology";

