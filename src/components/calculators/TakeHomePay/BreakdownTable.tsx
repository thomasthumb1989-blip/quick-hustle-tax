import type { TaxBandBreakdown, NIBandBreakdown, StudentLoanDeduction } from '../../../lib/calculators/takeHomePay';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(n);

const pct = (n: number) => `${(n * 100).toFixed(0)}%`;

interface BreakdownTableProps {
  incomeTaxBreakdown: TaxBandBreakdown[];
  niBreakdown: NIBandBreakdown[];
  studentLoanDeductions: StudentLoanDeduction[];
  incomeTax: number;
  nationalInsurance: number;
  totalStudentLoan: number;
  pensionContribution: number;
  pensionType: string;
  personalAllowance: number;
}

export function BreakdownTable({
  incomeTaxBreakdown,
  niBreakdown,
  studentLoanDeductions,
  incomeTax,
  nationalInsurance,
  totalStudentLoan,
  pensionContribution,
  pensionType,
  personalAllowance,
}: BreakdownTableProps) {
  return (
    <div className="space-y-6">
      {/* Personal Allowance */}
      <div className="rounded-lg bg-[var(--bg-tertiary)] p-3">
        <p className="text-sm text-[var(--text-secondary)]">
          Personal Allowance: <strong className="text-[var(--text-primary)]">{fmt(personalAllowance)}</strong>
        </p>
      </div>

      {/* Income Tax */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Income Tax</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)]">
                <th className="py-2 pr-4">Band</th>
                <th className="py-2 pr-4 text-right">Amount</th>
                <th className="py-2 pr-4 text-right">Rate</th>
                <th className="py-2 text-right">Tax</th>
              </tr>
            </thead>
            <tbody>
              {incomeTaxBreakdown.map((row, i) => (
                <tr key={i} className="border-b border-[var(--border)]/50">
                  <td className="py-2 pr-4 text-[var(--text-secondary)]">{row.band}</td>
                  <td className="py-2 pr-4 text-right">{fmt(row.taxableAmount)}</td>
                  <td className="py-2 pr-4 text-right">{pct(row.rate)}</td>
                  <td className="py-2 text-right font-medium">{fmt(row.tax)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[var(--border)]">
                <td colSpan={3} className="py-2 font-semibold">Total income tax</td>
                <td className="py-2 text-right font-semibold">{fmt(incomeTax)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* National Insurance */}
      {niBreakdown.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            National Insurance (Class 1 Employee)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)]">
                  <th className="py-2 pr-4">Band</th>
                  <th className="py-2 pr-4 text-right">Earnings</th>
                  <th className="py-2 pr-4 text-right">Rate</th>
                  <th className="py-2 text-right">NI</th>
                </tr>
              </thead>
              <tbody>
                {niBreakdown.map((row, i) => (
                  <tr key={i} className="border-b border-[var(--border)]/50">
                    <td className="py-2 pr-4 text-[var(--text-secondary)]">{row.band}</td>
                    <td className="py-2 pr-4 text-right">{fmt(row.amount)}</td>
                    <td className="py-2 pr-4 text-right">{pct(row.rate)}</td>
                    <td className="py-2 text-right font-medium">{fmt(row.ni)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--border)]">
                  <td colSpan={3} className="py-2 font-semibold">Total NI</td>
                  <td className="py-2 text-right font-semibold">{fmt(nationalInsurance)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Student Loans */}
      {totalStudentLoan > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Student Loan Repayments</h3>
          <div className="space-y-1">
            {studentLoanDeductions.filter(d => d.deduction > 0).map((d, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">{d.plan}</span>
                <span className="font-medium">{fmt(d.deduction)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-semibold border-t border-[var(--border)] pt-1 mt-1">
              <span>Total student loan</span>
              <span>{fmt(totalStudentLoan)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Pension */}
      {pensionContribution > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Pension Contribution</h3>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">
              Employee ({pensionType === 'salary-sacrifice' ? 'salary sacrifice' : 'auto-enrolment'})
            </span>
            <span className="font-medium">{fmt(pensionContribution)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
