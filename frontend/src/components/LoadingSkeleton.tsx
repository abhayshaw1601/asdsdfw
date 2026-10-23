import React from "react";

export const LoadingSkeleton: React.FC<{ rows?: number; height?: string }> = ({
  rows = 4,
  height = "h-48",
}) => {
  return (
    <div className="w-full space-y-4 animate-pulse">
      <div className={`w-full ${height} bg-neutral-900/60 rounded-2xl border border-neutral-800/80 backdrop-blur-sm`} />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-28 bg-neutral-900/60 rounded-2xl border border-neutral-800/80 backdrop-blur-sm" />
        ))}
      </div>
    </div>
  );
};
