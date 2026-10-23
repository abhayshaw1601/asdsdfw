import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onRetry }) => {
  return (
    <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 text-white flex items-start justify-between gap-4 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-white mt-0.5 shrink-0" />
        <div>
          <h4 className="font-semibold text-white text-sm">Unable to load forecast data</h4>
          <p className="text-xs text-neutral-400 mt-1 font-light">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-neutral-200 text-xs font-semibold text-neutral-950 rounded-full transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
};
