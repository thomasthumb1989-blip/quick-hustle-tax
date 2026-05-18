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

describe('calculateSideHustleTax', () => {
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

    // PA £12,570 + basic band £37,700 = £50,270 threshold
    // Employment £45k: below threshold. Total £45k + £9k profit = £54k → crosses into higher rate
    expect(result.flags.crossesHigherRateThreshold).toBe(true);

    // Some tax should be at 40%
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

    // Total: £90k + £19k (after £1k allowance) = £109k → above £100k taper
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

    // Total: £120k + £29k = £149k → well above £125,140 where PA = 0
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

    // Total: £25k + £2k (after allowance) = £27k. All within basic rate.
    // Additional tax on side hustle = £2k * 20% = £400 income tax
    // Class 4 NI: £0 (profit £2k below £12,570 threshold)
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

    // Take-home = gross - expenses - tax owed
    expect(result.takeHomeFromSideHustle).toBe(
      5000 - 200 - result.additionalTaxOwedOnSideHustle
    );
  });

  it('12. Effective tax rate is between 0 and 1', () => {
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
