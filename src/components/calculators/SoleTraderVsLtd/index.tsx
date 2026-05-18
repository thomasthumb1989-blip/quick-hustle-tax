import { useState, useEffect, useCallback, useRef } from 'react';
import { InputsPanel } from './InputsPanel';
import { ComparisonPanel } from './ComparisonPanel';
import {
  calculateSoleTraderVsLtd,
  type SoleTraderVsLtdInput,
  type SoleTraderVsLtdResult,
} from '../../../lib/calculators/soleTraderVsLtd';
import type { Period } from '../../../lib/calculators/periodConversion';
import { convertForToggle, toAnnual } from '../../../lib/calculators/periodConversion';
import { AVAILABLE_TAX_YEARS, DEFAULT_TAX_YEAR } from '../../../lib/tax-data/index';
import { TaxYearSelector } from '../TaxYearSelector';

const STORAGE_KEY = 'qht-sole-trader-vs-ltd-inputs';
const TAX_YEAR_KEY = 'qht-sole-trader-vs-ltd-tax-year';

interface StoredInputs {
  annualProfit: number;
  hasEmploymentAllowance: boolean;
  accountingCosts: number;
  profitPeriod: Period;
}

const defaultStored: StoredInputs = {
  annualProfit: 50000,
  hasEmploymentAllowance: false,
  accountingCosts: 1200,
  profitPeriod: 'annual',
};

function loadInputs(): StoredInputs {
  if (typeof window === 'undefined') return defaultStored;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaultStored, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return defaultStored;
}

function loadTaxYear(): string {
  if (typeof window === 'undefined') return DEFAULT_TAX_YEAR;
  try {
    const saved = localStorage.getItem(TAX_YEAR_KEY);
    if (saved && AVAILABLE_TAX_YEARS.includes(saved as typeof AVAILABLE_TAX_YEARS[number])) return saved;
  } catch { /* ignore */ }
  return DEFAULT_TAX_YEAR;
}

function saveInputs(inputs: StoredInputs): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs)); } catch { /* ignore */ }
}

function saveTaxYear(year: string): void {
  try { localStorage.setItem(TAX_YEAR_KEY, year); } catch { /* ignore */ }
}

export default function SoleTraderVsLtdCalculator() {
  const [stored, setStored] = useState<StoredInputs>(defaultStored);
  const [taxYear, setTaxYear] = useState<string>(DEFAULT_TAX_YEAR);
  const [displayProfit, setDisplayProfit] = useState(defaultStored.annualProfit);
  const [result, setResult] = useState<SoleTraderVsLtdResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const compute = useCallback((inputs: StoredInputs, year: string) => {
    const calcInput: SoleTraderVsLtdInput = {
      annualProfit: inputs.annualProfit,
      hasEmploymentAllowance: inputs.hasEmploymentAllowance,
      accountingCosts: inputs.accountingCosts,
      taxYear: year,
    };
    setResult(calculateSoleTraderVsLtd(calcInput));
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const savedInputs = loadInputs();
    const savedTaxYear = loadTaxYear();
    setStored(savedInputs);
    setTaxYear(savedTaxYear);
    setDisplayProfit(
      savedInputs.profitPeriod === 'monthly'
        ? Math.round(savedInputs.annualProfit / 12)
        : savedInputs.annualProfit
    );
    compute(savedInputs, savedTaxYear);
  }, [compute]);

  const scheduleCompute = useCallback((inputs: StoredInputs, year: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      compute(inputs, year);
      saveInputs(inputs);
    }, 250);
  }, [compute]);

  const handleProfitChange = useCallback((annualValue: number) => {
    setStored((prev) => {
      const next = { ...prev, annualProfit: annualValue };
      scheduleCompute(next, taxYear);
      return next;
    });
  }, [scheduleCompute, taxYear]);

  const handlePeriodChange = useCallback((newPeriod: Period) => {
    setStored((prev) => {
      const oldPeriod = prev.profitPeriod;
      if (oldPeriod === newPeriod) return prev;
      const next = { ...prev, profitPeriod: newPeriod };
      saveInputs(next);
      setDisplayProfit((d) => convertForToggle(d, oldPeriod, newPeriod));
      return next;
    });
  }, []);

  const handleEAChange = useCallback((value: boolean) => {
    setStored((prev) => {
      const next = { ...prev, hasEmploymentAllowance: value };
      compute(next, taxYear);
      saveInputs(next);
      return next;
    });
  }, [compute, taxYear]);

  const handleAccountingCostsChange = useCallback((value: number) => {
    setStored((prev) => {
      const next = { ...prev, accountingCosts: value };
      scheduleCompute(next, taxYear);
      return next;
    });
  }, [scheduleCompute, taxYear]);

  const handleTaxYearChange = useCallback((year: string) => {
    setTaxYear(year);
    saveTaxYear(year);
    compute(stored, year);
    saveInputs(stored);
  }, [compute, stored]);

  return (
    <div className="space-y-6">
      <TaxYearSelector
        value={taxYear}
        onChange={handleTaxYearChange}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inputs — 1 col */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Your Business
          </h2>
          <InputsPanel
            annualProfit={stored.annualProfit}
            displayProfit={displayProfit}
            profitPeriod={stored.profitPeriod}
            hasEmploymentAllowance={stored.hasEmploymentAllowance}
            accountingCosts={stored.accountingCosts}
            onProfitChange={handleProfitChange}
            onDisplayProfitChange={setDisplayProfit}
            onPeriodChange={handlePeriodChange}
            onEAChange={handleEAChange}
            onAccountingCostsChange={handleAccountingCostsChange}
          />
        </div>

        {/* Results — 2 cols */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Tax Comparison
          </h2>
          {result ? (
            <ComparisonPanel result={result} />
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
