export interface TaxBand {
  from: number;
  to: number | null; // null = no upper limit
  rate: number; // 0.20 = 20%
}

export interface PersonalAllowance {
  amount: number;
  taperStart: number; // income at which taper begins
  taperRate: number; // £1 reduction per £X of income (2 = £1 per £2)
}

export interface TaxYearData {
  year: string; // "2025/26"
  region: 'EWN' | 'Scotland';
  personalAllowance: PersonalAllowance;
  incomeTaxBands: TaxBand[];
  niEmployeeBands: TaxBand[]; // Class 1 primary
  niSelfEmployedBands: TaxBand[]; // Class 4
  tradingAllowance: number;
}

export interface TaxDataService {
  getTaxYear(year: string, region: 'EWN' | 'Scotland'): TaxYearData;
  getAvailableYears(): string[];
}
