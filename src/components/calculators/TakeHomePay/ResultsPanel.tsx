import type { TakeHomePayResult } from '../../../lib/calculators/takeHomePay';
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
  result: TakeHomePayResult;
  autoEnrolmentTakeHome?: number; // for salary sacrifice comparison
}

export function ResultsPanel({ result, autoEnrolmentTakeHome }: ResultsPanelProps) {
  if (result.annualGross === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 text-center text-[var(--text-muted)]">
        <p>Enter your salary to see results.</p>
      </div>
    );
  }

  const salSacSavings = autoEnrolmentTakeHome != null
    ? result.annualTakeHome - autoEnrolmentTakeHome
    : 0;

  // £100k trap detection
  const isInTrap = result.annualGross >= 100000 && result.annualGross <= 125140;

  return (
    <div className="space-y-6">
      {/* Hero: annual take-home */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 text-center">
        <p className="text-sm text-[var(--text-muted)] mb-1">Your annual take-home pay</p>
        <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">
          {fmt(result.annualTakeHome)}
        </p>
        <p className="text-lg text-[var(--text-secondary)] mt-1">
          {fmt(result.monthlyTakeHome)}/month
        </p>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Effective deduction rate: {pct(result.effectiveTaxRate)}
        </p>
      </div>

      {/* Callouts */}
      {isInTrap && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
            ⚠️ <strong>£100k trap:</strong> Your effective marginal rate is ~60% in this range. For every £2 above £100k, you lose £1 of Personal Allowance — creating a hidden 60% marginal rate between £100k and £125,140.
          </p>
        </div>
      )}

      {salSacSavings > 0 && (
        <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4">
          <p className="text-sm text-green-800 dark:text-green-300 font-medium">
            💰 <strong>Salary sacrifice saves you {fmt(salSacSavings)}/year</strong> compared to auto-enrolment pension at the same contribution rate.
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Income Tax</p>
          <p className="text-lg font-semibold text-[var(--text-primary)]">{fmt(result.incomeTax)}</p>
          <p className="text-xs text-[var(--text-muted)]">{fmt(Math.round(result.incomeTax / 12))}/mo</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
          <p className="text-xs text-[var(--text-muted)]">National Insurance</p>
          <p className="text-lg font-semibold text-[var(--text-primary)]">{fmt(result.nationalInsurance)}</p>
          <p className="text-xs text-[var(--text-muted)]">{fmt(Math.round(result.nationalInsurance / 12))}/mo</p>
        </div>
        {result.pensionContribution > 0 && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
            <p className="text-xs text-[var(--text-muted)]">Pension (you)</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">{fmt(result.pensionContribution)}</p>
            <p className="text-xs text-[var(--text-muted)]">Employer: {fmt(result.pensionEmployer)}</p>
          </div>
        )}
        {result.totalStudentLoan > 0 && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
            <p className="text-xs text-[var(--text-muted)]">Student Loan</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">{fmt(result.totalStudentLoan)}</p>
            <p className="text-xs text-[var(--text-muted)]">{fmt(Math.round(result.totalStudentLoan / 12))}/mo</p>
          </div>
        )}
      </div>

      {/* Marginal rate */}
      <div className="rounded-lg bg-[var(--bg-tertiary)] p-4">
        <p className="text-sm text-[var(--text-secondary)]">
          <strong>Marginal rate:</strong> {pct(result.marginalTaxRate)}
          <span className="text-xs text-[var(--text-muted)] ml-1">
            — for every extra £1 you earn, you keep {fmt2(1 - result.marginalTaxRate)}
          </span>
        </p>
      </div>

      {/* Period breakdown table */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Period Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)]">
                <th className="py-2 pr-3"></th>
                <th className="py-2 pr-3 text-right">Annual</th>
                <th className="py-2 pr-3 text-right">Monthly</th>
                <th className="py-2 pr-3 text-right">Weekly</th>
                <th className="py-2 pr-3 text-right">Daily</th>
                <th className="py-2 text-right">Hourly</th>
              </tr>
            </thead>
            <tbody>
              <PeriodRow label="Gross" annual={result.annualGross} />
              <PeriodRow label="Income Tax" annual={result.incomeTax} negative />
              <PeriodRow label="NI" annual={result.nationalInsurance} negative />
              {result.totalStudentLoan > 0 && (
                <PeriodRow label="Student Loan" annual={result.totalStudentLoan} negative />
              )}
              {result.pensionContribution > 0 && (
                <PeriodRow label="Pension" annual={result.pensionContribution} negative />
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[var(--border)] bg-[var(--bg-tertiary)]">
                <td className="py-2 pr-3 font-semibold text-primary-600 dark:text-primary-400">Take-Home</td>
                <td className="py-2 pr-3 text-right font-semibold text-primary-600 dark:text-primary-400">{fmt(result.annualTakeHome)}</td>
                <td className="py-2 pr-3 text-right font-semibold text-primary-600 dark:text-primary-400">{fmt(result.monthlyTakeHome)}</td>
                <td className="py-2 pr-3 text-right font-semibold text-primary-600 dark:text-primary-400">{fmt(result.weeklyTakeHome)}</td>
                <td className="py-2 pr-3 text-right font-semibold text-primary-600 dark:text-primary-400">{fmt(result.dailyTakeHome)}</td>
                <td className="py-2 text-right font-semibold text-primary-600 dark:text-primary-400">{fmt(result.hourlyTakeHome)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Full breakdown expandable */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">
          Show full tax breakdown
        </summary>
        <div className="mt-4">
          <BreakdownTable
            incomeTaxBreakdown={result.incomeTaxBreakdown}
            niBreakdown={result.niBreakdown}
            studentLoanDeductions={result.studentLoanDeductions}
            incomeTax={result.incomeTax}
            nationalInsurance={result.nationalInsurance}
            totalStudentLoan={result.totalStudentLoan}
            pensionContribution={result.pensionContribution}
            pensionType={result.pensionType}
            personalAllowance={result.personalAllowance}
          />
        </div>
      </details>
    </div>
  );
}

function PeriodRow({ label, annual, negative }: { label: string; annual: number; negative?: boolean }) {
  const prefix = negative ? '−' : '';
  const f = (n: number) => `${prefix}${fmt(Math.abs(n))}`;

  return (
    <tr className="border-b border-[var(--border)]/50">
      <td className="py-2 pr-3 text-[var(--text-secondary)]">{label}</td>
      <td className="py-2 pr-3 text-right">{f(annual)}</td>
      <td className="py-2 pr-3 text-right">{f(Math.round(annual / 12))}</td>
      <td className="py-2 pr-3 text-right">{f(Math.round(annual / 52))}</td>
      <td className="py-2 pr-3 text-right">{f(Math.round(annual / 260))}</td>
      <td className="py-2 text-right">{f(Math.round(annual / 1950))}</td>
    </tr>
  );
}
