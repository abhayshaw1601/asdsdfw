import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  badge?: string;
  badgeColor?: "blue" | "amber" | "emerald" | "rose" | "slate";
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  badge,
  badgeColor = "slate",
  icon,
}) => {
  const badgeClasses = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    slate: "bg-slate-700/40 text-slate-300 border-slate-600/30",
  }[badgeColor];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700/80 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
        {badge && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badgeClasses}`}
          >
            {badge}
          </span>
        )}
      </div>
      {subValue && (
        <div className="mt-1 text-xs text-slate-400 line-clamp-1">{subValue}</div>
      )}
    </div>
  );
};
