import { AVAILABLE_TAX_YEARS, DEFAULT_TAX_YEAR } from '../../lib/tax-data/index';

interface TaxYearSelectorProps {
  value: string;
  onChange: (year: string) => void;
}

export function TaxYearSelector({ value, onChange }: TaxYearSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor="tax-year-select"
        className="text-sm font-medium text-[var(--text-secondary)]"
      >
        Tax year
      </label>
      <select
        id="tax-year-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500/40"
      >
        {AVAILABLE_TAX_YEARS.map((year) => (
          <option key={year} value={year}>
            {year}{year === DEFAULT_TAX_YEAR ? ' (current)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
