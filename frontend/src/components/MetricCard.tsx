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
    blue: "bg-white/10 text-white border-white/20",
    amber: "bg-neutral-800/80 text-white border-neutral-700",
    emerald: "bg-neutral-800/80 text-white border-neutral-700",
    rose: "bg-neutral-800/80 text-white border-neutral-700",
    slate: "bg-neutral-800/80 text-white border-neutral-700",
  }[badgeColor];

  return (
    <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 backdrop-blur-sm hover:border-neutral-700 transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-neutral-400 font-medium">{label}</span>
        {icon && <span className="text-white opacity-80">{icon}</span>}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-3xl font-light tracking-tight text-white">{value}</div>
        {badge && (
          <span
            className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${badgeClasses}`}
          >
            {badge}
          </span>
        )}
      </div>
      {subValue && (
        <div className="mt-1 text-xs text-neutral-400 line-clamp-1 font-light">{subValue}</div>
      )}
    </div>
  );
};
