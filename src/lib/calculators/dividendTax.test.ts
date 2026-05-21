import { describe, it, expect } from 'vitest';
import { calculateDividendTax } from './dividendTax.ts';
import type { DividendTaxInput } from './dividendTax.ts';

function makeInput(overrides: Partial<DividendTaxInput> = {}): DividendTaxInput {
  return {
    taxYear: '2026/27',
    otherIncome: 30000,
    dividendIncome: 10000,
    ...overrides,
  };
}

describe('calculateDividendTax — 2026/27', () => {
  it('1. No salary, dividends within PA + allowance → £0 tax', () => {
    const r = calculateDividendTax(
      makeInput({ otherIncome: 0, dividendIncome: 13000 })
    );
    // PA covers £12,570, remaining £430 < £500 allowance
    expect(r.dividendsCoveredByPA).toBe(12570);
    expect(r.taxableDividends).toBe(430);
    expect(r.dividendAllowanceUsed).toBe(430);
    expect(r.totalDividendTax).toBe(0);
  });

  it('2. No salary, dividends exceeding PA → basic rate tax', () => {
    const r = calculateDividendTax(
      makeInput({ otherIncome: 0, dividendIncome: 20000 })
    );
    // PA: 12570, taxable: 7430
    // Allowance: 500 at 0%
    // Basic: 6930 at 10.75% = 744.98
    expect(r.dividendsCoveredByPA).toBe(12570);
    expect(r.taxableDividends).toBe(7430);
    expect(r.dividendAllowanceUsed).toBe(500);
    expect(r.totalDividendTax).toBeCloseTo(744.98, 1);
  });

  it('3. GOV.UK example — salary £29,570, dividends £3,000', () => {
    const r = calculateDividendTax(
      makeInput({ otherIncome: 29570, dividendIncome: 3000 })
    );
    // PA: 12570, taxable salary: 17000
    // Basic remaining: 37700 - 17000 = 20700
    // Allowance: 500 at 0%
    // Remaining: 2500 at 10.75% = 268.75
    expect(r.taxableOtherIncome).toBe(17000);
    expect(r.dividendAllowanceUsed).toBe(500);
    expect(r.totalDividendTax).toBeCloseTo(268.75, 1);
  });

  it('4. LITRG example — salary £40,650, dividends £10,000 (cross-band)', () => {
    const r = calculateDividendTax(
      makeInput({ otherIncome: 40650, dividendIncome: 10000 })
    );
    // PA: 12570, taxable salary: 28080
    // Basic remaining: 37700 - 28080 = 9620
    // Allowance: 500 at 0% (uses 500 of 9620 → 9120 left)
    // Basic: 9120 at 10.75% = 980.40
    // Higher: 380 at 35.75% = 135.85
    // Total: 1116.25
    expect(r.taxableOtherIncome).toBe(28080);
    expect(r.totalDividendTax).toBeCloseTo(1116.25, 1);

    // Check band breakdown
    const basicBand = r.dividendBandBreakdown.find(b => b.band === 'Basic rate');
    const higherBand = r.dividendBandBreakdown.find(b => b.band === 'Higher rate');
    expect(basicBand?.amount).toBeCloseTo(9120, 0);
    expect(basicBand?.tax).toBeCloseTo(980.40, 1);
    expect(higherBand?.amount).toBeCloseTo(380, 0);
    expect(higherBand?.tax).toBeCloseTo(135.85, 1);
  });

  it('5. Higher rate only — salary £50,270 fills basic band', () => {
    const r = calculateDividendTax(
      makeInput({ otherIncome: 50270, dividendIncome: 20000 })
    );
    // PA: 12570, taxable salary: 37700 (fills entire basic band)
    // All dividends in higher band
    // Allowance: 500 at 0%
    // Higher: 19500 at 35.75% = 6971.25
    expect(r.totalDividendTax).toBeCloseTo(6971.25, 1);
  });

  it('6. Additional rate — salary £130,000, dividends £20,000', () => {
    const r = calculateDividendTax(
      makeInput({ otherIncome: 130000, dividendIncome: 20000 })
    );
    // Total: 150000 → PA = max(0, 12570 - (150000-100000)/2) = 0
    // Taxable salary: 130000
    // Salary fills: 37700 basic + 74870 higher + 17430 additional
    // All dividends in additional band
    // Allowance: 500 at 0%
    // Additional: 19500 at 39.35% = 7673.25
    expect(r.personalAllowance).toBe(0);
    expect(r.personalAllowanceTapered).toBe(true);
    expect(r.totalDividendTax).toBeCloseTo(7673.25, 1);
  });

  it('7. PA taper — salary £90,000, dividends £20,000', () => {
    const r = calculateDividendTax(
      makeInput({ otherIncome: 90000, dividendIncome: 20000 })
    );
    // Total: 110000 → PA = 12570 - (110000-100000)/2 = 12570 - 5000 = 7570
    // Taxable salary: 90000 - 7570 = 82430
    // Basic: 37700, Higher: 82430 - 37700 = 44730
    // Higher remaining: 74870 - 44730 = 30140
    // All £20k dividends in higher band
    // Allowance: 500 at 0%
    // Higher: 19500 at 35.75% = 6971.25
    expect(r.personalAllowance).toBe(7570);
    expect(r.personalAllowanceTapered).toBe(true);
    expect(r.totalDividendTax).toBeCloseTo(6971.25, 1);
  });

  it('8. Zero dividends → £0 tax', () => {
    const r = calculateDividendTax(
      makeInput({ otherIncome: 30000, dividendIncome: 0 })
    );
    expect(r.totalDividendTax).toBe(0);
    expect(r.dividendBandBreakdown).toHaveLength(0);
    expect(r.effectiveDividendTaxRate).toBe(0);
  });

  it('9. Dividends exactly £500 (allowance boundary) → £0 tax', () => {
    const r = calculateDividendTax(
      makeInput({ otherIncome: 30000, dividendIncome: 500 })
    );
    // All covered by dividend allowance
    expect(r.totalDividendTax).toBe(0);
    expect(r.dividendAllowanceUsed).toBe(500);
  });

  it('10. All three bands — salary £45,000, dividends £90,000', () => {
    const r = calculateDividendTax(
      makeInput({ otherIncome: 45000, dividendIncome: 90000 })
    );
    // Total: 135000 → PA = max(0, 12570 - (135000-100000)/2) = max(0, 12570-17500) = 0
    // Taxable salary: 45000
    // Basic: 37700, Higher: 45000-37700 = 7300
    // Basic remaining: 0
    // higherBandWidth = 125140 - 0 - 37700 = 87440
    // Higher remaining: 87440 - 7300 = 80140
    // Allowance: 500 at 0% (from higher band → 79640 left)
    // Higher: 79640 at 35.75% = 28471.30
    // Additional: 90000 - 500 - 79640 = 9860 at 39.35% = 3879.91
    // Total: 32351.21
    expect(r.personalAllowance).toBe(0);
    expect(r.totalDividendTax).toBeCloseTo(28471.30 + 3879.91, 0);
  });
});

