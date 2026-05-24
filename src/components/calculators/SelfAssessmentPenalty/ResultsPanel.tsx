import type { SelfAssessmentPenaltyResult } from '../../../lib/calculators/selfAssessmentPenalty';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const urgencyColors = {
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200',
    icon: '✅',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200',
    icon: '⚠️',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    badge: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    icon: '🚨',
  },
};

const statusLabels: Record<string, string> = {
  'on-track': 'On Track',
  'approaching-deadline': 'Deadline Approaching',
  'late-filing': 'Late Filing',
  'late-payment': 'Late Payment',
  'late-both': 'Late Filing & Payment',
};

interface ResultsPanelProps {
  result: SelfAssessmentPenaltyResult;
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  const colors = urgencyColors[result.urgencyLevel];

  return (
    <div className="space-y-5">
      {/* Status banner */}
      <div className={`rounded-xl border ${colors.border} ${colors.bg} p-5 text-center`}>
        <span className="text-2xl">{colors.icon}</span>
        <p className={`text-lg font-bold ${colors.text} mt-1`}>
          {statusLabels[result.status] || result.status}
        </p>
        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
          {result.taxYear}
        </span>
      </div>

      {/* Grand total */}
      {result.grandTotal > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5 text-center">
          <p className="text-sm text-[var(--text-muted)] mb-1">Total penalties + interest</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{fmt(result.grandTotal)}</p>
          <div className="flex justify-center gap-6 mt-3 text-sm text-[var(--text-secondary)]">
            <span>Penalties: {fmt(result.totalPenalties)}</span>
            <span>Interest: {fmt(result.totalInterest)}</span>
          </div>
        </div>
      )}

      {/* Key deadlines */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Key Deadlines</h3>
        <div className="space-y-2 text-sm">
          <Row label="Online filing deadline" value={fmtDate(result.deadlines.onlineDeadline)} />
          <Row label="Payment deadline" value={fmtDate(result.deadlines.paymentDeadline)} />
          <Row label="Paper filing deadline" value={fmtDate(result.deadlines.paperDeadline)} />
          <Row label="Register by" value={fmtDate(result.deadlines.registrationDeadline)} />
        </div>
      </div>

      {/* Filing penalties */}
      {(result.filing.isLate || result.filing.penalties.total > 0) && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Filing Penalties</h3>
          <div className="space-y-2 text-sm">
            <Row label="Days late" value={`${result.filing.daysLate} days`} />
            <Row label="Initial penalty" value={fmt(result.filing.penalties.initial)} />
            {result.filing.penalties.daily > 0 && (
              <Row label="Daily penalties (£10/day)" value={fmt(result.filing.penalties.daily)} />
            )}
            {result.filing.penalties.sixMonth > 0 && (
              <Row label="6-month penalty" value={fmt(result.filing.penalties.sixMonth)} />
            )}
            {result.filing.penalties.twelveMonth > 0 && (
              <Row label="12-month penalty" value={fmt(result.filing.penalties.twelveMonth)} />
            )}
            <div className="pt-2 border-t border-[var(--border)]">
              <Row label="Total filing penalties" value={fmt(result.filing.penalties.total)} bold />
            </div>
          </div>
        </div>
      )}

      {/* Payment penalties */}
      {(result.payment.isLate || result.payment.penalties.total > 0) && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Payment Penalties</h3>
          <div className="space-y-2 text-sm">
            <Row label="Days late" value={`${result.payment.daysLate} days`} />
            <Row label="Unpaid tax" value={fmt(result.payment.unpaidTax)} />
            {result.payment.penalties.thirtyDay > 0 && (
              <Row label="30-day surcharge (5%)" value={fmt(result.payment.penalties.thirtyDay)} />
            )}
            {result.payment.penalties.sixMonth > 0 && (
              <Row label="6-month surcharge (5%)" value={fmt(result.payment.penalties.sixMonth)} />
            )}
            {result.payment.penalties.twelveMonth > 0 && (
              <Row label="12-month surcharge (5%)" value={fmt(result.payment.penalties.twelveMonth)} />
            )}
            <div className="pt-2 border-t border-[var(--border)]">
              <Row label="Total payment penalties" value={fmt(result.payment.penalties.total)} bold />
            </div>
          </div>
        </div>
      )}

      {/* Interest */}
      {result.totalInterest > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Late Payment Interest</h3>
          <div className="space-y-2 text-sm">
            <Row label="Interest rate" value={`${result.payment.interest.interestRate}% per year`} />
            <Row label="Total interest accrued" value={fmt(result.totalInterest)} bold />
          </div>
        </div>
      )}

      {/* Next penalty date */}
      {(result.filing.nextPenaltyDate || result.payment.nextPenaltyDate) && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-5">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-3">Next Penalty Milestones</h3>
          <div className="space-y-3 text-sm">
            {result.filing.nextPenaltyDate && (
              <div>
                <p className="font-medium text-[var(--text-primary)]">{fmtDate(result.filing.nextPenaltyDate)}</p>
                <p className="text-[var(--text-muted)]">{result.filing.nextPenaltyDescription}</p>
              </div>
            )}
            {result.payment.nextPenaltyDate && (
              <div>
                <p className="font-medium text-[var(--text-primary)]">{fmtDate(result.payment.nextPenaltyDate)}</p>
                <p className="text-[var(--text-muted)]">{result.payment.nextPenaltyDescription}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action items */}
      {result.actionItems.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">What To Do Next</h3>
          <ul className="space-y-2">
            {result.actionItems.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-[var(--text-secondary)]">
                <span className="text-primary-500 mt-0.5 shrink-0">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className={`text-[var(--text-primary)] ${bold ? 'font-semibold' : ''}`}>{value}</span>
    </div>
  );
}
