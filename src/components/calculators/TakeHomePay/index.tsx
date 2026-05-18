import { useState, useEffect, useCallback, useRef } from 'react';
import { InputsPanel } from './InputsPanel';
import { ResultsPanel } from './ResultsPanel';
import {
  calculateTakeHomePay,
  type TakeHomePayInput,
  type TakeHomePayResult,
} from '../../../lib/calculators/takeHomePay';
import type { Period } from '../../../lib/calculators/periodConversion';
import { convertForToggle, toAnnual } from '../../../lib/calculators/periodConversion';
import { AVAILABLE_TAX_YEARS, DEFAULT_TAX_YEAR } from '../../../lib/tax-data/index';
import { TaxYearSelector } from '../TaxYearSelector';

const STORAGE_KEY = 'qht-take-home-pay-inputs';
const PERIOD_KEY = 'qht-take-home-pay-period';
const TAX_YEAR_KEY = 'qht-take-home-pay-tax-year';

const defaultInputs: TakeHomePayInput = {
  annualGrossSalary: 30000,
  pensionContributionPercent: 5,
  pensionType: 'auto-enrolment',
  studentLoanPlans: [],
  taxCode: '1257L',
  isOverStatePensionAge: false,
  taxYear: DEFAULT_TAX_YEAR,
};

function loadInputs(): TakeHomePayInput {
  if (typeof window === 'undefined') return defaultInputs;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaultInputs, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return defaultInputs;
}

function loadPeriod(): Period {
  if (typeof window === 'undefined') return 'annual';
  try {
    const saved = localStorage.getItem(PERIOD_KEY);
    if (saved === 'monthly') return 'monthly';
  } catch { /* ignore */ }
  return 'annual';
}

function loadTaxYear(): string {
  if (typeof window === 'undefined') return DEFAULT_TAX_YEAR;
  try {
    const saved = localStorage.getItem(TAX_YEAR_KEY);
    if (saved && AVAILABLE_TAX_YEARS.includes(saved as typeof AVAILABLE_TAX_YEARS[number])) return saved;
  } catch { /* ignore */ }
  return DEFAULT_TAX_YEAR;
}

function saveInputs(inputs: TakeHomePayInput): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs)); } catch { /* ignore */ }
}

function savePeriod(period: Period): void {
  try { localStorage.setItem(PERIOD_KEY, period); } catch { /* ignore */ }
}

function saveTaxYear(year: string): void {
  try { localStorage.setItem(TAX_YEAR_KEY, year); } catch { /* ignore */ }
}

export default function TakeHomePayCalculator() {
  const [inputs, setInputs] = useState<TakeHomePayInput>(defaultInputs);
  const [salaryPeriod, setSalaryPeriod] = useState<Period>('annual');
  const [displaySalary, setDisplaySalary] = useState(defaultInputs.annualGrossSalary);
  const [result, setResult] = useState<TakeHomePayResult | null>(null);
  const [autoEnrolTakeHome, setAutoEnrolTakeHome] = useState<number | undefined>(undefined);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load from localStorage on mount
  useEffect(() => {
    const savedInputs = loadInputs();
    const savedPeriod = loadPeriod();
    const savedTaxYear = loadTaxYear();
    const mergedInputs = { ...savedInputs, taxYear: savedTaxYear };
    setInputs(mergedInputs);
    setSalaryPeriod(savedPeriod);
    setDisplaySalary(
      savedPeriod === 'monthly'
        ? Math.round(mergedInputs.annualGrossSalary / 12)
        : mergedInputs.annualGrossSalary
    );
    const r = calculateTakeHomePay(mergedInputs);
    setResult(r);
    updateSalSacComparison(mergedInputs, r);
  }, []);

  function updateSalSacComparison(inp: TakeHomePayInput, res: TakeHomePayResult) {
    if (inp.pensionType === 'salary-sacrifice' && inp.pensionContributionPercent > 0) {
      const autoResult = calculateTakeHomePay({
        ...inp,
        pensionType: 'auto-enrolment',
      });
      setAutoEnrolTakeHome(autoResult.annualTakeHome);
    } else {
      setAutoEnrolTakeHome(undefined);
    }
  }

  const handleChange = useCallback((updates: Partial<TakeHomePayInput>) => {
    setInputs((prev) => {
      const next = { ...prev, ...updates };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const r = calculateTakeHomePay(next);
        setResult(r);
        updateSalSacComparison(next, r);
        saveInputs(next);
      }, 250);
      return next;
    });
  }, []);

  const handleTaxYearChange = useCallback((year: string) => {
    saveTaxYear(year);
    setInputs((prev) => {
      const next = { ...prev, taxYear: year };
      const r = calculateTakeHomePay(next);
      setResult(r);
      updateSalSacComparison(next, r);
      saveInputs(next);
      return next;
    });
  }, []);

  const handleDisplaySalaryChange = useCallback((value: number) => {
    setDisplaySalary(value);
  }, []);

  const handleSalaryPeriodChange = useCallback((newPeriod: Period) => {
    setSalaryPeriod((prev) => {
      if (prev === newPeriod) return prev;
      savePeriod(newPeriod);
      setDisplaySalary((prevDisplay) => convertForToggle(prevDisplay, prev, newPeriod));
      return newPeriod;
    });
  }, []);

  return (
    <div className="space-y-6">
      <TaxYearSelector
        value={inputs.taxYear ?? DEFAULT_TAX_YEAR}
        onChange={handleTaxYearChange}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Your Details
          </h2>
          <InputsPanel
            inputs={inputs}
            displaySalary={displaySalary}
            salaryPeriod={salaryPeriod}
            onChange={handleChange}
            onDisplaySalaryChange={handleDisplaySalaryChange}
            onSalaryPeriodChange={handleSalaryPeriodChange}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Your Take-Home Pay
          </h2>
          {result ? (
            <ResultsPanel
              result={result}
              autoEnrolmentTakeHome={autoEnrolTakeHome}
            />
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 text-center text-[var(--text-muted)]">
              <p>Calculating...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
