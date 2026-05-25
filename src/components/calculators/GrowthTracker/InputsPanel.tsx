import { PlatformSelector } from './PlatformSelector';

export interface InputValues {
  targetAmount: number;
  targetType: 'revenue' | 'profit';
  targetPeriod: 'monthly' | 'yearly';
  sellingPrice: number;
  costPerItem: number;
  shippingCostPerItem: number;
  platform: string;
  hoursPerWeek: number | undefined;
  currentMonthlySales: number | undefined;
}

interface InputsPanelProps {
  values: InputValues;
  onChange: (values: InputValues) => void;
}

function SegmentedButton({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
            value === opt.value
              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-900 dark:text-primary-100'
              : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function NumberInput({
  label,
  hint,
  value,
  onChange,
  prefix,
  min,
  max,
  step,
}: {
  label: string;
  hint?: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  prefix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">{label}</label>
      {hint && <p className="text-xs text-[var(--text-muted)] mb-1">{hint}</p>}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value === undefined ? '' : value}
          onChange={(e) => {
            const val = e.target.value === '' ? undefined : Number(e.target.value);
            onChange(val);
          }}
          min={min}
          max={max}
          step={step ?? 1}
          className={`w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            prefix ? 'pl-7 pr-3' : 'px-3'
          }`}
        />
      </div>
    </div>
  );
}

export function InputsPanel({ values, onChange }: InputsPanelProps) {
  const update = (patch: Partial<InputValues>) => onChange({ ...values, ...patch });

  return (
    <div className="space-y-6">
      {/* Section 1: Target */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">🎯 Your Target</h3>
        <div className="space-y-3">
          <NumberInput
            label="How much do you want to make?"
            value={values.targetAmount || undefined}
            onChange={(v) => update({ targetAmount: v ?? 0 })}
            prefix="£"
            min={0}
            step={50}
          />
          <SegmentedButton
            options={[
              { value: 'profit', label: 'Profit (what I keep)' },
              { value: 'revenue', label: 'Revenue (total sales)' },
            ]}
            value={values.targetType}
            onChange={(v) => update({ targetType: v as 'profit' | 'revenue' })}
          />
          <SegmentedButton
            options={[
              { value: 'monthly', label: 'Per month' },
              { value: 'yearly', label: 'Per year' },
            ]}
            value={values.targetPeriod}
            onChange={(v) => update({ targetPeriod: v as 'monthly' | 'yearly' })}
          />
        </div>
      </div>

      {/* Section 2: Product */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">📦 Your Product</h3>
        <div className="space-y-3">
          <NumberInput
            label="Selling price per item"
            hint="How much do you sell each item for?"
            value={values.sellingPrice || undefined}
            onChange={(v) => update({ sellingPrice: v ?? 0 })}
            prefix="£"
            min={0}
            step={0.5}
          />
          <NumberInput
            label="Cost per item"
            hint="Materials, wholesale, packaging"
            value={values.costPerItem || undefined}
            onChange={(v) => update({ costPerItem: v ?? 0 })}
            prefix="£"
            min={0}
            step={0.5}
          />
          <NumberInput
            label="Shipping cost per item"
            hint="£0 if buyer pays shipping"
            value={values.shippingCostPerItem || undefined}
            onChange={(v) => update({ shippingCostPerItem: v ?? 0 })}
            prefix="£"
            min={0}
            step={0.5}
          />
        </div>
      </div>

      {/* Section 3: Platform */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">🏪 Your Platform</h3>
        <PlatformSelector value={values.platform} onChange={(p) => update({ platform: p })} />
      </div>

      {/* Section 4: Optional */}
      <details className="group">
        <summary className="text-sm font-semibold text-[var(--text-primary)] cursor-pointer list-none flex items-center gap-2">
          <span className="text-xs transition-transform group-open:rotate-90">▶</span>
          Optional: Time & Progress
        </summary>
        <div className="mt-3 space-y-3">
          <NumberInput
            label="Hours per week available"
            hint="For making, listing, packing, posting"
            value={values.hoursPerWeek}
            onChange={(v) => update({ hoursPerWeek: v })}
            min={1}
            max={80}
          />
          <NumberInput
            label="Current monthly sales (items)"
            hint="How many items are you selling now?"
            value={values.currentMonthlySales}
            onChange={(v) => update({ currentMonthlySales: v })}
            min={0}
          />
        </div>
      </details>
    </div>
  );
}
