import { describe, it, expect } from 'vitest';
import { calculateSoleTraderVsLtd } from './soleTraderVsLtd.ts';
import type { SoleTraderVsLtdInput } from './soleTraderVsLtd.ts';

function makeInput(overrides: Partial<SoleTraderVsLtdInput> = {}): SoleTraderVsLtdInput {
  return {
    annualProfit: 50000,
    hasEmploymentAllowance: false,
    accountingCosts: 1200,
    taxYear: '2026/27',
    ...overrides,
  };
}

describe('calculateSoleTraderVsLtd — 2026/27', () => {
  it('Scenario A: £20,000 profit, no EA — sole trader wins', () => {
    const r = calculateSoleTraderVsLtd(makeInput({ annualProfit: 20000 }));

    expect(r.soleTrader.personalAllowance).toBe(12570);
    expect(r.soleTrader.incomeTax).toBe(1486);
    expect(r.soleTrader.class4NI).toBe(445.80);
    expect(r.soleTrader.class2NI).toBe(0);
    expect(r.soleTrader.totalTax).toBe(1931.80);
    expect(r.soleTrader.takeHome).toBe(18068.20);

    expect(r.ltdCompany.directorSalary).toBe(12570);
    expect(r.ltdCompany.employerNI).toBe(1135.50);
    expect(r.ltdCompany.netEmployerNI).toBe(1135.50);

    expect(r.comparison.betterOption).toBe('sole-trader');
    expect(r.comparison.annualSaving).toBeLessThan(0);
  });

  it('Scenario B: £35,000 profit, no EA — sole trader still wins', () => {
    const r = calculateSoleTraderVsLtd(makeInput({ annualProfit: 35000 }));

    expect(r.soleTrader.takeHome).toBeGreaterThan(0);
    expect(r.ltdCompany.takeHome).toBeGreaterThan(0);
    // With 2026/27 dividend rates, combined CT + div tax exceeds IT + NI
    expect(r.comparison.betterOption).toBe('sole-trader');
  });

  it('Scenario C: £50,000 profit, no EA — sole trader wins (2026/27 rates)', () => {
    const r = calculateSoleTraderVsLtd(makeInput({ annualProfit: 50000 }));

    expect(r.soleTrader.incomeTax).toBe(7486);
    expect(r.soleTrader.class4NI).toBe(2245.80);
    expect(r.soleTrader.totalTax).toBe(9731.80);
    expect(r.soleTrader.takeHome).toBe(40268.20);

    // With 10.75% basic dividend rate, combined CT+dividend tax > IT+NI
    expect(r.comparison.betterOption).toBe('sole-trader');
    // Gap is moderate
    expect(Math.abs(r.comparison.annualSaving)).toBeLessThan(5000);
  });

  it('Scenario D: £80,000 profit, no EA — sole trader still wins', () => {
    const r = calculateSoleTraderVsLtd(makeInput({ annualProfit: 80000 }));

    expect(r.soleTrader.incomeTax).toBe(19432);
    expect(r.soleTrader.class4NI).toBe(2856.60);
    expect(r.soleTrader.totalTax).toBe(22288.60);
    expect(r.soleTrader.takeHome).toBe(57711.40);

    // Double taxation (CT + dividends) exceeds income tax + NI
    expect(r.comparison.betterOption).toBe('sole-trader');
  });

  it('Scenario E: £50,000 profit, WITH EA — EA narrows the gap', () => {
    const noEA = calculateSoleTraderVsLtd(makeInput({ annualProfit: 50000, hasEmploymentAllowance: false }));
    const withEA = calculateSoleTraderVsLtd(makeInput({ annualProfit: 50000, hasEmploymentAllowance: true }));

    // EA eliminates employer NI
    expect(withEA.ltdCompany.netEmployerNI).toBe(0);
    expect(withEA.ltdCompany.employmentAllowanceUsed).toBe(noEA.ltdCompany.employerNI);
    // Ltd take-home better with EA (saved NI flows to dividends)
    expect(withEA.ltdCompany.takeHome).toBeGreaterThan(noEA.ltdCompany.takeHome);
    // EA narrows the gap between Ltd and sole trader
    expect(withEA.comparison.annualSaving).toBeGreaterThan(noEA.comparison.annualSaving);
  });

  it('Scenario F: £120,000 profit, no EA — PA taper on sole trader', () => {
    const r = calculateSoleTraderVsLtd(makeInput({ annualProfit: 120000 }));

    // Sole trader PA tapered
    expect(r.soleTrader.personalAllowance).toBe(2570);
    expect(r.soleTrader.incomeTax).toBeGreaterThan(30000);

    // Even with PA taper advantage, Ltd still loses due to double taxation
    expect(r.comparison.betterOption).toBe('sole-trader');
  });

  it('Scenario G: £10,000 profit — too low for Ltd', () => {
    const r = calculateSoleTraderVsLtd(makeInput({ annualProfit: 10000 }));

    // Sole trader: below PA, no tax
    expect(r.soleTrader.incomeTax).toBe(0);
    expect(r.soleTrader.class4NI).toBe(0);
    expect(r.soleTrader.takeHome).toBe(10000);

    // Ltd loses to accounting costs alone
    expect(r.comparison.betterOption).toBe('sole-trader');
    expect(r.ltdCompany.accountingCosts).toBe(1200);
  });

  it('crossover point is 0 (Ltd never wins with 2026/27 dividend rates)', () => {
    const r = calculateSoleTraderVsLtd(makeInput({ annualProfit: 50000 }));
    // With 10.75%/35.75% dividend rates, combined CT+div tax always exceeds IT+NI
    expect(r.comparison.crossoverPoint).toBe(0);
  });

  it('effective rates are between 0 and 1 for both sides', () => {
    const r = calculateSoleTraderVsLtd(makeInput({ annualProfit: 60000 }));
    expect(r.soleTrader.effectiveRate).toBeGreaterThan(0);
    expect(r.soleTrader.effectiveRate).toBeLessThan(1);
    expect(r.ltdCompany.effectiveRate).toBeGreaterThan(0);
    expect(r.ltdCompany.effectiveRate).toBeLessThan(1);
  });

  it('corporation tax uses 19% for small profits', () => {
    const r = calculateSoleTraderVsLtd(makeInput({ annualProfit: 40000 }));
    expect(r.ltdCompany.corporationTaxRate).toContain('19%');
  });

  it('corporation tax uses marginal relief for mid-range profits', () => {
    const r = calculateSoleTraderVsLtd(makeInput({ annualProfit: 120000 }));
    expect(r.ltdCompany.corporationTaxRate).toContain('marginal relief');
    expect(r.ltdCompany.marginalRelief).toBeGreaterThan(0);
  });

  it('dividend tax breakdown includes allowance at 0%', () => {
    const r = calculateSoleTraderVsLtd(makeInput({ annualProfit: 50000 }));
    const allowanceBand = r.ltdCompany.dividendTaxBreakdown.find(b => b.rate === 0);
    expect(allowanceBand).toBeDefined();
    expect(allowanceBand!.amount).toBe(500);
  });

  it('salary capped when profit < PA', () => {
    const r = calculateSoleTraderVsLtd(makeInput({ annualProfit: 10000 }));
    expect(r.ltdCompany.directorSalary).toBeLessThan(12570);
    // Salary + net employer NI should not exceed profit
    expect(r.ltdCompany.directorSalary + r.ltdCompany.netEmployerNI).toBeLessThanOrEqual(10000);
  });
});

