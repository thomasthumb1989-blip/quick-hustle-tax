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

export interface StudentLoanPlan {
  threshold: number;
  rate: number;
}

export interface PensionRates {
  qualifyingEarningsLower: number;
  qualifyingEarningsUpper: number;
  defaultEmployeeRate: number;
  defaultEmployerRate: number;
}

export interface DividendTax {
  allowance: number;
  basic: number;
  higher: number;
  additional: number;
}

export interface TaxYearData {
  year: string; // "2025/26" or "2026/27"
  region: 'EWN' | 'Scotland';
  personalAllowance: PersonalAllowance;
  incomeTaxBands: TaxBand[];
  niEmployeeBands: TaxBand[]; // Class 1 primary
  niSelfEmployedBands: TaxBand[]; // Class 4
  tradingAllowance: number;
  studentLoan: {
    plan1: StudentLoanPlan;
    plan2: StudentLoanPlan;
    plan4: StudentLoanPlan;
    plan5: StudentLoanPlan;
    postgrad: StudentLoanPlan;
  };
  pension: PensionRates;
  dividendTax: DividendTax;
}

export interface TaxDataService {
  getTaxYear(year: string, region: 'EWN' | 'Scotland'): TaxYearData;
  getAvailableYears(): string[];
}
