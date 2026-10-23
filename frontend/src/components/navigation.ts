export const NAV_ITEMS = [
  { id: "overview", label: "Overview", path: "/" },
  { id: "decision", label: "Decision Engine", path: "/decision" },
  { id: "accuracy", label: "Accuracy & Errors", path: "/accuracy" },
  { id: "horizon", label: "Horizon Decay", path: "/horizon" },
  { id: "buffer", label: "Safety Buffers", path: "/buffer" },
  { id: "methodology", label: "Methodology", path: "/methodology" },
] as const;

export type NavTab = (typeof NAV_ITEMS)[number]["id"];
