import { useState, useEffect, useCallback, useRef } from 'react';
import { InputsPanel, type FieldPeriods } from './InputsPanel';
import { ResultsPanel } from './ResultsPanel';
import {
  calculateSideHustleTax,
  type SideHustleTaxInput,
  type SideHustleTaxResult,
} from '../../../lib/calculators/sideHustleTax';
import type { Period } from '../../../lib/calculators/periodConversion';
import { convertForToggle, toAnnual } from '../../../lib/calculators/periodConversion';
import { AVAILABLE_TAX_YEARS, DEFAULT_TAX_YEAR } from '../../../lib/tax-data/index';
import { TaxYearSelector } from '../TaxYearSelector';

const STORAGE_KEY = 'qht-side-hustle-inputs';
const PERIODS_KEY = 'qht-side-hustle-periods';
const TAX_YEAR_KEY = 'qht-side-hustle-tax-year';

const defaultInputs: SideHustleTaxInput = {
  taxYear: DEFAULT_TAX_YEAR,
  region: 'EWN',
  employmentIncome: 30000,
  sideHustleGrossIncome: 5000,
  sideHustleExpenses: 200,
  claimMode: 'auto',
};

const defaultPeriods: FieldPeriods = {
  employmentIncome: 'annual',
  sideHustleGrossIncome: 'annual',
  sideHustleExpenses: 'annual',
};

interface DisplayValues {
  employmentIncome: number;
  sideHustleGrossIncome: number;
  sideHustleExpenses: number;
}

function loadInputs(): SideHustleTaxInput {
  if (typeof window === 'undefined') return defaultInputs;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaultInputs, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return defaultInputs;
}

function loadPeriods(): FieldPeriods {
  if (typeof window === 'undefined') return defaultPeriods;
  try {
    const saved = localStorage.getItem(PERIODS_KEY);
    if (saved) return { ...defaultPeriods, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return defaultPeriods;
}

function loadTaxYear(): string {
  if (typeof window === 'undefined') return DEFAULT_TAX_YEAR;
  try {
    const saved = localStorage.getItem(TAX_YEAR_KEY);
    if (saved && AVAILABLE_TAX_YEARS.includes(saved as typeof AVAILABLE_TAX_YEARS[number])) return saved;
  } catch { /* ignore */ }
  return DEFAULT_TAX_YEAR;
}

function saveInputs(inputs: SideHustleTaxInput): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs)); } catch { /* ignore */ }
}

function savePeriods(periods: FieldPeriods): void {
  try { localStorage.setItem(PERIODS_KEY, JSON.stringify(periods)); } catch { /* ignore */ }
}

function saveTaxYear(year: string): void {
  try { localStorage.setItem(TAX_YEAR_KEY, year); } catch { /* ignore */ }
}

/** Derive display values from annual inputs + current periods */
function deriveDisplayValues(inputs: SideHustleTaxInput, periods: FieldPeriods): DisplayValues {
  return {
    employmentIncome: periods.employmentIncome === 'monthly'
      ? Math.round(inputs.employmentIncome / 12)
      : inputs.employmentIncome,
    sideHustleGrossIncome: periods.sideHustleGrossIncome === 'monthly'
      ? Math.round(inputs.sideHustleGrossIncome / 12)
      : inputs.sideHustleGrossIncome,
    sideHustleExpenses: periods.sideHustleExpenses === 'monthly'
      ? Math.round(inputs.sideHustleExpenses / 12)
      : inputs.sideHustleExpenses,
  };
}

export default function SideHustleTaxCalculator() {
  const [inputs, setInputs] = useState<SideHustleTaxInput>(defaultInputs);
  const [periods, setPeriods] = useState<FieldPeriods>(defaultPeriods);
  const [displayValues, setDisplayValues] = useState<DisplayValues>({
    employmentIncome: defaultInputs.employmentIncome,
    sideHustleGrossIncome: defaultInputs.sideHustleGrossIncome,
    sideHustleExpenses: defaultInputs.sideHustleExpenses,
  });
  const [result, setResult] = useState<SideHustleTaxResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load from localStorage on mount
  useEffect(() => {
    const savedInputs = loadInputs();
    const savedPeriods = loadPeriods();
    const savedTaxYear = loadTaxYear();
    const mergedInputs = { ...savedInputs, taxYear: savedTaxYear };
    setInputs(mergedInputs);
    setPeriods(savedPeriods);
    setDisplayValues(deriveDisplayValues(mergedInputs, savedPeriods));
    setResult(calculateSideHustleTax(mergedInputs));
  }, []);

  const handleChange = useCallback((updates: Partial<SideHustleTaxInput>) => {
    setInputs((prev) => {
      const next = { ...prev, ...updates };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setResult(calculateSideHustleTax(next));
        saveInputs(next);
      }, 250);
      return next;
    });
  }, []);

  const handleTaxYearChange = useCallback((year: string) => {
    saveTaxYear(year);
    setInputs((prev) => {
      const next = { ...prev, taxYear: year };
      setResult(calculateSideHustleTax(next));
      saveInputs(next);
      return next;
    });
  }, []);

  const handleDisplayChange = useCallback((field: keyof FieldPeriods, value: number) => {
    setDisplayValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handlePeriodChange = useCallback((field: keyof FieldPeriods, newPeriod: Period) => {
    setPeriods((prev) => {
      const oldPeriod = prev[field];
      if (oldPeriod === newPeriod) return prev;

      const next = { ...prev, [field]: newPeriod };
      savePeriods(next);

      // Convert display value
      setDisplayValues((prevDisplay) => {
        const converted = convertForToggle(prevDisplay[field], oldPeriod, newPeriod);
        return { ...prevDisplay, [field]: converted };
      });

      // Annual value stays the same — no need to recalculate
      return next;
    });
  }, []);

  return (
    <div className="space-y-6">
      <TaxYearSelector
        value={inputs.taxYear}
        onChange={handleTaxYearChange}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inputs */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Your Income
          </h2>
          <InputsPanel
            inputs={inputs}
            displayValues={displayValues}
            periods={periods}
            onChange={handleChange}
            onDisplayChange={handleDisplayChange}
            onPeriodChange={handlePeriodChange}
          />
        </div>

        {/* Results */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Tax Estimate
          </h2>
          {result ? (
            <ResultsPanel
              result={result}
              grossIncome={inputs.sideHustleGrossIncome}
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
