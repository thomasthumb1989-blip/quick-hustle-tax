import { useState, useEffect, useCallback, useRef } from 'react';
import { InputsPanel, type InputValues } from './InputsPanel';
import { ResultsPanel } from './ResultsPanel';
import { calculateGrowthTracker } from '../../../lib/calculators/growthTracker';

const STORAGE_KEY = 'qht-growth-tracker-inputs';

const DEFAULT_VALUES: InputValues = {
  targetAmount: 1000,
  targetType: 'profit',
  targetPeriod: 'monthly',
  sellingPrice: 15,
  costPerItem: 5,
  shippingCostPerItem: 3,
  platform: 'etsy',
  hoursPerWeek: undefined,
  currentMonthlySales: undefined,
};

function loadInputs(): InputValues {
  if (typeof window === 'undefined') return DEFAULT_VALUES;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_VALUES, ...parsed };
    }
  } catch { /* ignore */ }
  return DEFAULT_VALUES;
}

function saveInputs(values: InputValues): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch { /* ignore */ }
}

export default function GrowthTracker() {
  const [values, setValues] = useState<InputValues>(DEFAULT_VALUES);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setValues(loadInputs());
  }, []);

  const handleChange = useCallback((newValues: InputValues) => {
    setValues(newValues);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveInputs(newValues), 250);
  }, []);

  const result = calculateGrowthTracker({
    targetAmount: values.targetAmount,
    targetType: values.targetType,
    targetPeriod: values.targetPeriod,
    sellingPrice: values.sellingPrice,
    costPerItem: values.costPerItem,
    shippingCostPerItem: values.shippingCostPerItem,
    platform: values.platform,
    hoursPerWeek: values.hoursPerWeek,
    currentMonthlySales: values.currentMonthlySales,
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Inputs */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
        <InputsPanel values={values} onChange={handleChange} />
      </div>

      {/* Results */}
      <div>
        <ResultsPanel
          result={result}
          targetType={values.targetType}
          targetPeriod={values.targetPeriod}
        />
      </div>
    </div>
  );
}
