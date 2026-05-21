import { describe, it, expect } from 'vitest';
import { checkTradingAllowance } from './tradingAllowanceChecker';
import type { TradingAllowanceInput } from './tradingAllowanceChecker';

function makeInput(overrides: Partial<TradingAllowanceInput> = {}): TradingAllowanceInput {
  return {
    incomeType: 'trading',
    anyIncomeFromEmployer: false,
    anyIncomeFromPartnership: false,
    anyIncomeFromOwnCompany: false,
    grossTradingIncome: 800,
    actualExpenses: 200,
    platforms: [],
    hasOtherSelfAssessmentReason: false,
    taxYear: '2026/27',
    ...overrides,
  };
}

describe('Trading Allowance Checker', () => {
  it('Scenario A: Under £1,000, no exclusions → fully-covered', () => {
    const r = checkTradingAllowance(makeInput({ grossTradingIncome: 800, actualExpenses: 200 }));
    expect(r.verdict).toBe('fully-covered');
    expect(r.mustRegister).toBe(false);
    expect(r.isEligibleForAllowance).toBe(true);
    expect(r.taxableWithAllowance).toBe(0);
  });

  it('Scenario B: Over £1,000, low expenses → claim allowance', () => {
    const r = checkTradingAllowance(makeInput({ grossTradingIncome: 3000, actualExpenses: 400 }));
    expect(r.verdict).toBe('register-claim-allowance');
    expect(r.betterOption).toBe('allowance');
    expect(r.taxableWithAllowance).toBe(2000);
    expect(r.taxableWithExpenses).toBe(2600);
    expect(r.taxSavingFromBetterOption).toBe(120); // (1000 - 400) * 0.20
    expect(r.mustRegister).toBe(true);
  });

  it('Scenario C: Over £1,000, high expenses → claim expenses', () => {
    const r = checkTradingAllowance(makeInput({ grossTradingIncome: 5000, actualExpenses: 2500 }));
    expect(r.verdict).toBe('register-claim-expenses');
    expect(r.betterOption).toBe('expenses');
    expect(r.taxableWithAllowance).toBe(4000);
    expect(r.taxableWithExpenses).toBe(2500);
    expect(r.taxSavingFromBetterOption).toBe(300); // (2500 - 1000) * 0.20
  });

  it('Scenario D: Employer connection → not-eligible', () => {
    const r = checkTradingAllowance(makeInput({
      grossTradingIncome: 800,
      anyIncomeFromEmployer: true,
    }));
    expect(r.verdict).toBe('not-eligible');
    expect(r.isEligibleForAllowance).toBe(false);
    expect(r.ineligibilityReason).toContain('employer');
    expect(r.mustRegister).toBe(true);
  });

  it('Scenario E: Personal sales → not-trading', () => {
    const r = checkTradingAllowance(makeInput({ incomeType: 'personal-sales' }));
    expect(r.verdict).toBe('not-trading');
    expect(r.mustRegister).toBe(false);
    expect(r.isEligibleForAllowance).toBe(false);
  });

  it('Scenario F: Rental income → not-trading, mentions property allowance', () => {
    const r = checkTradingAllowance(makeInput({ incomeType: 'rental', grossTradingIncome: 5000 }));
    expect(r.verdict).toBe('not-trading');
    expect(r.verdictExplanation).toContain('property allowance');
    expect(r.mustRegister).toBe(true); // rental > £1,000
  });

  it('Scenario G: Exactly £1,000 → fully-covered', () => {
    const r = checkTradingAllowance(makeInput({ grossTradingIncome: 1000 }));
    expect(r.verdict).toBe('fully-covered');
    expect(r.mustRegister).toBe(false);
    expect(r.taxableWithAllowance).toBe(0);
  });

  it('Scenario H: Partnership income → not-eligible', () => {
    const r = checkTradingAllowance(makeInput({
      grossTradingIncome: 500,
      anyIncomeFromPartnership: true,
    }));
    expect(r.verdict).toBe('not-eligible');
    expect(r.ineligibilityReason).toContain('partnership');
  });

  it('Scenario I: £60,000 income → register + MTD applies', () => {
    const r = checkTradingAllowance(makeInput({
      grossTradingIncome: 60000,
      actualExpenses: 15000,
    }));
    expect(r.verdict).toBe('register-claim-expenses');
    expect(r.mtdApplies).toBe(true);
    expect(r.mustRegister).toBe(true);
  });

  it('Scenario J: Equal expenses and allowance → equal', () => {
    const r = checkTradingAllowance(makeInput({
      grossTradingIncome: 3000,
      actualExpenses: 1000,
    }));
    expect(r.betterOption).toBe('equal');
    expect(r.taxSavingFromBetterOption).toBe(0);
    expect(r.taxableWithAllowance).toBe(2000);
    expect(r.taxableWithExpenses).toBe(2000);
  });

  it('Scenario K: Employment income → not-trading', () => {
    const r = checkTradingAllowance(makeInput({ incomeType: 'employment' }));
    expect(r.verdict).toBe('not-trading');
    expect(r.verdictExplanation).toContain('PAYE');
  });

  it('Scenario L: Own company income → not-eligible', () => {
    const r = checkTradingAllowance(makeInput({
      grossTradingIncome: 2000,
      anyIncomeFromOwnCompany: true,
    }));
    expect(r.verdict).toBe('not-eligible');
    expect(r.ineligibilityReason).toContain('company');
  });

  it('Platform reporting: high gross triggers note', () => {
    const r = checkTradingAllowance(makeInput({
      grossTradingIncome: 3000,
      actualExpenses: 200,
      platforms: ['Etsy', 'eBay'],
    }));
    expect(r.platformReportingApplies).toBe(true);
    expect(r.platformReportingNote).toContain('Etsy');
  });

  it('Platform reporting: low gross below threshold', () => {
    const r = checkTradingAllowance(makeInput({
      grossTradingIncome: 500,
      platforms: ['Vinted'],
    }));
    expect(r.platformReportingApplies).toBe(false);
  });

  it('Deadlines correct for 2026/27', () => {
    const r = checkTradingAllowance(makeInput());
    expect(r.registrationDeadline).toBe('5 October 2027');
    expect(r.filingDeadline).toBe('31 January 2028');
    expect(r.paymentDeadline).toBe('31 January 2028');
  });

  it('Under £1,000 but has other SA reason → still fully-covered but mustRegister true', () => {
    const r = checkTradingAllowance(makeInput({
      grossTradingIncome: 500,
      hasOtherSelfAssessmentReason: true,
    }));
    expect(r.verdict).toBe('fully-covered');
    expect(r.mustRegister).toBe(true);
  });

  it('Future change note always present', () => {
    const r = checkTradingAllowance(makeInput());
    expect(r.futureChangeNote).toContain('2027/28');
    expect(r.futureChangeNote).toContain('£3,000');
  });
});
