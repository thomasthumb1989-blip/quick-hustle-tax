import { FormField, SelectField } from '../../ui/FormField';
import { PeriodToggle } from '../../ui/PeriodToggle';
import type { TakeHomePayInput, StudentLoanPlan, PensionType } from '../../../lib/calculators/takeHomePay';
import type { Period } from '../../../lib/calculators/periodConversion';
import { toAnnual } from '../../../lib/calculators/periodConversion';

export interface FieldPeriods {
  annualGrossSalary: Period;
}

interface InputsPanelProps {
  inputs: TakeHomePayInput;
  displaySalary: number;
  salaryPeriod: Period;
  onChange: (updates: Partial<TakeHomePayInput>) => void;
  onDisplaySalaryChange: (value: number) => void;
  onSalaryPeriodChange: (period: Period) => void;
}

const studentLoanOptions: { value: StudentLoanPlan; label: string; hint: string }[] = [
  { value: 'plan1', label: 'Plan 1', hint: 'Started before Sep 2012' },
  { value: 'plan2', label: 'Plan 2', hint: 'Sep 2012 – Jul 2023' },
  { value: 'plan4', label: 'Plan 4', hint: 'Scotland' },
  { value: 'plan5', label: 'Plan 5', hint: 'Aug 2023 onwards' },
  { value: 'postgraduate', label: 'Postgraduate', hint: "Master's / Doctoral" },
];

export function InputsPanel({
  inputs,
  displaySalary,
  salaryPeriod,
  onChange,
  onDisplaySalaryChange,
  onSalaryPeriodChange,
}: InputsPanelProps) {
  const toggleStudentLoan = (plan: StudentLoanPlan) => {
    const current = inputs.studentLoanPlans;
    const next = current.includes(plan)
      ? current.filter((p) => p !== plan)
      : [...current, plan];
    onChange({ studentLoanPlans: next });
  };

  return (
    <div className="space-y-5">
      {/* Salary */}
      <FormField
        id="annualGrossSalary"
        label="Gross salary"
        labelRight={
          <PeriodToggle value={salaryPeriod} onChange={onSalaryPeriodChange} />
        }
        hint={salaryPeriod === 'monthly' ? 'Your gross monthly salary before deductions' : 'Your gross annual salary before deductions'}
        prefix="£"
        type="number"
        min={0}
        step={salaryPeriod === 'monthly' ? 50 : 500}
        value={displaySalary || ''}
        onChange={(e) => {
          const val = Math.max(0, Number(e.target.value) || 0);
          onDisplaySalaryChange(val);
          onChange({ annualGrossSalary: toAnnual(val, salaryPeriod) });
        }}
      />

      {/* Tax code */}
      <FormField
        id="taxCode"
        label="Tax code"
        hint="Found on your payslip or P45. Most people are 1257L"
        type="text"
        value={inputs.taxCode}
        onChange={(e) => onChange({ taxCode: e.target.value.toUpperCase() })}
        className="uppercase w-24"
      />

      {/* Pension type */}
      <SelectField
        id="pensionType"
        label="Pension type"
        hint="Salary sacrifice reduces tax and NI; auto-enrolment gives basic-rate relief only"
        value={inputs.pensionType}
        onChange={(e) => onChange({ pensionType: e.target.value as PensionType })}
      >
        <option value="auto-enrolment">Auto-enrolment (relief at source)</option>
        <option value="salary-sacrifice">Salary sacrifice</option>
        <option value="none">No pension</option>
      </SelectField>

      {/* Pension contribution % */}
      {inputs.pensionType !== 'none' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="pensionPercent" className="text-sm font-medium text-[var(--text-primary)]">
              Your contribution
            </label>
            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
              {inputs.pensionContributionPercent}%
            </span>
          </div>
          <input
            id="pensionPercent"
            type="range"
            min={0}
            max={40}
            step={1}
            value={inputs.pensionContributionPercent}
            onChange={(e) => onChange({ pensionContributionPercent: Number(e.target.value) })}
            className="w-full accent-primary-600"
          />
          <div className="flex justify-between text-xs text-[var(--text-muted)]">
            <span>0%</span>
            <span>40%</span>
          </div>
        </div>
      )}

      {/* Student loans */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-[var(--text-primary)]">Student loan plans</p>
        <p className="text-xs text-[var(--text-muted)]">Select all that apply — plans stack</p>
        <div className="space-y-2 mt-2">
          {studentLoanOptions.map((opt) => (
            <label key={opt.value} className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={inputs.studentLoanPlans.includes(opt.value)}
                onChange={() => toggleStudentLoan(opt.value)}
                className="mt-0.5 rounded border-[var(--border)] accent-primary-600"
              />
              <div>
                <span className="text-sm font-medium text-[var(--text-primary)]">{opt.label}</span>
                <span className="text-xs text-[var(--text-muted)] ml-1.5">{opt.hint}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Over State Pension age */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={inputs.isOverStatePensionAge}
          onChange={(e) => onChange({ isOverStatePensionAge: e.target.checked })}
          className="rounded border-[var(--border)] accent-primary-600"
        />
        <div>
          <span className="text-sm font-medium text-[var(--text-primary)]">Over State Pension age</span>
          <p className="text-xs text-[var(--text-muted)]">No National Insurance if you've reached State Pension age</p>
        </div>
      </label>

      {/* Scottish callout */}
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
