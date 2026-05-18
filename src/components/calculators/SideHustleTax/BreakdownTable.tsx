import type { TaxBandBreakdown, NIBandBreakdown } from '../../../lib/calculators/sideHustleTax';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(n);

const pct = (n: number) => `${(n * 100).toFixed(0)}%`;

interface BreakdownTableProps {
  incomeTaxBreakdown: TaxBandBreakdown[];
  class4NIBreakdown: NIBandBreakdown[];
  totalIncomeTax: number;
  totalClass4NI: number;
  taxOnEmploymentOnly: number;
}

export function BreakdownTable({
  incomeTaxBreakdown,
  class4NIBreakdown,
  totalIncomeTax,
  totalClass4NI,
  taxOnEmploymentOnly,
}: BreakdownTableProps) {
  const additionalIncomeTax = totalIncomeTax - taxOnEmploymentOnly;

  return (
    <div className="space-y-6">
      {/* Income Tax Breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
          Income Tax (on total income)
        </h3>
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
                  <td className="py-2 pr-4 text-right">{fmt(row.amount)}</td>
                  <td className="py-2 pr-4 text-right">{pct(row.rate)}</td>
                  <td className="py-2 text-right font-medium">{fmt(row.tax)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[var(--border)]">
                <td colSpan={3} className="py-2 font-semibold">Total income tax</td>
                <td className="py-2 text-right font-semibold">{fmt(totalIncomeTax)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="py-1 text-[var(--text-muted)] text-xs">
                  Already paid via PAYE
                </td>
                <td className="py-1 text-right text-[var(--text-muted)] text-xs">
                  −{fmt(taxOnEmploymentOnly)}
                </td>
              </tr>
              <tr className="bg-[var(--bg-tertiary)]">
                <td colSpan={3} className="py-2 font-semibold text-primary-600 dark:text-primary-400">
                  Additional income tax (Self Assessment)
                </td>
                <td className="py-2 text-right font-semibold text-primary-600 dark:text-primary-400">
                  {fmt(additionalIncomeTax)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Class 4 NI Breakdown */}
      {class4NIBreakdown.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            Class 4 National Insurance (on side-hustle profit)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)]">
                  <th className="py-2 pr-4">Band</th>
                  <th className="py-2 pr-4 text-right">Profit</th>
                  <th className="py-2 pr-4 text-right">Rate</th>
                  <th className="py-2 text-right">NI</th>
                </tr>
              </thead>
              <tbody>
                {class4NIBreakdown.map((row, i) => (
                  <tr key={i} className="border-b border-[var(--border)]/50">
                    <td className="py-2 pr-4 text-[var(--text-secondary)]">{row.band}</td>
                    <td className="py-2 pr-4 text-right">{fmt(row.profit)}</td>
                    <td className="py-2 pr-4 text-right">{pct(row.rate)}</td>
                    <td className="py-2 text-right font-medium">{fmt(row.ni)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--border)]">
                  <td colSpan={3} className="py-2 font-semibold">Total Class 4 NI</td>
                  <td className="py-2 text-right font-semibold">{fmt(totalClass4NI)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
