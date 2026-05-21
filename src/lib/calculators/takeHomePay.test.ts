import { describe, it, expect } from 'vitest';
import { calculateTakeHomePay } from './takeHomePay.ts';
import type { TakeHomePayInput } from './takeHomePay.ts';

function makeInput(overrides: Partial<TakeHomePayInput> = {}): TakeHomePayInput {
  return {
    annualGrossSalary: 30000,
    pensionContributionPercent: 5,
    pensionType: 'none',
    studentLoanPlans: [],
    taxCode: '1257L',
    isOverStatePensionAge: false,
    taxYear: '2026/27',
    ...overrides,
  };
}

describe('calculateTakeHomePay — 2026/27', () => {
  it('Scenario A: £30,000 basic earner, no extras', () => {
    const r = calculateTakeHomePay(makeInput({ annualGrossSalary: 30000 }));

    expect(r.personalAllowance).toBe(12570);
    expect(r.taxableIncome).toBe(17430);
    expect(r.incomeTax).toBe(3486);
    expect(r.nationalInsurance).toBe(1394.40);
    expect(r.annualTakeHome).toBe(25119.60);
    expect(r.monthlyTakeHome).toBeCloseTo(2093.30, 0);
  });

  it('Scenario B: £55,000 higher rate earner with 5% auto-enrolment pension', () => {
    const r = calculateTakeHomePay(makeInput({
      annualGrossSalary: 55000,
      pensionContributionPercent: 5,
      pensionType: 'auto-enrolment',
    }));

    expect(r.pensionableEarnings).toBe(44030);
    expect(r.pensionContribution).toBe(2201.50);
    expect(r.incomeTax).toBe(9432);
    expect(r.nationalInsurance).toBe(3110.60);
    expect(r.annualTakeHome).toBe(40255.90);
  });

  it('Scenario C: £55,000 with 5% salary sacrifice pension', () => {
    const r = calculateTakeHomePay(makeInput({
      annualGrossSalary: 55000,
      pensionContributionPercent: 5,
      pensionType: 'salary-sacrifice',
    }));

    expect(r.pensionContribution).toBe(2750);
    expect(r.incomeTax).toBe(8332);
    expect(r.nationalInsurance).toBe(3055.60);
    expect(r.annualTakeHome).toBe(40862.40);
  });

  it('Scenario D: £120,000 PA taper', () => {
    const r = calculateTakeHomePay(makeInput({
      annualGrossSalary: 120000,
    }));

    expect(r.personalAllowance).toBe(2570);
    // With PA taper fix: adjusted bands → additional starts at taxable 122570 not 112570
    // Basic: 37700 * 0.20 = 7540, Higher: 79730 * 0.40 = 31892, Total: 39432
    expect(r.incomeTax).toBe(39432);
    expect(r.nationalInsurance).toBe(4410.60);
    expect(r.annualTakeHome).toBe(76157.40);
  });

  it('Scenario E: £40,000 with Plan 2 + Postgraduate student loans (2026/27 thresholds)', () => {
    const r = calculateTakeHomePay(makeInput({
      annualGrossSalary: 40000,
      studentLoanPlans: ['plan2', 'postgraduate'],
    }));

    // Plan 2: (40000-29385)*0.09 = 955.35
    // Postgrad: (40000-21000)*0.06 = 1140
    expect(r.studentLoanDeductions).toEqual([
      { plan: 'Plan 2', deduction: 955.35 },
      { plan: 'Postgraduate', deduction: 1140 },
    ]);
    expect(r.totalStudentLoan).toBe(2095.35);

    expect(r.incomeTax).toBe(5486);
    expect(r.nationalInsurance).toBe(2194.40);
    // Take-home: 40000 - 5486 - 2194.40 - 2095.35 = 30224.25
    expect(r.annualTakeHome).toBe(30224.25);
  });

  it('Scenario F: £10,000 below PA', () => {
    const r = calculateTakeHomePay(makeInput({
      annualGrossSalary: 10000,
    }));

    expect(r.incomeTax).toBe(0);
    expect(r.nationalInsurance).toBe(0);
    expect(r.annualTakeHome).toBe(10000);
  });

  it('Scenario G: £30,000 over State Pension age', () => {
    const r = calculateTakeHomePay(makeInput({
      annualGrossSalary: 30000,
      isOverStatePensionAge: true,
    }));

    expect(r.incomeTax).toBe(3486);
    expect(r.nationalInsurance).toBe(0);
    expect(r.annualTakeHome).toBe(26514);
  });

  it('Scenario H: £30,000 BR tax code', () => {
    const r = calculateTakeHomePay(makeInput({
      annualGrossSalary: 30000,
      taxCode: 'BR',
    }));

    expect(r.incomeTax).toBe(6000);
    expect(r.nationalInsurance).toBe(1394.40);
    expect(r.annualTakeHome).toBe(22605.60);
  });

  it('handles D0 tax code (all at 40%)', () => {
    const r = calculateTakeHomePay(makeInput({
      annualGrossSalary: 30000,
      taxCode: 'D0',
    }));
    expect(r.incomeTax).toBe(12000);
  });

  it('handles NT tax code (no tax)', () => {
    const r = calculateTakeHomePay(makeInput({
      annualGrossSalary: 30000,
      taxCode: 'NT',
    }));
    expect(r.incomeTax).toBe(0);
  });

  it('handles K tax code (negative PA)', () => {
    const r = calculateTakeHomePay(makeInput({
      annualGrossSalary: 30000,
      taxCode: 'K475',
    }));
    expect(r.personalAllowance).toBe(-4750);
    expect(r.taxableIncome).toBe(34750);
  });

  it('salary sacrifice saves vs auto-enrolment', () => {
    const autoEnrol = calculateTakeHomePay(makeInput({
      annualGrossSalary: 55000,
      pensionContributionPercent: 5,
      pensionType: 'auto-enrolment',
    }));
    const salSac = calculateTakeHomePay(makeInput({
      annualGrossSalary: 55000,
      pensionContributionPercent: 5,
      pensionType: 'salary-sacrifice',
    }));

    expect(salSac.annualTakeHome).toBeGreaterThan(autoEnrol.annualTakeHome);
  });

  it('marginal rate is between 0 and 1', () => {
    const r = calculateTakeHomePay(makeInput({ annualGrossSalary: 50000 }));
    expect(r.marginalTaxRate).toBeGreaterThanOrEqual(0);
    expect(r.marginalTaxRate).toBeLessThanOrEqual(1);
  });

  it('effective tax rate is between 0 and 1', () => {
    const r = calculateTakeHomePay(makeInput({ annualGrossSalary: 50000 }));
    expect(r.effectiveTaxRate).toBeGreaterThan(0);
    expect(r.effectiveTaxRate).toBeLessThan(1);
  });

  // 2026/27-specific: verify Plan 1 threshold £26,900
  it('Plan 1 student loan uses 2026/27 threshold £26,900', () => {
    const r = calculateTakeHomePay(makeInput({
      annualGrossSalary: 30000,
      studentLoanPlans: ['plan1'],
    }));
    // (30000 - 26900) * 0.09 = 279
    expect(r.studentLoanDeductions[0].deduction).toBe(279);
  });

  // 2026/27-specific: verify Plan 4 threshold £33,795
  it('Plan 4 student loan uses 2026/27 threshold £33,795', () => {
    const r = calculateTakeHomePay(makeInput({
      annualGrossSalary: 40000,
      studentLoanPlans: ['plan4'],
    }));
    // (40000 - 33795) * 0.09 = 558.45
    expect(r.studentLoanDeductions[0].deduction).toBe(558.45);
  });
});

