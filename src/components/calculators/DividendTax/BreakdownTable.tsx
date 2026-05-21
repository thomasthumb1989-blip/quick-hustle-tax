import type { DividendBandBreakdown } from '../../../lib/calculators/dividendTax';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

interface BreakdownTableProps {
  breakdown: DividendBandBreakdown[];
  totalTax: number;
}

export function BreakdownTable({ breakdown, totalTax }: BreakdownTableProps) {
  if (breakdown.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4 text-center">
        <p className="text-sm text-[var(--text-muted)]">No dividends entered.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--bg-tertiary)]">
            <th className="text-left px-4 py-2.5 font-medium text-[var(--text-secondary)]">Band</th>
            <th className="text-right px-4 py-2.5 font-medium text-[var(--text-secondary)]">Amount</th>
            <th className="text-right px-4 py-2.5 font-medium text-[var(--text-secondary)]">Rate</th>
            <th className="text-right px-4 py-2.5 font-medium text-[var(--text-secondary)]">Tax</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {breakdown.map((row) => (
            <tr key={row.band} className="bg-[var(--bg-secondary)]">
              <td className="px-4 py-2.5 text-[var(--text-primary)]">{row.band}</td>
              <td className="px-4 py-2.5 text-right text-[var(--text-primary)]">{fmt(row.amount)}</td>
              <td className="px-4 py-2.5 text-right text-[var(--text-muted)]">
                {row.rate === 0 ? '0%' : pct(row.rate)}
              </td>
              <td className="px-4 py-2.5 text-right text-[var(--text-primary)] font-medium">
                {fmt(row.tax)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-[var(--bg-tertiary)] font-semibold">
            <td className="px-4 py-2.5 text-[var(--text-primary)]" colSpan={3}>
              Total dividend tax
            </td>
            <td className="px-4 py-2.5 text-right text-primary-600 dark:text-primary-400">
              {fmt(totalTax)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
