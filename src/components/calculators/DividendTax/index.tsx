import { useState, useEffect, useCallback, useRef } from 'react';
import { InputsPanel } from './InputsPanel';
import { ResultsPanel } from './ResultsPanel';
import { calculateDividendTax, type DividendTaxInput, type DividendTaxResult } from '../../../lib/calculators/dividendTax';
import { AVAILABLE_TAX_YEARS, DEFAULT_TAX_YEAR } from '../../../lib/tax-data/index';
import { TaxYearSelector } from '../TaxYearSelector';

const STORAGE_KEY = 'qht-dividend-tax-inputs';
const TAX_YEAR_KEY = 'qht-dividend-tax-year';

const defaultInputs = {
  otherIncome: 12570,
  dividendIncome: 30000,
};

function loadInputs(): typeof defaultInputs {
  if (typeof window === 'undefined') return defaultInputs;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaultInputs, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return defaultInputs;
}

function loadTaxYear(): string {
  if (typeof window === 'undefined') return DEFAULT_TAX_YEAR;
  try {
    const saved = localStorage.getItem(TAX_YEAR_KEY);
    if (saved && AVAILABLE_TAX_YEARS.includes(saved as typeof AVAILABLE_TAX_YEARS[number])) return saved;
  } catch { /* ignore */ }
  return DEFAULT_TAX_YEAR;
}

function saveInputs(inputs: typeof defaultInputs): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs)); } catch { /* ignore */ }
}

function saveTaxYear(year: string): void {
  try { localStorage.setItem(TAX_YEAR_KEY, year); } catch { /* ignore */ }
}

export default function DividendTaxCalculator() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [taxYear, setTaxYear] = useState(DEFAULT_TAX_YEAR);
  const [result, setResult] = useState<DividendTaxResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const savedInputs = loadInputs();
    const savedYear = loadTaxYear();
    setInputs(savedInputs);
    setTaxYear(savedYear);
    setResult(
      calculateDividendTax({
        taxYear: savedYear,
        otherIncome: savedInputs.otherIncome,
        dividendIncome: savedInputs.dividendIncome,
      })
    );
  }, []);

  const recalculate = useCallback((inp: typeof defaultInputs, year: string) => {
    const r = calculateDividendTax({
      taxYear: year,
      otherIncome: inp.otherIncome,
      dividendIncome: inp.dividendIncome,
    });
    setResult(r);
  }, []);

  const handleChange = useCallback((updates: Partial<typeof defaultInputs>) => {
    setInputs((prev) => {
      const next = { ...prev, ...updates };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        recalculate(next, taxYear);
        saveInputs(next);
      }, 250);
      return next;
    });
  }, [taxYear, recalculate]);

  const handleTaxYearChange = useCallback((year: string) => {
    setTaxYear(year);
    saveTaxYear(year);
    recalculate(inputs, year);
  }, [inputs, recalculate]);

  return (
    <div className="space-y-6">
      <TaxYearSelector value={taxYear} onChange={handleTaxYearChange} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Your Income
          </h2>
          <InputsPanel inputs={inputs} onChange={handleChange} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Dividend Tax
          </h2>
          {result ? (
            <ResultsPanel result={result} />
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