describe('calculateSoleTraderVsLtd — 2025/26 backward compat', () => {
  function make2526(overrides: Partial<SoleTraderVsLtdInput> = {}): SoleTraderVsLtdInput {
    return {
      annualProfit: 50000,
      hasEmploymentAllowance: false,
      accountingCosts: 1200,
      taxYear: '2025/26',
      ...overrides,
    };
  }

  it('2025/26 dividend rates are lower than 2026/27', () => {
    const r2526 = calculateSoleTraderVsLtd(make2526({ annualProfit: 60000 }));
    const r2627 = calculateSoleTraderVsLtd(makeInput({ annualProfit: 60000 }));

    // 2025/26 basic dividend rate is 8.75% vs 10.75% in 2026/27
    expect(r2526.ltdCompany.dividendTax).toBeLessThan(r2627.ltdCompany.dividendTax);
  });

  it('sole trader results same across years (same IT and NI bands)', () => {
    const r2526 = calculateSoleTraderVsLtd(make2526({ annualProfit: 50000 }));
    const r2627 = calculateSoleTraderVsLtd(makeInput({ annualProfit: 50000 }));

    // Income tax bands and Class 4 NI rates frozen
    expect(r2526.soleTrader.incomeTax).toBe(r2627.soleTrader.incomeTax);
    expect(r2526.soleTrader.class4NI).toBe(r2627.soleTrader.class4NI);
  });
});
