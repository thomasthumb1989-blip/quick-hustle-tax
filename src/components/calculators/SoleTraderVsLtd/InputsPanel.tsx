import { FormField } from '../../ui/FormField';
import { PeriodToggle } from '../../ui/PeriodToggle';
import type { Period } from '../../../lib/calculators/periodConversion';

interface InputsPanelProps {
  annualProfit: number;
  displayProfit: number;
  profitPeriod: Period;
  hasEmploymentAllowance: boolean;
  accountingCosts: number;
  onProfitChange: (value: number) => void;
  onDisplayProfitChange: (value: number) => void;
  onPeriodChange: (period: Period) => void;
  onEAChange: (value: boolean) => void;
  onAccountingCostsChange: (value: number) => void;
}

export function InputsPanel({
  displayProfit,
  profitPeriod,
  hasEmploymentAllowance,
  accountingCosts,
  onProfitChange,
  onDisplayProfitChange,
  onPeriodChange,
  onEAChange,
  onAccountingCostsChange,
}: InputsPanelProps) {
  return (
    <div className="space-y-5">
      <FormField
        id="annualProfit"
        label="Annual business profit"
        labelRight={
          <PeriodToggle
            value={profitPeriod}
            onChange={onPeriodChange}
          />
        }
        hint={profitPeriod === 'annual'
          ? 'Your total business profit (revenue minus costs) per year'
          : 'Your total business profit (revenue minus costs) per month'}
        prefix="£"
        type="number"
        min={0}
        step={profitPeriod === 'monthly' ? 100 : 1000}
        value={displayProfit || ''}
        onChange={(e) => {
          const val = Math.max(0, Number(e.target.value) || 0);
          onDisplayProfitChange(val);
          onProfitChange(profitPeriod === 'monthly' ? Math.round(val * 12) : val);
        }}
      />

      {/* Employment Allowance toggle */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="ea-toggle" className="text-sm font-medium text-[var(--text-primary)]">
            Employment Allowance available?
          </label>
          <button
            id="ea-toggle"
            type="button"
            role="switch"
            aria-checked={hasEmploymentAllowance}
            onClick={() => onEAChange(!hasEmploymentAllowance)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              hasEmploymentAllowance
                ? 'bg-primary-600 dark:bg-primary-500'
                : 'bg-[var(--border)]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                hasEmploymentAllowance ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Available if your company has 2+ directors or employees. Single-director companies cannot claim this.
        </p>
      </div>

      <FormField
        id="accountingCosts"
        label="Annual accounting costs"
        hint="Typical Ltd company accountant fees"
        prefix="£"
        type="number"
        min={0}
        step={100}
        value={accountingCosts || ''}
        onChange={(e) => {
          onAccountingCostsChange(Math.max(0, Number(e.target.value) || 0));
        }}
      />

      <div className="rounded-lg bg-[var(--bg-tertiary)] p-3 text-xs text-[var(--text-muted)]">
        <p>
          Assumes optimal salary (Personal Allowance) plus dividends extraction.
          All post-corporation-tax profit is distributed as dividends.
        </p>
      </div>
    </div>
  );
}
