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
  icon,
}) => {
  return (
    <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl hover:border-white/20 transition-all group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] sm:text-xs text-neutral-400 font-medium tracking-wide uppercase">
          {label}
        </span>
        {icon && <span className="text-white opacity-80 group-hover:opacity-100 transition-opacity">{icon}</span>}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-light tracking-tight text-white">{value}</div>
        {badge && (
          <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-white/15 bg-white/10 text-white font-medium">
            {badge}
          </span>
        )}
      </div>
      {subValue && (
        <div className="mt-1.5 text-[11px] text-neutral-400 font-light truncate">{subValue}</div>
      )}
    </div>
  );
};
