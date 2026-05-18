import { FormField, SelectField } from '../../ui/FormField';
import type { SideHustleTaxInput } from '../../../lib/calculators/sideHustleTax';

interface InputsPanelProps {
  inputs: SideHustleTaxInput;
  onChange: (updates: Partial<SideHustleTaxInput>) => void;
}

export function InputsPanel({ inputs, onChange }: InputsPanelProps) {
  return (
    <div className="space-y-5">
      <FormField
        id="employmentIncome"
        label="Annual employment income (before tax)"
        hint="Your gross PAYE salary"
        prefix="£"
        type="number"
        min={0}
        step={500}
        value={inputs.employmentIncome || ''}
        onChange={(e) =>
          onChange({ employmentIncome: Math.max(0, Number(e.target.value) || 0) })
        }
      />

      <FormField
        id="sideHustleGrossIncome"
        label="Side-hustle gross income"
        hint="Total revenue before any expenses"
        prefix="£"
        type="number"
        min={0}
        step={100}
        value={inputs.sideHustleGrossIncome || ''}
        onChange={(e) =>
          onChange({ sideHustleGrossIncome: Math.max(0, Number(e.target.value) || 0) })
        }
      />

      <FormField
        id="sideHustleExpenses"
        label="Business expenses"
        hint="Materials, tools, travel, software, etc."
        prefix="£"
        type="number"
        min={0}
        step={50}
        value={inputs.sideHustleExpenses || ''}
        onChange={(e) =>
          onChange({ sideHustleExpenses: Math.max(0, Number(e.target.value) || 0) })
        }
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
