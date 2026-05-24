import { useState, useEffect, useCallback, useRef } from 'react';
import { InputsPanel } from './InputsPanel';
import { ResultsPanel } from './ResultsPanel';
import {
  calculateSelfAssessmentPenalty,
  type SelfAssessmentPenaltyInput,
  type SelfAssessmentPenaltyResult,
} from '../../../lib/calculators/selfAssessmentPenalty';
import { TaxYearSelector } from '../TaxYearSelector';

const STORAGE_KEY = 'qht-sa-penalty-inputs';

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const defaultInputs: SelfAssessmentPenaltyInput = {
  taxYear: '2025/26',
  hasFiledReturn: false,
  taxOwed: 0,
  hasPaidInFull: false,
  amountPaid: 0,
};

function loadInputs(): SelfAssessmentPenaltyInput {
  if (typeof window === 'undefined') return defaultInputs;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaultInputs, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return defaultInputs;
}

function saveInputs(inputs: SelfAssessmentPenaltyInput): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs)); } catch { /* ignore */ }
}

export default function SelfAssessmentPenaltyCalculator() {
  const [inputs, setInputs] = useState<SelfAssessmentPenaltyInput>(defaultInputs);
  const [result, setResult] = useState<SelfAssessmentPenaltyResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadInputs();
    // Set check date to today if not saved
    const withDate = { ...saved, checkDate: saved.checkDate || todayISO() };
    setInputs(withDate);
    setResult(calculateSelfAssessmentPenalty(withDate));
  }, []);

  const handleChange = useCallback((updates: Partial<SelfAssessmentPenaltyInput>) => {
    setInputs((prev) => {
      const next = { ...prev, ...updates };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setResult(calculateSelfAssessmentPenalty(next));
        saveInputs(next);
      }, 250);
      return next;
    });
  }, []);

  const handleTaxYearChange = useCallback((year: string) => {
    setInputs((prev) => {
      const next = { ...prev, taxYear: year as SelfAssessmentPenaltyInput['taxYear'] };
      setResult(calculateSelfAssessmentPenalty(next));
      saveInputs(next);
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
            Your Details
          </h2>
          <InputsPanel inputs={inputs} onChange={handleChange} />
        </div>

        {/* Results */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Penalty Estimate
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
