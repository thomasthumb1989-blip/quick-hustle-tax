import { FormField } from '../../ui/FormField';
import type { SelfAssessmentPenaltyInput } from '../../../lib/calculators/selfAssessmentPenalty';

interface InputsPanelProps {
  inputs: SelfAssessmentPenaltyInput;
  onChange: (updates: Partial<SelfAssessmentPenaltyInput>) => void;
}

export function InputsPanel({ inputs, onChange }: InputsPanelProps) {
  return (
    <div className="space-y-5">
      {/* Tax owed */}
      <FormField
        id="sa-tax-owed"
        label="Tax owed for this year"
        hint="Your total self-assessment tax liability"
        type="number"
        prefix="£"
        min={0}
        step={1}
        value={inputs.taxOwed || ''}
        onChange={(e) => onChange({ taxOwed: Math.max(0, Number(e.target.value) || 0) })}
      />

      {/* Filing status */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-[var(--text-primary)]">Filing status</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
            <input
              type="radio"
              name="filing-status"
              checked={inputs.hasFiledReturn}
              onChange={() => onChange({ hasFiledReturn: true })}
              className="accent-primary-600"
            />
            Filed
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
            <input
              type="radio"
              name="filing-status"
              checked={!inputs.hasFiledReturn}
              onChange={() => onChange({ hasFiledReturn: false, filingDate: undefined })}
              className="accent-primary-600"
            />
            Not yet filed
          </label>
        </div>

        {inputs.hasFiledReturn && (
          <FormField
            id="sa-filing-date"
            label="Date filed"
            type="date"
            value={inputs.filingDate || ''}
            onChange={(e) => onChange({ filingDate: e.target.value || undefined })}
          />
        )}
      </fieldset>

      {/* Payment status */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-[var(--text-primary)]">Payment status</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
            <input
              type="radio"
              name="payment-status"
              checked={inputs.hasPaidInFull}
              onChange={() => onChange({ hasPaidInFull: true, amountPaid: undefined })}
              className="accent-primary-600"
            />
            Paid in full
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
            <input
              type="radio"
              name="payment-status"
              checked={!inputs.hasPaidInFull}
              onChange={() => onChange({ hasPaidInFull: false })}
              className="accent-primary-600"
            />
            Not paid / partial
          </label>
        </div>

        {inputs.hasPaidInFull && (
          <FormField
            id="sa-payment-date"
            label="Date paid"
            type="date"
            value={inputs.paymentDate || ''}
            onChange={(e) => onChange({ paymentDate: e.target.value || undefined })}
          />
        )}

        {!inputs.hasPaidInFull && (
          <FormField
            id="sa-amount-paid"
            label="Amount paid so far"
            type="number"
            prefix="£"
            min={0}
            step={1}
            value={inputs.amountPaid ?? ''}
            onChange={(e) => onChange({ amountPaid: Math.max(0, Number(e.target.value) || 0) })}
          />
        )}
      </fieldset>

      {/* Check date */}
      <FormField
        id="sa-check-date"
        label="Check as of date"
        hint="Calculate penalties as of this date (defaults to today)"
        type="date"
        value={inputs.checkDate || ''}
        onChange={(e) => onChange({ checkDate: e.target.value || undefined })}
      />
    </div>
  );
}
