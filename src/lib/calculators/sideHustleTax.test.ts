import { describe, it, expect } from 'vitest';
import { calculateSideHustleTax } from './sideHustleTax.ts';
import type { SideHustleTaxInput } from './sideHustleTax.ts';

function makeInput(overrides: Partial<SideHustleTaxInput> = {}): SideHustleTaxInput {
  return {
    taxYear: '2025/26',
    region: 'EWN',
    employmentIncome: 30000,
    sideHustleGrossIncome: 5000,
    sideHustleExpenses: 200,
    claimMode: 'auto',
    ...overrides,
  };
}

describe('calculateSideHustleTax — 2025/26', () => {
  it('1. Side income £500, employment £30k → below trading allowance, no tax', () => {
    const result = calculateSideHustleTax(
      makeInput({ sideHustleGrossIncome: 500 })
    );

    expect(result.flags.belowTradingAllowance).toBe(true);
    expect(result.flags.requiresSelfAssessment).toBe(false);
    expect(result.additionalTaxOwedOnSideHustle).toBe(0);
    expect(result.takeHomeFromSideHustle).toBe(500);
  });

  it('2. Side income £5k, expenses £200, employment £30k → picks trading allowance (better than £200)', () => {
    const result = calculateSideHustleTax(
      makeInput({ sideHustleGrossIncome: 5000, sideHustleExpenses: 200 })
    );

    expect(result.claimedDeductionType).toBe('tradingAllowance');
    expect(result.claimedDeduction).toBe(1000);
    expect(result.sideHustleProfit).toBe(4000);
    expect(result.flags.requiresSelfAssessment).toBe(true);
    expect(result.additionalTaxOwedOnSideHustle).toBeGreaterThan(0);
  });

  it('3. Side income £5k, expenses £2k, employment £30k → picks actual expenses', () => {
    const result = calculateSideHustleTax(
      makeInput({ sideHustleGrossIncome: 5000, sideHustleExpenses: 2000 })
    );

    expect(result.claimedDeductionType).toBe('actualExpenses');
    expect(result.claimedDeduction).toBe(2000);
    expect(result.sideHustleProfit).toBe(3000);
  });

  it('4. Side income £10k, employment £45k → crosses higher rate band', () => {
    const result = calculateSideHustleTax(
      makeInput({
        employmentIncome: 45000,
        sideHustleGrossIncome: 10000,
        sideHustleExpenses: 0,
      })
    );

    expect(result.flags.crossesHigherRateThreshold).toBe(true);

    const higherRateBand = result.incomeTaxBreakdown.find((b) => b.rate === 0.4);
    expect(higherRateBand).toBeDefined();
    expect(higherRateBand!.tax).toBeGreaterThan(0);
  });

  it('5. Side income £20k, employment £90k → personal allowance taper', () => {
    const result = calculateSideHustleTax(
      makeInput({
        employmentIncome: 90000,
        sideHustleGrossIncome: 20000,
        sideHustleExpenses: 0,
      })
    );

    expect(result.flags.personalAllowanceTapered).toBe(true);
    expect(result.personalAllowanceUsed).toBeLessThan(12570);
  });

  it('6. Side income £30k, employment £120k → personal allowance fully tapered', () => {
    const result = calculateSideHustleTax(
      makeInput({
        employmentIncome: 120000,
        sideHustleGrossIncome: 30000,
        sideHustleExpenses: 0,
      })
    );

    expect(result.personalAllowanceUsed).toBe(0);
    expect(result.flags.personalAllowanceTapered).toBe(true);
  });

  it('7. Side income exactly £1,000 → below trading allowance', () => {
    const result = calculateSideHustleTax(
      makeInput({ sideHustleGrossIncome: 1000 })
    );

    expect(result.flags.belowTradingAllowance).toBe(true);
    expect(result.flags.requiresSelfAssessment).toBe(false);
    expect(result.additionalTaxOwedOnSideHustle).toBe(0);
    expect(result.takeHomeFromSideHustle).toBe(1000);
  });

  it('8. Side income £1,001 → must declare, gets full trading allowance deduction', () => {
    const result = calculateSideHustleTax(
      makeInput({ sideHustleGrossIncome: 1001, sideHustleExpenses: 0 })
    );

    expect(result.flags.belowTradingAllowance).toBe(false);
    expect(result.flags.requiresSelfAssessment).toBe(true);
    expect(result.claimedDeductionType).toBe('tradingAllowance');
    expect(result.claimedDeduction).toBe(1000);
    expect(result.sideHustleProfit).toBe(1);
  });

  it('9. Basic rate only: employment £25k, side £3k → all at 20%', () => {
    const result = calculateSideHustleTax(
      makeInput({
        employmentIncome: 25000,
        sideHustleGrossIncome: 3000,
        sideHustleExpenses: 0,
      })
    );

    expect(result.additionalTaxOwedOnSideHustle).toBe(400);
    expect(result.totalClass4NI).toBe(0);
  });

  it('10. Zero side hustle income → no tax', () => {
    const result = calculateSideHustleTax(
      makeInput({ sideHustleGrossIncome: 0, sideHustleExpenses: 0 })
    );

    expect(result.flags.belowTradingAllowance).toBe(true);
    expect(result.additionalTaxOwedOnSideHustle).toBe(0);
    expect(result.takeHomeFromSideHustle).toBe(0);
  });

  it('11. Take-home calculation accounts for expenses', () => {
    const result = calculateSideHustleTax(
      makeInput({
        employmentIncome: 30000,
        sideHustleGrossIncome: 5000,
        sideHustleExpenses: 200,
      })
    );

    expect(result.takeHomeFromSideHustle).toBe(
      5000 - 200 - result.additionalTaxOwedOnSideHustle
    );
  });

  it('12. Below trading allowance still reports correct totalIncomeTax and breakdown', () => {
    const result = calculateSideHustleTax(
      makeInput({ sideHustleGrossIncome: 500, sideHustleExpenses: 0 })
    );

    expect(result.flags.belowTradingAllowance).toBe(true);
    expect(result.additionalTaxOwedOnSideHustle).toBe(0);
    expect(result.totalIncomeTax).toBe(result.taxOnEmploymentOnly);
    expect(result.totalIncomeTax).toBeGreaterThan(0);
    expect(result.incomeTaxBreakdown.length).toBeGreaterThanOrEqual(1);
    expect(result.incomeTaxBreakdown[0].rate).toBe(0.2);
  });

  it('13. Effective tax rate is between 0 and 1', () => {
    const result = calculateSideHustleTax(
      makeInput({
        employmentIncome: 50000,
        sideHustleGrossIncome: 15000,
        sideHustleExpenses: 500,
      })
    );

    expect(result.effectiveTaxRateOnSideHustle).toBeGreaterThan(0);
    expect(result.effectiveTaxRateOnSideHustle).toBeLessThan(1);
  });
});

