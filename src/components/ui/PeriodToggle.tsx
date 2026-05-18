import type { Period } from '../../lib/calculators/periodConversion';

interface PeriodToggleProps {
  value: Period;
  onChange: (period: Period) => void;
}

export function PeriodToggle({ value, onChange }: PeriodToggleProps) {
  return (
    <div className="inline-flex rounded-md border border-[var(--border)] overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => onChange('annual')}
        className={`px-2.5 py-1 font-medium transition-colors ${
          value === 'annual'
            ? 'bg-primary-600 text-white dark:bg-primary-500'
            : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        }`}
      >
        Annual
      </button>
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={`px-2.5 py-1 font-medium transition-colors ${
          value === 'monthly'
            ? 'bg-primary-600 text-white dark:bg-primary-500'
            : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        }`}
      >
        Monthly
      </button>
    </div>
  );
}
