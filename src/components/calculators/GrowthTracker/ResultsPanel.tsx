import type { GrowthTrackerResult } from '../../../lib/calculators/growthTracker';
import { ProgressBar } from './ProgressBar';

interface ResultsPanelProps {
  result: GrowthTrackerResult;
  targetType: 'revenue' | 'profit';
  targetPeriod: 'monthly' | 'yearly';
}

export function ResultsPanel({ result, targetType, targetPeriod }: ResultsPanelProps) {
  const { perItem, unitsNeeded, financials, timeEstimate, progress, platformComparison } = result;
  const isInfinite = unitsNeeded.perMonth >= 9999 || !isFinite(unitsNeeded.perMonth);

  return (
    <div className="space-y-5">
      {/* Hero number */}
      <div className="rounded-xl border-2 border-primary-500 bg-primary-50 dark:bg-primary-950/30 p-6 text-center">
        {isInfinite ? (
          <>
            <p className="text-lg font-bold text-red-700 dark:text-red-400">
              Your costs exceed your selling price
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              You lose money on every sale. Raise your price or reduce your costs.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-[var(--text-muted)]">You need to sell</p>
            <p className="text-4xl font-black text-primary-700 dark:text-primary-300 my-2">
              {unitsNeeded.perMonth.toLocaleString()} items/month
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              That's ~{Math.ceil(unitsNeeded.perWeek)} per week, or ~{Math.ceil(unitsNeeded.perDay)} per day
            </p>
          </>
        )}
      </div>

      {/* Per-item breakdown */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">💰 Per-Item Breakdown</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Selling price</span>
            <span className="font-medium text-[var(--text-primary)]">£{perItem.sellingPrice.toFixed(2)}</span>
          </div>
          {perItem.costOfGoods > 0 && (
            <div className="flex justify-between text-red-600 dark:text-red-400">
              <span>– Cost of goods</span>
              <span>-£{perItem.costOfGoods.toFixed(2)}</span>
            </div>
          )}
          {perItem.shippingCost > 0 && (
            <div className="flex justify-between text-red-600 dark:text-red-400">
              <span>– Shipping</span>
              <span>-£{perItem.shippingCost.toFixed(2)}</span>
            </div>
          )}
          {perItem.platformFees > 0 && (
            <>
              <div className="flex justify-between text-red-600 dark:text-red-400">
                <span>– Platform fees</span>
                <span>-£{perItem.platformFees.toFixed(2)}</span>
              </div>
              {perItem.platformFeeBreakdown.map((fee) => (
                <div key={fee.name} className="flex justify-between pl-4 text-xs text-[var(--text-muted)]">
                  <span>{fee.name}</span>
                  <span>£{fee.amount.toFixed(2)}</span>
                </div>
              ))}
            </>
          )}
          {perItem.platformFees === 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>– Platform fees</span>
              <span>£0.00</span>
            </div>
          )}
          <div className="border-t border-[var(--border)] pt-2 flex justify-between font-bold">
            <span className="text-[var(--text-primary)]">YOUR PROFIT</span>
            <span className={perItem.profitPerItem > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}>
              £{perItem.profitPerItem.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-[var(--text-muted)]">
            <span>Profit margin</span>
            <span>{perItem.profitMargin.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Financials summary */}
      {!isInfinite && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label={`Total revenue (${targetPeriod === 'monthly' ? 'monthly' : 'yearly'})`}
            value={`£${financials.grossRevenue.toLocaleString()}`}
          />
          <StatCard
            label="Platform fees"
            value={`£${financials.totalPlatformFees.toLocaleString()}`}
            sub={`${financials.effectivePlatformFeeRate}% of revenue`}
          />
          <StatCard
            label="Total costs"
            value={`£${(financials.totalCostOfGoods + financials.totalShipping).toLocaleString()}`}
          />
          <StatCard
            label="Your take-home"
            value={`£${financials.totalProfit.toLocaleString()}`}
            highlight
          />
        </div>
      )}

      {/* Pace breakdown */}
      {!isInfinite && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">📊 Sales Pace</h4>
          <div className="space-y-3">
            <PaceRow label="Per day" value={unitsNeeded.perDay} max={unitsNeeded.perMonth} />
            <PaceRow label="Per week" value={unitsNeeded.perWeek} max={unitsNeeded.perMonth} />
            <PaceRow label="Per month" value={unitsNeeded.perMonth} max={unitsNeeded.perMonth} />
            <PaceRow label="Per year" value={unitsNeeded.perMonth * 12} max={unitsNeeded.perMonth * 12} />
          </div>
        </div>
      )}

      {/* Feasibility */}
      {timeEstimate && (
        <div className={`rounded-xl border-2 p-5 ${
          timeEstimate.feasible
            ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30'
            : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30'
        }`}>
          <h4 className={`text-sm font-semibold mb-2 ${
            timeEstimate.feasible
              ? 'text-emerald-800 dark:text-emerald-300'
              : 'text-red-800 dark:text-red-300'
          }`}>
            {timeEstimate.feasible ? '✅ Feasibility Check' : '⚠️ Feasibility Warning'}
          </h4>
          <p className={`text-sm ${
            timeEstimate.feasible
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-red-700 dark:text-red-400'
          }`}>
            {timeEstimate.feasibilityNote}
          </p>
        </div>
      )}

      {/* Progress tracker */}
      {progress && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">📈 Your Progress</h4>
          <ProgressBar percent={progress.progressPercent} label="Monthly target" />
          <div className="mt-3 space-y-1 text-sm text-[var(--text-secondary)]">
            {progress.onTrack ? (
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                🎉 You're on track! Keep it up.
              </p>
            ) : (
              <p>You need <strong>{progress.monthlyGap}</strong> more sales this month to hit your goal.</p>
            )}
            <p>Current monthly {targetType}: <strong>£{(targetType === 'profit' ? progress.currentMonthlyProfit : progress.currentMonthlyRevenue).toLocaleString()}</strong></p>
            <p>Projected annual {targetType}: <strong>£{progress.projectedAnnual.toLocaleString()}</strong></p>
          </div>
        </div>
      )}

      {/* Platform comparison */}
      {platformComparison.length > 0 && !isInfinite && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">🔄 Same Item, Different Platform</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[var(--text-muted)]">
                  <th className="pb-2">Platform</th>
                  <th className="pb-2 text-right">Fees</th>
                  <th className="pb-2 text-right">Profit/item</th>
                  <th className="pb-2 text-right">Items/month</th>
                </tr>
              </thead>
              <tbody>
                {platformComparison
                  .sort((a, b) => a.unitsPerMonth - b.unitsPerMonth)
                  .map((p) => (
                  <tr key={p.platform} className="border-t border-[var(--border)]">
                    <td className="py-1.5">
                      <span className="mr-1">{p.icon}</span>
                      <span className="text-[var(--text-secondary)]">{p.name}</span>
                    </td>
                    <td className="py-1.5 text-right text-[var(--text-secondary)]">£{p.feesPerItem.toFixed(2)}</td>
                    <td className={`py-1.5 text-right font-medium ${p.profitPerItem > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      £{p.profitPerItem.toFixed(2)}
                    </td>
                    <td className="py-1.5 text-right text-[var(--text-secondary)]">
                      {p.unitsPerMonth >= 9999 ? '∞' : p.unitsPerMonth.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tax callout */}
      <div className="rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-5">
        <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">💡 Tax Implications</h4>
        <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
          Your side-hustle income may be subject to tax. If your total gross revenue exceeds £1,000,
          you'll need to register for Self Assessment. Use our{' '}
          <a href="/side-hustle-tax-calculator/" className="underline font-medium">Side-Hustle Tax Calculator</a>{' '}
          to see your exact liability, or check if the{' '}
          <a href="/trading-allowance-checker/" className="underline font-medium">£1,000 Trading Allowance</a>{' '}
          covers you.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 border ${
      highlight
        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30'
        : 'border-[var(--border)] bg-[var(--bg-primary)]'
    }`}>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className={`text-lg font-bold ${highlight ? 'text-emerald-700 dark:text-emerald-400' : 'text-[var(--text-primary)]'}`}>{value}</p>
      {sub && <p className="text-xs text-[var(--text-muted)]">{sub}</p>}
    </div>
  );
}

function PaceRow({ label, value, max }: { label: string; value: number; max: number }) {
  const percent = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--text-muted)] w-20 shrink-0">{label}</span>
      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full bg-primary-500 transition-all"
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      <span className="text-sm font-medium text-[var(--text-primary)] w-16 text-right">
        {Math.ceil(value).toLocaleString()}
      </span>
    </div>
  );
}
