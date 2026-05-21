import type { TradingAllowanceResult } from '../../../lib/calculators/tradingAllowanceChecker';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(n);

interface ComparisonCardProps {
  result: TradingAllowanceResult;
}

export function ComparisonCard({ result }: ComparisonCardProps) {
  if (!result.isEligibleForAllowance || result.verdict === 'fully-covered') return null;

  const allowanceWins = result.betterOption === 'allowance';
  const expensesWins = result.betterOption === 'expenses';
  const equal = result.betterOption === 'equal';

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
      <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
        Trading Allowance vs Actual Expenses
      </h4>
      <div className="grid grid-cols-2 gap-4">
        {/* Allowance option */}
        <div className={`rounded-lg border-2 p-4 ${
          allowanceWins ? 'border-emerald-500 dark:border-emerald-400' : 'border-[var(--border)]'
        }`} style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Trading Allowance</p>
            {allowanceWins && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                ✅ Better
              </span>
            )}
            {equal && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                = Equal
              </span>
            )}
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Deduction</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{fmt(result.allowanceDeduction)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Taxable income</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">{fmt(result.taxableWithAllowance)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Est. tax (20%)</p>
              <p className="text-sm text-[var(--text-primary)]">{fmt(Math.round(result.taxableWithAllowance * 0.2))}</p>
            </div>
          </div>
        </div>

        {/* Expenses option */}
        <div className={`rounded-lg border-2 p-4 ${
          expensesWins ? 'border-emerald-500 dark:border-emerald-400' : 'border-[var(--border)]'
        }`} style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Actual Expenses</p>
            {expensesWins && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                ✅ Better
              </span>
            )}
            {equal && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                = Equal
              </span>
            )}
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Deduction</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{fmt(result.expensesDeduction)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Taxable income</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">{fmt(result.taxableWithExpenses)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Est. tax (20%)</p>
              <p className="text-sm text-[var(--text-primary)]">{fmt(Math.round(result.taxableWithExpenses * 0.2))}</p>
            </div>
          </div>
        </div>
      </div>

      {result.taxSavingFromBetterOption > 0 && (
        <p className="text-center text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-4">
          {result.betterOption === 'allowance' ? 'Trading allowance' : 'Actual expenses'} saves you {fmt(result.taxSavingFromBetterOption)} in tax
        </p>
      )}
    </div>
  );
}
