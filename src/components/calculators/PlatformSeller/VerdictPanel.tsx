import type { PlatformSellerResult, VerdictCard, Severity } from '../../../lib/calculators/platformSellerChecker';

const SEVERITY_STYLES: Record<Severity, { bg: string; border: string; text: string }> = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-800 dark:text-emerald-300',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-300',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-300',
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-300',
  },
};

interface VerdictPanelProps {
  result: PlatformSellerResult;
  onReset: () => void;
}

function VerdictCardComponent({ card }: { card: VerdictCard }) {
  const style = SEVERITY_STYLES[card.severity];
  return (
    <div className={`rounded-xl border-2 ${style.border} ${style.bg} p-5`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">{card.icon}</span>
        <div>
          <h4 className={`text-base font-bold ${style.text} mb-1`}>{card.title}</h4>
          <p className={`text-sm ${style.text} leading-relaxed`}>{card.explanation}</p>
        </div>
      </div>
    </div>
  );
}

export function VerdictPanel({ result, onReset }: VerdictPanelProps) {
  const { verdicts, taxLiability, hmrcLetterGuidance, deadlines, platformNotes } = result;

  return (
    <div className="space-y-5">
      {/* 4 Verdict Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <VerdictCardComponent card={verdicts.reporting} />
        <VerdictCardComponent card={verdicts.trading} />
        <VerdictCardComponent card={verdicts.tax} />
        <VerdictCardComponent card={verdicts.action} />
      </div>

      {/* Tax Comparison (if registering) */}
      {taxLiability.needsToRegister && taxLiability.recommendedDeductionMethod !== 'not-applicable' && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">📊 Allowance vs Expenses Comparison</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-lg p-3 border ${
              taxLiability.recommendedDeductionMethod === 'trading-allowance'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
                : 'border-[var(--border)] bg-[var(--bg-primary)]'
            }`}>
              <p className="text-xs text-[var(--text-muted)]">Trading allowance</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">
                £{taxLiability.tradingAllowanceComparison.taxableWithAllowance.toLocaleString()}
              </p>
              <p className="text-xs text-[var(--text-muted)]">taxable profit</p>
              {taxLiability.recommendedDeductionMethod === 'trading-allowance' && (
                <span className="text-xs font-medium text-primary-600 dark:text-primary-400">✓ Better option</span>
              )}
            </div>
            <div className={`rounded-lg p-3 border ${
              taxLiability.recommendedDeductionMethod === 'actual-expenses'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
                : 'border-[var(--border)] bg-[var(--bg-primary)]'
            }`}>
              <p className="text-xs text-[var(--text-muted)]">Actual expenses</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">
                £{taxLiability.tradingAllowanceComparison.taxableWithExpenses.toLocaleString()}
              </p>
              <p className="text-xs text-[var(--text-muted)]">taxable profit</p>
              {taxLiability.recommendedDeductionMethod === 'actual-expenses' && (
                <span className="text-xs font-medium text-primary-600 dark:text-primary-400">✓ Better option</span>
              )}
            </div>
          </div>
          {taxLiability.tradingAllowanceComparison.saving > 0 && (
            <p className="text-sm text-[var(--text-secondary)] mt-3">
              {taxLiability.tradingAllowanceComparison.betterOption} saves you <strong>£{taxLiability.tradingAllowanceComparison.saving}</strong> in tax.
            </p>
          )}
        </div>
      )}

      {/* Deadlines */}
      {deadlines.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">📅 Key Deadlines</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {deadlines.map((d) => (
              <div key={d.name} className="rounded-lg bg-[var(--bg-primary)] p-3 border border-[var(--border)]">
                <p className="text-xs text-[var(--text-muted)]">{d.name}</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{d.date}</p>
                <p className="text-xs text-[var(--text-muted)]">{d.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HMRC Letter Guidance */}
      {hmrcLetterGuidance.applicable && (
        <div className="rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-5">
          <h4 className="text-base font-bold text-amber-800 dark:text-amber-300 mb-3">
            📬 You received an HMRC letter — here's what to do
          </h4>
          <ol className="list-decimal pl-5 space-y-2">
            {hmrcLetterGuidance.steps.map((s, i) => (
              <li key={i} className="text-sm text-amber-800 dark:text-amber-300">{s}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Platform-specific notes */}
      {platformNotes.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">📋 Platform-Specific Notes</h4>
          <div className="space-y-3">
            {platformNotes.map((pn) => (
              <div key={pn.platform} className="rounded-lg bg-[var(--bg-primary)] p-3 border border-[var(--border)]">
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">
                  {pn.platform}
                </p>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{pn.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cross-links */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Related tools</h4>
        <div className="space-y-2">
          <a href="/trading-allowance-checker/" className="block text-sm text-primary-600 dark:text-primary-400 hover:underline">
            ✅ Trading Allowance Checker — dig deeper into the £1,000 allowance
          </a>
          <a href="/side-hustle-tax-calculator/" className="block text-sm text-primary-600 dark:text-primary-400 hover:underline">
            💰 Side-Hustle Tax Calculator — calculate your exact tax bill
          </a>
          <a href="/self-assessment-deadline-checker/" className="block text-sm text-primary-600 dark:text-primary-400 hover:underline">
            📅 Self-Assessment Deadline Checker — check deadlines and penalties
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
