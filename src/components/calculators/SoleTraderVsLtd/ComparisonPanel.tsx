import type { SoleTraderVsLtdResult } from '../../../lib/calculators/soleTraderVsLtd';
import { SavingsBar } from './SavingsBar';
import { SoleTraderBreakdown, LtdCompanyBreakdown } from './BreakdownCard';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(n);

const fmtMonthly = (annual: number) => fmt(Math.round(annual / 12));
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

interface ComparisonPanelProps {
  result: SoleTraderVsLtdResult;
}

export function ComparisonPanel({ result }: ComparisonPanelProps) {
  const { soleTrader, ltdCompany, comparison } = result;

  return (
    <div className="space-y-6">
      {/* Savings summary */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 text-center">
        {comparison.betterOption === 'ltd-company' && (
          <>
            <p className="text-2xl mb-1">💰</p>
            <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
              Limited company saves you {fmt(comparison.annualSaving)}/year
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {fmtMonthly(comparison.annualSaving)}/month
            </p>
          </>
        )}
        {comparison.betterOption === 'sole-trader' && (
          <>
            <p className="text-2xl mb-1">✅</p>
            <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">
              Sole trader saves you {fmt(Math.abs(comparison.annualSaving))}/year
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Ltd costs outweigh the tax saving
            </p>
          </>
        )}
        {comparison.betterOption === 'similar' && (
          <>
            <p className="text-2xl mb-1">≈</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">
              Both structures are similar
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Consider non-tax factors like liability protection and admin
            </p>
          </>
        )}
        <p className="text-xs text-[var(--text-muted)] mt-3 max-w-lg mx-auto">
          {comparison.breakdownMessage}
        </p>
      </div>

      {/* Side-by-side take-home */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sole Trader card */}
        <div className={`rounded-xl border-2 p-5 ${
          comparison.betterOption === 'sole-trader'
            ? 'border-emerald-500 dark:border-emerald-400'
            : 'border-[var(--border)]'
        }`} style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Sole Trader
            </h3>
            {comparison.betterOption === 'sole-trader' && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                Better
              </span>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Gross Profit</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">{fmt(soleTrader.grossProfit)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Income Tax</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{fmt(soleTrader.incomeTax)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Class 4 NI</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{fmt(soleTrader.class4NI)}</p>
              </div>
            </div>
            <div className="border-t border-[var(--border)] pt-3">
              <p className="text-xs text-[var(--text-muted)]">Total Tax</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">{fmt(soleTrader.totalTax)}</p>
              <p className="text-xs text-[var(--text-muted)]">Effective rate: {pct(soleTrader.effectiveRate)}</p>
            </div>
            <div className="border-t border-[var(--border)] pt-3">
              <p className="text-xs text-[var(--text-muted)]">Take-Home Pay</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(soleTrader.takeHome)}</p>
              <p className="text-xs text-[var(--text-muted)]">{fmtMonthly(soleTrader.takeHome)}/month</p>
            </div>
          </div>
        </div>

        {/* Ltd Company card */}
        <div className={`rounded-xl border-2 p-5 ${
          comparison.betterOption === 'ltd-company'
            ? 'border-emerald-500 dark:border-emerald-400'
            : 'border-[var(--border)]'
        }`} style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Limited Company
            </h3>
            {comparison.betterOption === 'ltd-company' && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                Better
              </span>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Gross Profit</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">{fmt(ltdCompany.grossProfit)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Corporation Tax</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{fmt(ltdCompany.corporationTax)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Dividend Tax</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{fmt(ltdCompany.dividendTax)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Employer NI</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{fmt(ltdCompany.netEmployerNI)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Accounting</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{fmt(ltdCompany.accountingCosts)}</p>
              </div>
            </div>
            <div className="border-t border-[var(--border)] pt-3">
              <p className="text-xs text-[var(--text-muted)]">Total Tax + Costs</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">{fmt(ltdCompany.totalCosts)}</p>
              <p className="text-xs text-[var(--text-muted)]">Effective tax rate: {pct(ltdCompany.effectiveRate)}</p>
            </div>
            <div className="border-t border-[var(--border)] pt-3">
              <p className="text-xs text-[var(--text-muted)]">Take-Home Pay</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(ltdCompany.takeHome)}</p>
              <p className="text-xs text-[var(--text-muted)]">{fmtMonthly(ltdCompany.takeHome)}/month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tax burden bar */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
        <SavingsBar
          soleTraderTax={soleTrader.totalTax}
          ltdTax={ltdCompany.totalCosts}
          betterOption={comparison.betterOption}
        />
      </div>

      {/* Callouts */}
      {soleTrader.personalAllowance < 12570 && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
            ⚠️ Your income exceeds £100,000 — Personal Allowance has been tapered to {fmt(soleTrader.personalAllowance)}.
            This creates an effective 60% marginal rate between £100k–£125k.
          </p>
        </div>
      )}

      {ltdCompany.marginalRelief > 0 && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
            📊 Corporation Tax includes marginal relief of {fmt(ltdCompany.marginalRelief)}.
            Your company profit falls between £50k–£250k, where the effective CT rate is between 19% and 25%.
          </p>
        </div>
      )}

      {comparison.crossoverPoint > 0 && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4">
          <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">
            💡 Ltd becomes more tax-efficient above ~{fmt(comparison.crossoverPoint)} annual profit.
          </p>
        </div>
      )}

      {/* Full breakdown expandable */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">
          Show full breakdown
        </summary>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Sole Trader Detail</h4>
            <SoleTraderBreakdown data={soleTrader} />
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Limited Company Detail</h4>
            <LtdCompanyBreakdown data={ltdCompany} />
          </div>
        </div>
      </details>

      {/* Disclaimer */}
      <div className="rounded-lg bg-[var(--bg-tertiary)] p-3 text-xs text-[var(--text-muted)]">
        <p>
          Assumes all post-CT profit distributed as dividends. Retaining profit in the company
          or using alternative extraction methods may produce different results. Not financial advice.
        </p>
      </div>
    </div>
  );
}
