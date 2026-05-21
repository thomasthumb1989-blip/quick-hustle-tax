import type { TaxYearData, TaxDataService } from './types.ts';
import data202526 from '../../data/tax-rates-2025-26.json';
import data202627 from '../../data/tax-rates-2026-27.json';

export type { TaxYearData, TaxBand, PersonalAllowance, StudentLoanPlan, PensionRates, DividendTax, CorporationTax, EmployerNI, SelfEmployedNI, TaxDataService, } from './types.ts';

const DATA_MAP: Record<string, unknown> = {
  '2025/26': data202526,
  '2026/27': data202627,
};

export const DEFAULT_TAX_YEAR = '2026/27';
export const AVAILABLE_TAX_YEARS = ['2026/27', '2025/26'] as const;

class JsonTaxDataService implements TaxDataService {
  getTaxYear(year: string, region: 'EWN' | 'Scotland'): TaxYearData {
    const data = DATA_MAP[year];
    if (data && region === 'EWN') {
      return data as TaxYearData;
    }
    throw new Error(`Tax data not available for ${year} ${region}`);
  }

  getAvailableYears(): string[] {
    return [...AVAILABLE_TAX_YEARS];
  }
}

export const taxData: TaxDataService = new JsonTaxDataService();

/** Gross income at which additional rate begins (constant, all years) */
const ADDITIONAL_RATE_GROSS_THRESHOLD = 125140;

/**
 * Adjust income tax bands for PA taper.
 * Raw JSON bands assume PA = default (12570), making higher/additional boundary
 * at taxable 112570. When PA is tapered, the boundary shifts to 125140 - actualPA.
 */
export function getAdjustedIncomeTaxBands(
  actualPA: number,
  taxYear: TaxYearData
): TaxBand[] {
  const defaultPA = taxYear.personalAllowance.amount;
  if (actualPA === defaultPA) return taxYear.incomeTaxBands;

  const additionalThreshold = ADDITIONAL_RATE_GROSS_THRESHOLD - actualPA;
  return taxYear.incomeTaxBands.map((band, i) => {
    if (i === 1 && band.to !== null) {
      // Higher band: from stays at 37700, to adjusts
      return { ...band, to: additionalThreshold };
    }
    if (i === 2) {
      // Additional band: from adjusts
      return { ...band, from: additionalThreshold };
    }
    return band;
  });
}

/** Calculate effective personal allowance after taper */
export function getEffectivePersonalAllowance(
  totalIncome: number,
  taxYear: TaxYearData
): number {
  const pa = taxYear.personalAllowance;
  if (totalIncome <= pa.taperStart) {
    return pa.amount;
  }
  const reduction = Math.floor((totalIncome - pa.taperStart) / pa.taperRate);
  return Math.max(0, pa.amount - reduction);
}