describe('calculateTakeHomePay — 2025/26 backward compat', () => {
  function make2526(overrides: Partial<TakeHomePayInput> = {}): TakeHomePayInput {
    return {
      annualGrossSalary: 30000,
      pensionContributionPercent: 5,
      pensionType: 'none',
      studentLoanPlans: [],
      taxCode: '1257L',
      isOverStatePensionAge: false,
      taxYear: '2025/26',
      ...overrides,
    };
  }

  it('basic £30k scenario matches 2025/26 rates', () => {
    const r = calculateTakeHomePay(make2526({ annualGrossSalary: 30000 }));
    expect(r.incomeTax).toBe(3486);
    expect(r.nationalInsurance).toBe(1394.40);
    expect(r.annualTakeHome).toBe(25119.60);
  });

  it('Plan 2 uses 2025/26 threshold £28,470', () => {
    const r = calculateTakeHomePay(make2526({
      annualGrossSalary: 40000,
      studentLoanPlans: ['plan2', 'postgraduate'],
    }));
    // Plan 2: (40000-28470)*0.09 = 1037.70
    // Postgrad: (40000-21000)*0.06 = 1140
    expect(r.studentLoanDeductions).toEqual([
      { plan: 'Plan 2', deduction: 1037.70 },
      { plan: 'Postgraduate', deduction: 1140 },
    ]);
    expect(r.totalStudentLoan).toBe(2177.70);
  });

  it('Plan 1 uses 2025/26 threshold £26,065', () => {
    const r = calculateTakeHomePay(make2526({
      annualGrossSalary: 30000,
      studentLoanPlans: ['plan1'],
    }));
    // (30000 - 26065) * 0.09 = 354.15
    expect(r.studentLoanDeductions[0].deduction).toBe(354.15);
  });
});
