interface ProgressBarProps {
  percent: number;
  label: string;
}

export function ProgressBar({ percent, label }: ProgressBarProps) {
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const isOnTrack = clampedPercent >= 100;

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
        <span className={`text-sm font-bold ${isOnTrack ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
          {Math.round(clampedPercent)}%
        </span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${
            isOnTrack ? 'bg-emerald-500' : clampedPercent >= 75 ? 'bg-amber-500' : 'bg-primary-500'
          }`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  );
}
