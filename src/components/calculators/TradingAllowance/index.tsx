import { useState, useEffect, useCallback } from 'react';
import { StepWizard, type WizardResult } from './StepWizard';
import { VerdictPanel } from './VerdictPanel';
import { checkTradingAllowance, type TradingAllowanceResult } from '../../../lib/calculators/tradingAllowanceChecker';
import { AVAILABLE_TAX_YEARS, DEFAULT_TAX_YEAR } from '../../../lib/tax-data/index';
import { TaxYearSelector } from '../TaxYearSelector';

const STORAGE_KEY = 'qht-trading-allowance-inputs';
const TAX_YEAR_KEY = 'qht-trading-allowance-tax-year';

function loadTaxYear(): string {
  if (typeof window === 'undefined') return DEFAULT_TAX_YEAR;
  try {
    const saved = localStorage.getItem(TAX_YEAR_KEY);
    if (saved && AVAILABLE_TAX_YEARS.includes(saved as typeof AVAILABLE_TAX_YEARS[number])) return saved;
  } catch { /* ignore */ }
  return DEFAULT_TAX_YEAR;
}

function saveTaxYear(year: string): void {
  try { localStorage.setItem(TAX_YEAR_KEY, year); } catch { /* ignore */ }
}

export default function TradingAllowanceChecker() {
  const [taxYear, setTaxYear] = useState<string>(DEFAULT_TAX_YEAR);
  const [result, setResult] = useState<TradingAllowanceResult | null>(null);
  const [showVerdict, setShowVerdict] = useState(false);

  useEffect(() => {
    const savedYear = loadTaxYear();
    setTaxYear(savedYear);
  }, []);

  const handleTaxYearChange = useCallback((year: string) => {
    setTaxYear(year);
    saveTaxYear(year);
    // Reset if already showing verdict
    if (showVerdict) {
      setShowVerdict(false);
      setResult(null);
    }
  }, [showVerdict]);

  const computeAndShow = useCallback((wizardResult: WizardResult) => {
    const r = checkTradingAllowance({
      ...wizardResult,
      hasOtherSelfAssessmentReason: false,
      taxYear,
    });
    setResult(r);
    setShowVerdict(true);
  }, [taxYear]);

  const handleReset = useCallback(() => {
    setShowVerdict(false);
    setResult(null);
  }, []);

  return (
    <div className="space-y-6">
      <TaxYearSelector value={taxYear} onChange={handleTaxYearChange} />

      {!showVerdict ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
          <StepWizard
            onComplete={computeAndShow}
            onEarlyExit={computeAndShow}
          />
        </div>
      ) : result ? (
        <VerdictPanel result={result} onReset={handleReset} />
      ) : null}
    </div>
  );
}
