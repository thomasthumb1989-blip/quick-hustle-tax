import { describe, it, expect } from 'vitest';
import { checkPlatformSeller } from './platformSellerChecker';
import type { PlatformSellerInput } from './platformSellerChecker';

function makeInput(overrides: Partial<PlatformSellerInput> = {}): PlatformSellerInput {
  return {
    platforms: ['ebay'],
    activityType: 'selling-personal-items',
    totalTransactions: 10,
    grossRevenue: 400,
    grossTradingIncomeTaxYear: 400,
    actualExpenses: 0,
    sellingPersonalItemsAtLoss: true,
    buyingToResell: false,
    regularActivity: false,
    joinedMidYear: false,
    hasReceivedHMRCLetter: false,
    taxYear: '2026/27',
    ...overrides,
  };
}

describe('Platform Seller Checker', () => {
  // Scenario A: Personal Vinted seller, clearing wardrobe, 15 sales, £400
  it('Scenario A: personal Vinted seller — not trading, below thresholds, no tax', () => {
    const r = checkPlatformSeller(makeInput({
      platforms: ['vinted'],
      activityType: 'selling-personal-items',
      totalTransactions: 15,
      grossRevenue: 400,
      grossTradingIncomeTaxYear: 400,
      sellingPersonalItemsAtLoss: true,
      buyingToResell: false,
      regularActivity: false,
    }));

    expect(r.platformReporting.isBeingReported).toBe(false);
    expect(r.tradingStatus.isTradingActivity).toBe(false);
    expect(r.tradingStatus.riskLevel).toBe('low');
    expect(r.taxLiability.needsToRegister).toBe(false);
    expect(r.taxLiability.estimatedTax).toBe(0);
    expect(r.verdicts.reporting.severity).toBe('success');
    expect(r.verdicts.action.severity).toBe('success');
  });

  // Scenario B: Etsy seller, handmade goods, 45 sales, £3,200
  it('Scenario B: Etsy handmade seller — trading, above thresholds, must register', () => {
    const r = checkPlatformSeller(makeInput({
      platforms: ['etsy'],
      activityType: 'selling-made-items',
      totalTransactions: 45,
      grossRevenue: 3200,
      grossTradingIncomeTaxYear: 3200,
      actualExpenses: 1200,
      sellingPersonalItemsAtLoss: false,
      buyingToResell: false,
      regularActivity: true,
    }));

    expect(r.platformReporting.isBeingReported).toBe(true);
    expect(r.tradingStatus.isTradingActivity).toBe(true);
    expect(r.taxLiability.needsToRegister).toBe(true);
    expect(r.taxLiability.coveredByTradingAllowance).toBe(false);
    // Expenses (£1,200) > allowance (£1,000) → claim expenses
    expect(r.taxLiability.recommendedDeductionMethod).toBe('actual-expenses');
    expect(r.taxLiability.tradingAllowanceComparison.taxableWithAllowance).toBe(2200);
    expect(r.taxLiability.tradingAllowanceComparison.taxableWithExpenses).toBe(2000);
  });

  // Scenario C: eBay reseller, buying to flip, 25 sales, £1,500
  it('Scenario C: eBay reseller — trading, below reporting thresholds', () => {
    const r = checkPlatformSeller(makeInput({
      platforms: ['ebay'],
      activityType: 'buying-to-resell',
      totalTransactions: 25,
      grossRevenue: 1500,
      grossTradingIncomeTaxYear: 1500,
      actualExpenses: 600,
      sellingPersonalItemsAtLoss: false,
      buyingToResell: true,
      regularActivity: true,
    }));

    expect(r.platformReporting.isBeingReported).toBe(false);
    expect(r.tradingStatus.isTradingActivity).toBe(true);
    expect(r.tradingStatus.riskLevel).toBe('high');
    expect(r.taxLiability.needsToRegister).toBe(true);
    // Allowance (£1,000) > expenses (£600) → claim allowance
    expect(r.taxLiability.recommendedDeductionMethod).toBe('trading-allowance');
  });

  // Scenario D: Fiverr freelancer, £2,000 income
  it('Scenario D: Fiverr freelancer — services always reported, must register', () => {
    const r = checkPlatformSeller(makeInput({
      platforms: ['fiverr'],
      activityType: 'freelance-services',
      totalTransactions: 15,
      grossRevenue: 2000,
      grossTradingIncomeTaxYear: 2000,
      actualExpenses: 300,
      sellingPersonalItemsAtLoss: false,
      buyingToResell: false,
      regularActivity: true,
    }));

    expect(r.platformReporting.isBeingReported).toBe(true);
    expect(r.platformReporting.reportingReason).toContain('first penny');
    expect(r.tradingStatus.isTradingActivity).toBe(true);
    expect(r.taxLiability.needsToRegister).toBe(true);
    expect(r.taxLiability.coveredByTradingAllowance).toBe(false);
    expect(r.taxLiability.estimatedTax).toBeGreaterThan(0);
  });

  // Scenario E: Deliveroo rider, £8,000 income
  it('Scenario E: Deliveroo rider — services reported, well above allowance', () => {
    const r = checkPlatformSeller(makeInput({
      platforms: ['deliveroo'],
      activityType: 'gig-delivery',
      totalTransactions: 500,
      grossRevenue: 8000,
      grossTradingIncomeTaxYear: 8000,
      actualExpenses: 2000,
      sellingPersonalItemsAtLoss: false,
      buyingToResell: false,
      regularActivity: true,
    }));

    expect(r.platformReporting.isBeingReported).toBe(true);
    expect(r.tradingStatus.isTradingActivity).toBe(true);
    expect(r.taxLiability.needsToRegister).toBe(true);
    // Expenses (£2,000) > allowance (£1,000) → actual expenses
    expect(r.taxLiability.recommendedDeductionMethod).toBe('actual-expenses');
    expect(r.taxLiability.taxableProfit).toBe(6000);
    expect(r.taxLiability.estimatedTax).toBe(1200);
  });

  // Scenario F: YouTube creator, £500 ad revenue
  it('Scenario F: YouTube creator — services reported, under allowance', () => {
    const r = checkPlatformSeller(makeInput({
      platforms: ['youtube'],
      activityType: 'content-creation',
      totalTransactions: 12,
      grossRevenue: 500,
      grossTradingIncomeTaxYear: 500,
      actualExpenses: 100,
      sellingPersonalItemsAtLoss: false,
      buyingToResell: false,
      regularActivity: true,
    }));

    expect(r.platformReporting.isBeingReported).toBe(true);
    expect(r.tradingStatus.isTradingActivity).toBe(true);
    expect(r.taxLiability.needsToRegister).toBe(false);
    expect(r.taxLiability.coveredByTradingAllowance).toBe(true);
    expect(r.taxLiability.estimatedTax).toBe(0);
  });

  // Scenario G: Vinted seller, 35 sales, £800, personal items — reported but NOT trading
  it('Scenario G: Vinted seller — reported (>30 tx) but personal selling = no tax', () => {
    const r = checkPlatformSeller(makeInput({
      platforms: ['vinted'],
      activityType: 'selling-personal-items',
      totalTransactions: 35,
      grossRevenue: 800,
      grossTradingIncomeTaxYear: 800,
      sellingPersonalItemsAtLoss: true,
      buyingToResell: false,
      regularActivity: false,
    }));

    expect(r.platformReporting.isBeingReported).toBe(true);
    expect(r.platformReporting.reportingReason).toContain('35 transactions');
    expect(r.tradingStatus.isTradingActivity).toBe(false);
    expect(r.taxLiability.needsToRegister).toBe(false);
    expect(r.taxLiability.estimatedTax).toBe(0);
    // KEY: reported but no tax
    expect(r.verdicts.reporting.severity).toBe('warning');
    expect(r.verdicts.tax.severity).toBe('success');
  });

  // Scenario H: Mixed seller — Etsy + eBay, 50 combined, £4,000
  it('Scenario H: multi-platform mixed seller — must register', () => {
    const r = checkPlatformSeller(makeInput({
      platforms: ['etsy', 'ebay'],
      activityType: 'mixed',
      totalTransactions: 50,
      grossRevenue: 4000,
      grossTradingIncomeTaxYear: 4000,
      actualExpenses: 1500,
      sellingPersonalItemsAtLoss: false,
      buyingToResell: true,
      regularActivity: true,
    }));

    expect(r.platformReporting.isBeingReported).toBe(true);
    expect(r.tradingStatus.isTradingActivity).toBe(true);
    expect(r.taxLiability.needsToRegister).toBe(true);
    // Expenses (£1,500) > allowance (£1,000) → actual expenses
    expect(r.taxLiability.recommendedDeductionMethod).toBe('actual-expenses');
    expect(r.taxLiability.taxableProfit).toBe(2500);
    expect(r.platformNotes.length).toBe(2);
  });

  // Scenario I: Airbnb host, £3,000 rental income
  it('Scenario I: Airbnb host — property income, different rules', () => {
    const r = checkPlatformSeller(makeInput({
      platforms: ['airbnb'],
      activityType: 'rental-property',
      totalTransactions: 12,
      grossRevenue: 3000,
      grossTradingIncomeTaxYear: 3000,
      actualExpenses: 500,
      sellingPersonalItemsAtLoss: false,
      buyingToResell: false,
      regularActivity: true,
    }));

    expect(r.platformReporting.isBeingReported).toBe(true);
    expect(r.tradingStatus.isTradingActivity).toBe(false);
    expect(r.tradingStatus.tradingReason).toContain('property');
    expect(r.verdicts.trading.severity).toBe('info');
    expect(r.taxLiability.coveredByTradingAllowance).toBe(false);
  });

  // Scenario J: Mid-year joiner, started July, 20 sales, £1,200
  it('Scenario J: mid-year joiner — pro-rated threshold exceeded', () => {
    const r = checkPlatformSeller(makeInput({
      platforms: ['etsy'],
      activityType: 'selling-made-items',
      totalTransactions: 20,
      grossRevenue: 1200,
      grossTradingIncomeTaxYear: 1200,
      actualExpenses: 300,
      sellingPersonalItemsAtLoss: false,
      buyingToResell: false,
      regularActivity: true,
      joinedMidYear: true,
      monthJoined: 7,
    }));

    // Pro-rated: 30 * (13 - 7) / 12 = 30 * 6/12 = 15
    expect(r.platformReporting.reportingThresholdTransactions).toBe(15);
    expect(r.platformReporting.isBeingReported).toBe(true);
    expect(r.taxLiability.needsToRegister).toBe(true);
  });

  // Scenario K: Received HMRC letter, personal seller
  it('Scenario K: HMRC letter received — guidance steps shown', () => {
    const r = checkPlatformSeller(makeInput({
      hasReceivedHMRCLetter: true,
    }));

    expect(r.hmrcLetterGuidance.applicable).toBe(true);
    expect(r.hmrcLetterGuidance.steps.length).toBe(8);
    expect(r.hmrcLetterGuidance.steps[0]).toContain('panic');
  });

  // Scenario L: £950 gross, £200 expenses, Etsy seller — under allowance
  it('Scenario L: Etsy seller under £1,000 — fully covered by allowance', () => {
    const r = checkPlatformSeller(makeInput({
      platforms: ['etsy'],
      activityType: 'selling-made-items',
      totalTransactions: 12,
      grossRevenue: 950,
      grossTradingIncomeTaxYear: 950,
      actualExpenses: 200,
      sellingPersonalItemsAtLoss: false,
      buyingToResell: false,
      regularActivity: true,
    }));

    expect(r.platformReporting.isBeingReported).toBe(false);
    expect(r.tradingStatus.isTradingActivity).toBe(true);
    expect(r.taxLiability.needsToRegister).toBe(false);
    expect(r.taxLiability.coveredByTradingAllowance).toBe(true);
    expect(r.taxLiability.estimatedTax).toBe(0);
  });

  // Additional: services platform with no threshold
  it('services platforms have no transaction threshold', () => {
    const r = checkPlatformSeller(makeInput({
      platforms: ['upwork'],
      activityType: 'freelance-services',
      totalTransactions: 1,
      grossRevenue: 50,
      grossTradingIncomeTaxYear: 50,
    }));

    expect(r.platformReporting.isBeingReported).toBe(true);
    expect(r.platformReporting.reportingThresholdTransactions).toBe(0);
  });

  // Additional: deadlines only shown when registration needed
  it('deadlines only returned when registration needed', () => {
    const noRegister = checkPlatformSeller(makeInput({
      grossTradingIncomeTaxYear: 500,
      activityType: 'selling-made-items',
      sellingPersonalItemsAtLoss: false,
    }));
    expect(noRegister.deadlines.length).toBe(0);

    const mustRegister = checkPlatformSeller(makeInput({
      platforms: ['etsy'],
      activityType: 'selling-made-items',
      grossTradingIncomeTaxYear: 2000,
      grossRevenue: 2000,
      totalTransactions: 40,
      actualExpenses: 300,
      sellingPersonalItemsAtLoss: false,
      regularActivity: true,
    }));
    expect(mustRegister.deadlines.length).toBeGreaterThan(0);
  });
});
