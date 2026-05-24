import type { TradingAllowanceResult } from '../../../lib/calculators/tradingAllowanceChecker';
import { ComparisonCard } from './ComparisonCard';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(n);

interface VerdictPanelProps {
  result: TradingAllowanceResult;
  onReset: () => void;
}

const VERDICT_STYLES: Record<string, { icon: string; bg: string; border: string; text: string }> = {
  'fully-covered': {
    icon: '✅',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-800 dark:text-emerald-300',
  },
  'register-claim-allowance': {
    icon: '⚠️',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-300',
  },
  'register-claim-expenses': {
    icon: '⚠️',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-300',
  },
  'not-eligible': {
    icon: '❌',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-300',
  },
  'not-trading': {
    icon: 'ℹ️',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-300',
  },
};

export function VerdictPanel({ result, onReset }: VerdictPanelProps) {
  const style = VERDICT_STYLES[result.verdict] || VERDICT_STYLES['not-trading'];

  return (
    <div className="space-y-5">
      {/* Main verdict */}
      <div className={`rounded-xl border-2 ${style.border} ${style.bg} p-6 text-center`}>
        <p className="text-3xl mb-2">{style.icon}</p>
        <h3 className={`text-xl font-bold ${style.text} mb-2`}>
          {result.verdictTitle}
        </h3>
        <p className={`text-sm ${style.text} max-w-lg mx-auto leading-relaxed`}>
          {result.verdictExplanation}
        </p>
      </div>

      {/* Comparison card (only for eligible, over £1,000) */}
      <ComparisonCard result={result} />

      {/* Deadlines */}
      {result.mustRegister && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">📅 Key Deadlines</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg bg-[var(--bg-primary)] p-3 border border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)]">Register by</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{result.registrationDeadline}</p>
            </div>
            <div className="rounded-lg bg-[var(--bg-primary)] p-3 border border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)]">File return by</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{result.filingDeadline}</p>
            </div>
            <div className="rounded-lg bg-[var(--bg-primary)] p-3 border border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)]">Pay tax by</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{result.paymentDeadline}</p>
            </div>
          </div>
        </div>
      )}

      {/* Platform reporting */}
      {result.platformReportingNote && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
            📊 {result.platformReportingNote}
          </p>
        </div>
      )}

      {/* MTD */}
      {result.mtdNote && (
        <div className={`rounded-lg p-4 ${
          result.mtdApplies
            ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
            : 'bg-[var(--bg-tertiary)] border border-[var(--border)]'
        }`}>
          <p className={`text-sm font-medium ${
            result.mtdApplies
              ? 'text-amber-800 dark:text-amber-300'
              : 'text-[var(--text-secondary)]'
          }`}>
            {result.mtdApplies ? '📱' : 'ℹ️'} {result.mtdNote}
          </p>
        </div>
      )}

      {/* Future changes */}
      <div className="rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] p-4">
        <p className="text-sm text-[var(--text-secondary)]">
          🔮 {result.futureChangeNote}
        </p>
      </div>

      {/* Ineligibility reason */}
      {result.ineligibilityReason && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm text-red-800 dark:text-red-300 font-medium">
            Reason: {result.ineligibilityReason}
          </p>
        </div>
      )}

      {/* Cross-links */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Related tools</h4>
        <div className="space-y-2">
          <a href="/side-hustle-tax-calculator/" className="block text-sm text-primary-600 dark:text-primary-400 hover:underline">
            💰 Side-Hustle Tax Calculator — see exactly how much tax you'd owe
          </a>
          <a href="/take-home-pay-calculator/" className="block text-sm text-primary-600 dark:text-primary-400 hover:underline">
            💷 Take-Home Pay Calculator — check your PAYE take-home
          </a>
          <a href="/sole-trader-vs-ltd-calculator/" className="block text-sm text-primary-600 dark:text-primary-400 hover:underline">
            ⚖️ Sole Trader vs Ltd — compare business structures
          </a>
        </div>
      </div>

      {/* Reset */}
      <div className="text-center">
        <button
          onClick={onReset}
          className="px-6 py-2.5 rounded-lg text-sm font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-600 border border-[var(--border)] transition-colors"
        >
          ↩ Check again
        </button>
      </div>
    </div>
  );
}
