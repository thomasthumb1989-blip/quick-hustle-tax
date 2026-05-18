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
    ...overrides,
  };
}

describe('calculateTakeHomePay', () => {
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

    // Qualifying earnings: min(55000, 50270) - 6240 = 44030
    expect(r.pensionableEarnings).toBe(44030);
    expect(r.pensionContribution).toBe(2201.50);

    // Tax on full 55000: PA 12570, taxable 42430
    // Basic: 37700 * 0.20 = 7540, Higher: 4730 * 0.40 = 1892
    expect(r.incomeTax).toBe(9432);

    // NI: (50270-12570)*0.08 + (55000-50270)*0.02 = 3016 + 94.60
    expect(r.nationalInsurance).toBe(3110.60);

    // Take-home: 55000 - 9432 - 3110.60 - 2201.50
    expect(r.annualTakeHome).toBe(40255.90);
  });

  it('Scenario C: £55,000 with 5% salary sacrifice pension', () => {
    const r = calculateTakeHomePay(makeInput({
      annualGrossSalary: 55000,
      pensionContributionPercent: 5,
      pensionType: 'salary-sacrifice',
    }));

    // Sacrifice = 55000 * 5% = 2750. Adjusted gross = 52250
    expect(r.pensionContribution).toBe(2750);

    // Taxable: 52250 - 12570 = 39680
    // Basic: 37700 * 0.20 = 7540, Higher: 1980 * 0.40 = 792
    expect(r.incomeTax).toBe(8332);

    // NI on 52250: (50270-12570)*0.08 + (52250-50270)*0.02 = 3016 + 39.60
    expect(r.nationalInsurance).toBe(3055.60);

    // Take-home: 52250 - 8332 - 3055.60 = 40862.40
    expect(r.annualTakeHome).toBe(40862.40);
  });

  it('Scenario D: £120,000 PA taper', () => {
    const r = calculateTakeHomePay(makeInput({
      annualGrossSalary: 120000,
    }));

    // PA taper: (120000-100000)/2 = 10000 reduction. PA = 12570-10000 = 2570
    expect(r.personalAllowance).toBe(2570);

    // Taxable: 120000 - 2570 = 117430
    // Basic: 37700*0.20=7540, Higher: (125140-37700)=87440 but only 117430-37700=79730 at 40%
    // Wait: bands are relative to taxable income.
    // Band 1: 0-37700 at 20% = 7540
    // Band 2: 37700-125140 (width 87440). 117430-37700=79730 in band. 79730*0.40=31892
    // No additional rate (117430 < 125140)
    // Basic: 37700*0.20=7540, Higher: 74870*0.40=29948, Additional: 4860*0.45=2187
    expect(r.incomeTax).toBe(39675);

    // NI: (50270-12570)*0.08 + (120000-50270)*0.02 = 3016 + 1394.60 = 4410.60
    expect(r.nationalInsurance).toBe(4410.60);

    // Take-home: 120000 - 39675 - 4410.60 = 75914.40
    expect(r.annualTakeHome).toBe(75914.40);
  });

  it('Scenario E: £40,000 with Plan 2 + Postgraduate student loans', () => {
    const r = calculateTakeHomePay(makeInput({
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

    // Tax: (40000-12570)=27430 taxable, all basic = 27430*0.20 = 5486
    expect(r.incomeTax).toBe(5486);

    // NI: (40000-12570)*0.08 = 2194.40
    expect(r.nationalInsurance).toBe(2194.40);

    // Take-home: 40000 - 5486 - 2194.40 - 2177.70 = 30141.90
    expect(r.annualTakeHome).toBe(30141.90);
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

    // All income at 20%
    expect(r.incomeTax).toBe(6000);
    // NI unchanged
    expect(r.nationalInsurance).toBe(1394.40);
    // Take-home: 30000 - 6000 - 1394.40
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
    // K475 means PA = -4750, taxable = 30000 + 4750 = 34750
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

    // Salary sacrifice should give higher take-home
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
});
