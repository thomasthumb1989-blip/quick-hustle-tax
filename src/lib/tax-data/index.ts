import type { TaxYearData, TaxDataService } from './types.ts';
import data2025 from '../../data/tax-rates-2025-26.json';

export type { TaxYearData, TaxBand, PersonalAllowance, TaxDataService } from './types.ts';

class JsonTaxDataService implements TaxDataService {
  getTaxYear(year: string, region: 'EWN' | 'Scotland'): TaxYearData {
    if (year === '2025/26' && region === 'EWN') {
      return data2025 as TaxYearData;
    }
    throw new Error(`Tax data not available for ${year} ${region}`);
  }

  getAvailableYears(): string[] {
    return ['2025/26'];
  }
}

export const taxData: TaxDataService = new JsonTaxDataService();

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
