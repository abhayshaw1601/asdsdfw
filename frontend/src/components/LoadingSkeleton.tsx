import React from "react";

export const LoadingSkeleton: React.FC<{ rows?: number; height?: string }> = ({
  rows = 4,
  height = "h-48",
}) => {
  return (
    <div className="w-full space-y-4 animate-pulse">
      <div className={`w-full ${height} bg-slate-800/60 rounded-xl border border-slate-700/30`} />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-800/40 rounded-xl border border-slate-700/20" />
        ))}
      </div>
    </div>
  );
};
