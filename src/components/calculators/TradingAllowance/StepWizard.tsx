import { useState, useCallback } from 'react';
import type { IncomeType } from '../../../lib/calculators/tradingAllowanceChecker';
import type { Period } from '../../../lib/calculators/periodConversion';
import { toAnnual, convertForToggle } from '../../../lib/calculators/periodConversion';

const INCOME_TYPES: { value: string; label: string; icon: string; mapTo: IncomeType }[] = [
  { value: 'selling-goods', label: 'Selling goods I made or bought to resell', icon: '🛍️', mapTo: 'trading' },
  { value: 'freelance', label: 'Freelance or contract work', icon: '💼', mapTo: 'trading' },
  { value: 'gig', label: 'Gig economy work (Deliveroo, Uber, etc.)', icon: '🚗', mapTo: 'trading' },
  { value: 'content', label: 'Content creation (YouTube, TikTok, etc.)', icon: '📱', mapTo: 'trading' },
  { value: 'rental', label: 'Rental income (Airbnb, lodger, parking)', icon: '🏠', mapTo: 'rental' },
  { value: 'employer', label: 'Work for my employer outside normal duties', icon: '👔', mapTo: 'employment' },
  { value: 'personal', label: 'Selling personal belongings I no longer want', icon: '🧹', mapTo: 'personal-sales' },
  { value: 'unsure', label: 'Not sure', icon: '❓', mapTo: 'unsure' },
];

const PLATFORMS = [
  'Etsy', 'eBay', 'Vinted', 'Depop', 'Amazon',
  'Fiverr', 'Upwork', 'Deliveroo', 'Uber', 'YouTube', 'Other',
];

export interface WizardResult {
  incomeType: IncomeType;
  anyIncomeFromEmployer: boolean;
  anyIncomeFromPartnership: boolean;
  anyIncomeFromOwnCompany: boolean;
  grossTradingIncome: number;
  actualExpenses: number;
  platforms: string[];
}

interface StepWizardProps {
  onComplete: (result: WizardResult) => void;
  onEarlyExit: (result: WizardResult) => void;
  initialValues?: Partial<WizardResult & { incomePeriod: Period; displayGross: number; displayExpenses: number }>;
}

