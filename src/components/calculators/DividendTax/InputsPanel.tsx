import { FormField } from '../../ui/FormField';

interface DividendInputs {
  otherIncome: number;
  dividendIncome: number;
}

interface InputsPanelProps {
  inputs: DividendInputs;
  onChange: (updates: Partial<DividendInputs>) => void;
}

export function InputsPanel({ inputs, onChange }: InputsPanelProps) {
  return (
    <div className="space-y-5">
      <FormField
        id="otherIncome"
        label="Annual salary / other income"
        hint="Employment, self-employment, pensions, rental — everything except dividends"
        prefix="£"
        type="number"
        inputMode="numeric"
        min={0}
        step={1000}
        value={inputs.otherIncome || ''}
        onChange={(e) =>
          onChange({ otherIncome: Math.max(0, Number(e.target.value) || 0) })
        }
      />

      <FormField
        id="dividendIncome"
        label="Annual dividend income"
        hint="Gross dividends received (before tax). From all companies/investments combined."
        prefix="£"
        type="number"
        inputMode="numeric"
        min={0}
        step={1000}
        value={inputs.dividendIncome || ''}
        onChange={(e) =>
          onChange({ dividendIncome: Math.max(0, Number(e.target.value) || 0) })
        }
      />
    </div>
  );
}
