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
    <div className="relative group overflow-hidden rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] backdrop-blur-2xl border border-white/20 hover:border-white/35 p-5 sm:p-6 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.25),0_12px_36px_rgba(0,0,0,0.45)] transition-all duration-300">
      {/* Subtle glass reflection gradient at top edge */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] sm:text-xs text-neutral-300 font-medium tracking-wide uppercase">
          {label}
        </span>
        {icon && <span className="text-white opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-sm">{icon}</span>}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-light tracking-tight text-white drop-shadow-sm">{value}</div>
        {badge && (
          <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-white/20 bg-white/10 text-white font-medium backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
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
