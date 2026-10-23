export const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "decision", label: "Decision" },
  { id: "accuracy", label: "Accuracy" },
  { id: "horizon", label: "Horizon" },
  { id: "buffer", label: "Buffer Guidance" },
  { id: "methodology", label: "Methodology" },
] as const;

export type NavTab = (typeof NAV_ITEMS)[number]["id"];
