import taxRates202526 from '../../data/tax-rates-2025-26.json';

export interface TaxBand {
  rate: number;
  from: number;
  to: number | null;
}

export interface NationalInsuranceClass1 {
  primaryThreshold: number;
  upperEarningsLimit: number;
  rateBelow: number;
  rateAbove: number;
}

export interface NationalInsuranceClass4 {
  lowerProfitsLimit: number;
  upperProfitsLimit: number;
  rateBelow: number;
  rateAbove: number;
}

export interface TaxRates {
  taxYear: string;
  personalAllowance: number;
  personalAllowanceTaperThreshold: number;
  incomeTax: {
    basic: TaxBand;
    higher: TaxBand;
    additional: TaxBand;
  };
  nationalInsurance: {
    class1: NationalInsuranceClass1;
    class4: NationalInsuranceClass4;
    class2: { weeklyRate: number; smallProfitsThreshold: number };
  };
  dividendTax: {
    allowance: number;
    basic: number;
    higher: number;
    additional: number;
  };
  tradingAllowance: number;
  studentLoan: Record<string, { threshold: number; rate: number }>;
  corporationTax: {
    smallProfitsRate: number;
    smallProfitsLimit: number;
    mainRate: number;
    mainRateThreshold: number;
  };
}

export function getTaxRates(taxYear?: string): TaxRates {
  // v1: reads from local JSON. Interface designed for future API swap.
  if (!taxYear || taxYear === '2025/26') {
    return taxRates202526 as TaxRates;
  }
  throw new Error(`Tax year ${taxYear} not available. Only 2025/26 is supported.`);
}

export function getPersonalAllowance(totalIncome: number, taxYear?: string): number {
  const rates = getTaxRates(taxYear);
  if (totalIncome <= rates.personalAllowanceTaperThreshold) {
    return rates.personalAllowance;
  }
  const reduction = Math.floor((totalIncome - rates.personalAllowanceTaperThreshold) / 2);
  return Math.max(0, rates.personalAllowance - reduction);
}
