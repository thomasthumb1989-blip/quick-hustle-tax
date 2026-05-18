import type { SideHustleTaxResult } from '../../../lib/calculators/sideHustleTax';
import { BreakdownTable } from './BreakdownTable';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(n);

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

interface ResultsPanelProps {
  result: SideHustleTaxResult;
  grossIncome: number;
}

export function ResultsPanel({ result, grossIncome }: ResultsPanelProps) {
  if (grossIncome === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 text-center text-[var(--text-muted)]">
        <p>Enter your income to see results.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero number */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 text-center">
        <p className="text-sm text-[var(--text-muted)] mb-1">
          Additional tax to pay via Self Assessment
        </p>
        <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">
          {fmt(result.additionalTaxOwedOnSideHustle)}
        </p>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Effective rate: {pct(result.effectiveTaxRateOnSideHustle)} on your side-hustle income
        </p>
      </div>

      {/* Flags / Callouts */}
      {result.flags.belowTradingAllowance && (
        <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4">
          <p className="text-sm text-green-800 dark:text-green-300 font-medium">
            ✅ Your side-hustle income is within the £1,000 trading allowance — you
            don't need to tell HMRC or file a Self Assessment return.
          </p>
        </div>
      )}

      {result.flags.requiresSelfAssessment && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
            ⚠️ You'll need to register for Self Assessment and file a tax return.
          </p>
        </div>
      )}

      {result.flags.personalAllowanceTapered && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm text-red-800 dark:text-red-300 font-medium">
            📉 Your personal allowance has been reduced because your total income exceeds
            £100,000. You're using {fmt(result.personalAllowanceUsed)} of the standard
            £12,570 allowance.
          </p>
        </div>
      )}

      {result.flags.crossesHigherRateThreshold && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
            📊 Your side-hustle income pushes you into the higher rate (40%) tax band.
            Some of your side income is taxed at 40% instead of 20%.
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Take-home from side hustle</p>
          <p className="text-lg font-semibold text-[var(--text-primary)]">
            {fmt(result.takeHomeFromSideHustle)}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Deduction claimed</p>
          <p className="text-lg font-semibold text-[var(--text-primary)]">
            {fmt(result.claimedDeduction)}{' '}
            <span className="text-xs font-normal text-[var(--text-muted)]">
              ({result.claimedDeductionType === 'tradingAllowance'
                ? 'Trading Allowance'
                : 'Actual Expenses'})
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Side-hustle profit</p>
          <p className="text-lg font-semibold text-[var(--text-primary)]">
            {fmt(result.sideHustleProfit)}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Personal allowance used</p>
          <p className="text-lg font-semibold text-[var(--text-primary)]">
            {fmt(result.personalAllowanceUsed)}
          </p>
        </div>
      </div>

      {/* Detailed breakdown */}
      {!result.flags.belowTradingAllowance && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">
            Show full tax breakdown
          </summary>
          <div className="mt-4">
            <BreakdownTable
              incomeTaxBreakdown={result.incomeTaxBreakdown}
              class4NIBreakdown={result.class4NIBreakdown}
              totalIncomeTax={result.totalIncomeTax}
              totalClass4NI={result.totalClass4NI}
              taxOnEmploymentOnly={result.taxOnEmploymentOnly}
            />
          </div>
        </details>
      )}
    </div>
  );
}
