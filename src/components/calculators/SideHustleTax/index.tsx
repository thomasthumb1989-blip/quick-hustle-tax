import { useState, useEffect, useCallback, useRef } from 'react';
import { InputsPanel } from './InputsPanel';
import { ResultsPanel } from './ResultsPanel';
import {
  calculateSideHustleTax,
  type SideHustleTaxInput,
  type SideHustleTaxResult,
} from '../../../lib/calculators/sideHustleTax';

const STORAGE_KEY = 'qht-side-hustle-inputs';

const defaultInputs: SideHustleTaxInput = {
  taxYear: '2025/26',
  region: 'EWN',
  employmentIncome: 30000,
  sideHustleGrossIncome: 5000,
  sideHustleExpenses: 200,
  claimMode: 'auto',
};

function loadInputs(): SideHustleTaxInput {
  if (typeof window === 'undefined') return defaultInputs;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultInputs, ...parsed };
    }
  } catch {
    // Ignore parse errors
  }
  return defaultInputs;
}

function saveInputs(inputs: SideHustleTaxInput): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  } catch {
    // Ignore storage errors
  }
}

export default function SideHustleTaxCalculator() {
  const [inputs, setInputs] = useState<SideHustleTaxInput>(defaultInputs);
  const [result, setResult] = useState<SideHustleTaxResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const initialised = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadInputs();
    setInputs(saved);
    setResult(calculateSideHustleTax(saved));
    initialised.current = true;
  }, []);

  const handleChange = useCallback((updates: Partial<SideHustleTaxInput>) => {
    setInputs((prev) => {
      const next = { ...prev, ...updates };

      // Debounced calculation
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const calculated = calculateSideHustleTax(next);
        setResult(calculated);
        saveInputs(next);
      }, 250);

      return next;
    });
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Inputs */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Your Income
        </h3>
        <InputsPanel inputs={inputs} onChange={handleChange} />
      </div>

      {/* Results */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Tax Estimate
        </h3>
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
  );
}