describe('calculateDividendTax — 2025/26', () => {
  it('11. GOV.UK example at 2025/26 rates', () => {
    const r = calculateDividendTax({
      taxYear: '2025/26',
      otherIncome: 29570,
      dividendIncome: 3000,
    });
    // Same structure, but 8.75% rate
    // 2500 at 8.75% = 218.75
    expect(r.totalDividendTax).toBeCloseTo(218.75, 1);
  });

  it('12. LITRG cross-band at 2025/26 rates', () => {
    const r = calculateDividendTax({
      taxYear: '2025/26',
      otherIncome: 40650,
      dividendIncome: 10000,
    });
    // Basic: 9120 at 8.75% = 798.00
    // Higher: 380 at 33.75% = 128.25
    // Total: 926.25
    expect(r.totalDividendTax).toBeCloseTo(926.25, 1);
  });
});

describe('calculateDividendTax — edge cases', () => {
  it('13. Reporting: ≤£500 → none', () => {
    const r = calculateDividendTax(makeInput({ dividendIncome: 400 }));
    expect(r.reportingRequirement).toBe('none');
  });

  it('14. Reporting: £500–£10,000 → paye-or-sa', () => {
    const r = calculateDividendTax(makeInput({ dividendIncome: 5000 }));
    expect(r.reportingRequirement).toBe('paye-or-sa');
  });

  it('15. Reporting: >£10,000 → self-assessment', () => {
    const r = calculateDividendTax(makeInput({ dividendIncome: 15000 }));
    expect(r.reportingRequirement).toBe('self-assessment');
  });

  it('16. Marginal rate — basic rate taxpayer', () => {
    const r = calculateDividendTax(
      makeInput({ otherIncome: 30000, dividendIncome: 5000 })
    );
    expect(r.marginalDividendRate).toBe(0.1075);
  });

  it('17. Very large dividends — £200k', () => {
    const r = calculateDividendTax(
      makeInput({ otherIncome: 0, dividendIncome: 200000 })
    );
    // PA = max(0, 12570 - (200000-100000)/2) = 0
    // Taxable: 200000
    // Allowance: 500 at 0%
    // Basic: 37200 at 10.75% (37700 - 500 allowance)
    // Higher: 74870 at 35.75%
    // Additional: 200000 - 500 - 37200 - 74870 = 87430 at 39.35%
    expect(r.personalAllowance).toBe(0);
    expect(r.totalDividendTax).toBeGreaterThan(50000);
    expect(r.reportingRequirement).toBe('self-assessment');
  });
});
