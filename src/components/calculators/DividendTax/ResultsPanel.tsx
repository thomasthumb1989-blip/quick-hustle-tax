import type { DividendTaxResult } from '../../../lib/calculators/dividendTax';
import { BreakdownTable } from './BreakdownTable';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(n);

const fmt2 = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

interface ResultsPanelProps {
  result: DividendTaxResult;
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  if (result.dividendIncome === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 text-center text-[var(--text-muted)]">
        <p>Enter your dividend income to see results.</p>
      </div>
    );
  }

  const taxFree = result.dividendsCoveredByPA + result.dividendAllowanceUsed;
  const isInPATrap = result.personalAllowanceTapered;

  return (
    <div className="space-y-6">
      {/* Hero: total dividend tax */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 text-center">
        <p className="text-sm text-[var(--text-muted)] mb-1">Dividend tax owed</p>
        <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">
          {fmt2(result.totalDividendTax)}
        </p>
        <p className="text-lg text-[var(--text-secondary)] mt-1">
          Effective rate: {pct(result.effectiveDividendTaxRate)}
        </p>
      </div>

      {/* PA taper warning */}
      {isInPATrap && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
            ⚠️ <strong>Personal Allowance tapered:</strong> Your combined income of {fmt(result.totalIncome)} exceeds £100,000. Your PA is reduced to {fmt(result.personalAllowance)}, increasing your tax bill.
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Tax-free dividends</p>
          <p className="text-lg font-semibold text-[var(--text-primary)]">{fmt(taxFree)}</p>
          <p className="text-xs text-[var(--text-muted)]">PA + allowance</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Marginal rate</p>
          <p className="text-lg font-semibold text-[var(--text-primary)]">{pct(result.marginalDividendRate)}</p>
          <p className="text-xs text-[var(--text-muted)]">On next £1 of dividends</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Total income</p>
          <p className="text-lg font-semibold text-[var(--text-primary)]">{fmt(result.totalIncome)}</p>
          <p className="text-xs text-[var(--text-muted)]">Salary + dividends</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Personal Allowance</p>
          <p className="text-lg font-semibold text-[var(--text-primary)]">{fmt(result.personalAllowance)}</p>
          <p className="text-xs text-[var(--text-muted)]">{isInPATrap ? 'Tapered' : 'Full'}</p>
        </div>
      </div>

      {/* Band breakdown table */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Dividend tax breakdown
        </h3>
        <BreakdownTable
          breakdown={result.dividendBandBreakdown}
          totalTax={result.totalDividendTax}
        />
      </div>

      {/* Income tax on salary (context) */}
      {result.otherIncome > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
          <p className="text-xs text-[var(--text-muted)] mb-1">Income tax on salary (for context)</p>
          <p className="text-sm text-[var(--text-primary)]">
            {fmt(result.incomeTaxOnOtherIncome)} on {fmt(result.taxableOtherIncome)} taxable salary
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            This is separate from your dividend tax above. You pay both.
          </p>
        </div>
      )}

      {/* Reporting requirement */}
      <div className={`rounded-lg p-4 ${
        result.reportingRequirement === 'self-assessment'
          ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
          : result.reportingRequirement === 'paye-or-sa'
            ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
            : 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800'
      }`}>
        <p className={`text-sm font-medium ${
          result.reportingRequirement === 'self-assessment'
            ? 'text-amber-800 dark:text-amber-300'
            : result.reportingRequirement === 'paye-or-sa'
              ? 'text-blue-800 dark:text-blue-300'
              : 'text-emerald-800 dark:text-emerald-300'
        }`}>
          {result.reportingRequirement === 'none' && (
            <>✅ No action needed — your dividends are within the £{result.dividendAllowance} allowance.</>
          )}
          {result.reportingRequirement === 'paye-or-sa' && (
            <>📋 You can either ask HMRC to adjust your PAYE tax code or file a Self Assessment return.</>
          )}
          {result.reportingRequirement === 'self-assessment' && (
            <>⚠️ Dividends over £10,000 — you must file a Self Assessment tax return by 31 January.</>
          )}
        </p>
      </div>
    </div>
  );
}