export function StepWizard({ onComplete, onEarlyExit, initialValues }: StepWizardProps) {
  const [step, setStep] = useState(1);
  const [incomeTypeKey, setIncomeTypeKey] = useState(initialValues?.incomeType ? '' : '');
  const [incomeType, setIncomeType] = useState<IncomeType>(initialValues?.incomeType || 'trading');

  // Exclusions
  const [fromEmployer, setFromEmployer] = useState(initialValues?.anyIncomeFromEmployer ?? false);
  const [fromPartnership, setFromPartnership] = useState(initialValues?.anyIncomeFromPartnership ?? false);
  const [fromOwnCompany, setFromOwnCompany] = useState(initialValues?.anyIncomeFromOwnCompany ?? false);

  // Amounts
  const [grossAnnual, setGrossAnnual] = useState(initialValues?.grossTradingIncome ?? 0);
  const [displayGross, setDisplayGross] = useState(initialValues?.grossTradingIncome ?? 0);
  const [expenses, setExpenses] = useState(initialValues?.actualExpenses ?? 0);
  const [period, setPeriod] = useState<Period>('annual');
  const [platforms, setPlatforms] = useState<string[]>(initialValues?.platforms ?? []);

  const handleIncomeType = useCallback((key: string, mapped: IncomeType) => {
    setIncomeTypeKey(key);
    setIncomeType(mapped);

    // Early exits for non-trading types
    if (mapped === 'personal-sales' || mapped === 'rental' || mapped === 'employment') {
      onEarlyExit({
        incomeType: mapped,
        anyIncomeFromEmployer: key === 'employer',
        anyIncomeFromPartnership: false,
        anyIncomeFromOwnCompany: false,
        grossTradingIncome: grossAnnual,
        actualExpenses: expenses,
        platforms,
      });
      return;
    }
    setStep(2);
  }, [grossAnnual, expenses, platforms, onEarlyExit]);

  const handleExclusionsNext = useCallback(() => {
    if (fromEmployer || fromPartnership || fromOwnCompany) {
      onEarlyExit({
        incomeType,
        anyIncomeFromEmployer: fromEmployer,
        anyIncomeFromPartnership: fromPartnership,
        anyIncomeFromOwnCompany: fromOwnCompany,
        grossTradingIncome: grossAnnual,
        actualExpenses: expenses,
        platforms,
      });
      return;
    }
    setStep(3);
  }, [fromEmployer, fromPartnership, fromOwnCompany, incomeType, grossAnnual, expenses, platforms, onEarlyExit]);

  const handleAmountsSubmit = useCallback(() => {
    onComplete({
      incomeType,
      anyIncomeFromEmployer: fromEmployer,
      anyIncomeFromPartnership: fromPartnership,
      anyIncomeFromOwnCompany: fromOwnCompany,
      grossTradingIncome: grossAnnual,
      actualExpenses: expenses,
      platforms,
    });
  }, [incomeType, fromEmployer, fromPartnership, fromOwnCompany, grossAnnual, expenses, platforms, onComplete]);

  const handleGrossChange = (value: string) => {
    const num = Math.max(0, Number(value) || 0);
    setDisplayGross(num);
    setGrossAnnual(period === 'monthly' ? num * 12 : num);
  };

  const handlePeriodToggle = () => {
    const newPeriod = period === 'annual' ? 'monthly' : 'annual';
    setDisplayGross((d) => convertForToggle(d, period, newPeriod));
    setPeriod(newPeriod);
  };

  const togglePlatform = (p: string) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  // Progress bar
  const totalSteps = 3;
  const progress = Math.min(step / totalSteps, 1) * 100;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
          Step {step} of {totalSteps}
        </span>
      </div>

      {/* Step 1: Income Type */}
      {step === 1 && (
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
            What type of income is this?
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Select the option that best describes your side income.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {INCOME_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => handleIncomeType(t.value, t.mapTo)}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/20 ${
                  incomeTypeKey === t.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
                    : 'border-[var(--border)] bg-[var(--bg-secondary)]'
                }`}
              >
                <span className="text-xl shrink-0">{t.icon}</span>
                <span className="text-[var(--text-primary)]">{t.label}</span>
              </button>
            ))}
          </div>
          {incomeType === 'unsure' && incomeTypeKey === 'unsure' && (
            <div className="mt-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Trading</strong> means you're doing something regularly with the intention of making a profit — selling goods, freelancing, gig work. <strong>Personal sales</strong> means clearing out things you already own. If in doubt, HMRC looks at frequency, intent, and profit motive.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Exclusions */}
      {step === 2 && (
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
            Quick eligibility check
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            These questions check if you can use the trading allowance. Answer honestly — getting it wrong can lead to penalties.
          </p>
          <div className="space-y-3">
            {[
              { label: 'Does any of this income come from your employer or someone connected to your employer?', value: fromEmployer, setter: setFromEmployer },
              { label: 'Is any of this income earned through a business partnership?', value: fromPartnership, setter: setFromPartnership },
              { label: 'Is any of this income from a company you own or control?', value: fromOwnCompany, setter: setFromOwnCompany },
            ].map((q, i) => (
              <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
                <p className="text-sm text-[var(--text-primary)] mb-2">{q.label}</p>
                <div className="flex gap-3">
                  {['Yes', 'No'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => q.setter(opt === 'Yes')}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        (opt === 'Yes' && q.value) || (opt === 'No' && !q.value)
                          ? 'bg-primary-500 text-white'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleExclusionsNext}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Amounts */}
      {step === 3 && (
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
            Your income details
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Enter your total gross income across ALL platforms and activities.
          </p>
          <div className="space-y-4">
            {/* Gross income */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  Total gross trading income
                </label>
                <button
                  onClick={handlePeriodToggle}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Show {period === 'annual' ? 'monthly' : 'annual'}
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">£</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={displayGross || ''}
                  onChange={(e) => handleGrossChange(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] pl-7 pr-20 py-2.5 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">
                  per {period === 'annual' ? 'year' : 'month'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Gross = total sales/revenue BEFORE expenses. Combined across all platforms.
              </p>
            </div>

            {/* Platforms */}
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)] block mb-2">
                Which platforms do you sell on? <span className="text-[var(--text-muted)] font-normal">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    onClick={() => togglePlatform(p)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      platforms.includes(p)
                        ? 'bg-primary-500 text-white'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Expenses */}
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)] block mb-1">
                Total business expenses
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">£</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={expenses || ''}
                  onChange={(e) => setExpenses(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] pl-7 pr-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Materials, software, travel, postage, etc. Leave at 0 if you're not sure.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleAmountsSubmit}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              Check my allowance →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
