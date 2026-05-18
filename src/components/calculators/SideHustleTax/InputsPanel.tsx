import { FormField, SelectField } from '../../ui/FormField';
import { PeriodToggle } from '../../ui/PeriodToggle';
import type { SideHustleTaxInput } from '../../../lib/calculators/sideHustleTax';
import type { Period } from '../../../lib/calculators/periodConversion';
import { toAnnual, convertForToggle } from '../../../lib/calculators/periodConversion';

export interface FieldPeriods {
  employmentIncome: Period;
  sideHustleGrossIncome: Period;
  sideHustleExpenses: Period;
}

interface InputsPanelProps {
  inputs: SideHustleTaxInput;
  displayValues: {
    employmentIncome: number;
    sideHustleGrossIncome: number;
    sideHustleExpenses: number;
  };
  periods: FieldPeriods;
  onChange: (updates: Partial<SideHustleTaxInput>) => void;
  onDisplayChange: (field: keyof FieldPeriods, value: number) => void;
  onPeriodChange: (field: keyof FieldPeriods, period: Period) => void;
}

const hints: Record<string, { annual: string; monthly: string }> = {
  employmentIncome: {
    annual: 'Your gross annual PAYE salary',
    monthly: 'Your gross monthly PAYE salary',
  },
  sideHustleGrossIncome: {
    annual: 'Total annual revenue before any expenses',
    monthly: 'Total monthly revenue before any expenses',
  },
  sideHustleExpenses: {
    annual: 'Annual total: materials, tools, travel, software, etc.',
    monthly: 'Monthly total: materials, tools, travel, software, etc.',
  },
};

export function InputsPanel({
  inputs,
  displayValues,
  periods,
  onChange,
  onDisplayChange,
  onPeriodChange,
}: InputsPanelProps) {
  return (
    <div className="space-y-5">
      <FormField
        id="employmentIncome"
        label="Employment income"
        labelRight={
          <PeriodToggle
            value={periods.employmentIncome}
            onChange={(p) => onPeriodChange('employmentIncome', p)}
          />
        }
        hint={hints.employmentIncome[periods.employmentIncome]}
        prefix="£"
        type="number"
        min={0}
        step={periods.employmentIncome === 'monthly' ? 50 : 500}
        value={displayValues.employmentIncome || ''}
        onChange={(e) => {
          const displayVal = Math.max(0, Number(e.target.value) || 0);
          onDisplayChange('employmentIncome', displayVal);
          onChange({ employmentIncome: toAnnual(displayVal, periods.employmentIncome) });
        }}
      />

      <FormField
        id="sideHustleGrossIncome"
        label="Side-hustle gross income"
        labelRight={
          <PeriodToggle
            value={periods.sideHustleGrossIncome}
            onChange={(p) => onPeriodChange('sideHustleGrossIncome', p)}
          />
        }
        hint={hints.sideHustleGrossIncome[periods.sideHustleGrossIncome]}
        prefix="£"
        type="number"
        min={0}
        step={periods.sideHustleGrossIncome === 'monthly' ? 10 : 100}
        value={displayValues.sideHustleGrossIncome || ''}
        onChange={(e) => {
          const displayVal = Math.max(0, Number(e.target.value) || 0);
          onDisplayChange('sideHustleGrossIncome', displayVal);
          onChange({ sideHustleGrossIncome: toAnnual(displayVal, periods.sideHustleGrossIncome) });
        }}
      />

      <FormField
        id="sideHustleExpenses"
        label="Business expenses"
        labelRight={
          <PeriodToggle
            value={periods.sideHustleExpenses}
            onChange={(p) => onPeriodChange('sideHustleExpenses', p)}
          />
        }
        hint={hints.sideHustleExpenses[periods.sideHustleExpenses]}
        prefix="£"
        type="number"
        min={0}
        step={periods.sideHustleExpenses === 'monthly' ? 5 : 50}
        value={displayValues.sideHustleExpenses || ''}
        onChange={(e) => {
          const displayVal = Math.max(0, Number(e.target.value) || 0);
          onDisplayChange('sideHustleExpenses', displayVal);
          onChange({ sideHustleExpenses: toAnnual(displayVal, periods.sideHustleExpenses) });
        }}
      />

      <SelectField
        id="claimMode"
        label="Deduction method"
        hint="'Auto' picks whichever saves you more tax"
        value={inputs.claimMode}
        onChange={(e) =>
          onChange({
            claimMode: e.target.value as SideHustleTaxInput['claimMode'],
          })
        }
      >
        <option value="auto">Auto (recommended)</option>
        <option value="tradingAllowance">£1,000 Trading Allowance</option>
        <option value="actualExpenses">Actual Expenses</option>
      </SelectField>

      <div className="rounded-lg bg-[var(--bg-tertiary)] p-3 text-xs text-[var(--text-muted)]">
        <p>
          🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scottish taxpayer? Scotland has different income tax bands.
          A Scottish calculator is coming soon — for now, these rates apply to
          England, Wales, and Northern Ireland only.
        </p>
      </div>
    </div>
  );
}