describe('calculateSideHustleTax — 2026/27', () => {
  function make2627(overrides: Partial<SideHustleTaxInput> = {}): SideHustleTaxInput {
    return {
      taxYear: '2026/27',
      region: 'EWN',
      employmentIncome: 30000,
      sideHustleGrossIncome: 5000,
      sideHustleExpenses: 200,
      claimMode: 'auto',
      ...overrides,
    };
  }

  it('basic scenario: £30k + £5k side hustle + £200 expenses produces correct result', () => {
    const result = calculateSideHustleTax(make2627());

    // Trading allowance still £1,000, better than £200 expenses
    expect(result.claimedDeductionType).toBe('tradingAllowance');
    expect(result.claimedDeduction).toBe(1000);
    expect(result.sideHustleProfit).toBe(4000);
    expect(result.flags.requiresSelfAssessment).toBe(true);
    // Same tax bands as 2025/26 so additional tax should be same
    expect(result.additionalTaxOwedOnSideHustle).toBeGreaterThan(0);
  });

  it('below trading allowance works same in 2026/27', () => {
    const result = calculateSideHustleTax(make2627({ sideHustleGrossIncome: 500 }));
    expect(result.flags.belowTradingAllowance).toBe(true);
    expect(result.additionalTaxOwedOnSideHustle).toBe(0);
  });

  it('higher rate crossing works in 2026/27', () => {
    const result = calculateSideHustleTax(make2627({
      employmentIncome: 45000,
      sideHustleGrossIncome: 10000,
      sideHustleExpenses: 0,
    }));

    expect(result.flags.crossesHigherRateThreshold).toBe(true);
    const higherRateBand = result.incomeTaxBreakdown.find((b) => b.rate === 0.4);
    expect(higherRateBand).toBeDefined();
  });
});
