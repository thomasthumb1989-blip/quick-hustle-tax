interface SavingsBarProps {
  soleTraderTax: number;
  ltdTax: number;
  betterOption: 'sole-trader' | 'ltd-company' | 'similar';
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(n);

export function SavingsBar({ soleTraderTax, ltdTax, betterOption }: SavingsBarProps) {
  const maxTax = Math.max(soleTraderTax, ltdTax, 1);
  const stWidth = (soleTraderTax / maxTax) * 100;
  const ltdWidth = (ltdTax / maxTax) * 100;

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
        Total Tax Burden Comparison
      </p>

      {/* Sole Trader bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--text-secondary)]">Sole Trader</span>
          <span className="font-medium text-[var(--text-primary)]">{fmt(soleTraderTax)}</span>
        </div>
        <div className="h-3 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              betterOption === 'sole-trader' ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ width: `${stWidth}%` }}
          />
        </div>
      </div>

      {/* Ltd bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--text-secondary)]">Limited Company</span>
          <span className="font-medium text-[var(--text-primary)]">{fmt(ltdTax)}</span>
        </div>
        <div className="h-3 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              betterOption === 'ltd-company' ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ width: `${ltdWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}
