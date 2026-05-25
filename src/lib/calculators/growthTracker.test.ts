import { describe, expect, it } from 'vitest';
import { calculateGrowthTracker, type GrowthTrackerInput } from './growthTracker';

function makeInput(overrides: Partial<GrowthTrackerInput> = {}): GrowthTrackerInput {
  return {
    targetAmount: 1000,
    targetType: 'profit',
    targetPeriod: 'monthly',
    sellingPrice: 15,
    costPerItem: 5,
    shippingCostPerItem: 3,
    platform: 'etsy',
    ...overrides,
  };
}

describe('Growth Tracker', () => {
  it('Scenario A: Etsy candle seller £1,000/month profit', () => {
    const r = calculateGrowthTracker(makeInput());
    // Etsy fees: £0.16 + (15 × 0.065 = 0.975) + (15 × 0.04 + 0.20 = 0.80) = £1.935 → £1.94
    expect(r.perItem.platformFees).toBeCloseTo(1.94, 1);
    expect(r.perItem.profitPerItem).toBeCloseTo(5.06, 1);
    // 1000 / 5.06 ≈ 198
    expect(r.unitsNeeded.perMonth).toBeGreaterThanOrEqual(195);
    expect(r.unitsNeeded.perMonth).toBeLessThanOrEqual(200);
    expect(r.unitsNeeded.perDay).toBeGreaterThan(5);
    expect(r.unitsNeeded.perWeek).toBeGreaterThan(40);
    expect(r.perItem.profitMargin).toBeGreaterThan(30);
    expect(r.perItem.profitMargin).toBeLessThan(40);
  });

  it('Scenario B: eBay reseller £500/month profit', () => {
    const r = calculateGrowthTracker(makeInput({
      platform: 'ebay',
      sellingPrice: 25,
      costPerItem: 8,
      shippingCostPerItem: 4,
      targetAmount: 500,
    }));
    // eBay: (25 × 0.128) + 0.30 = 3.50
    expect(r.perItem.platformFees).toBeCloseTo(3.50, 1);
    expect(r.perItem.profitPerItem).toBeCloseTo(9.50, 1);
    // 500 / 9.50 ≈ 53
    expect(r.unitsNeeded.perMonth).toBeGreaterThanOrEqual(52);
    expect(r.unitsNeeded.perMonth).toBeLessThanOrEqual(54);
  });

  it('Scenario C: Vinted seller, zero fees', () => {
    const r = calculateGrowthTracker(makeInput({
      platform: 'vinted',
      sellingPrice: 10,
      costPerItem: 0,
      shippingCostPerItem: 0,
      targetAmount: 200,
      targetType: 'revenue',
    }));
    expect(r.perItem.platformFees).toBe(0);
    expect(r.unitsNeeded.perMonth).toBe(20);
    expect(r.perItem.profitPerItem).toBe(10);
  });

  it('Scenario D: Amazon seller, individual plan', () => {
    const r = calculateGrowthTracker(makeInput({
      platform: 'amazon',
      sellingPrice: 30,
      costPerItem: 12,
      shippingCostPerItem: 5,
      targetAmount: 2000,
    }));
    // Amazon: 258+ units/month triggers Professional plan
    // Referral: 30 × 0.15 = 4.50, plus amortised £25/~258 ≈ £0.10
    expect(r.perItem.platformFees).toBeGreaterThan(4.50);
    expect(r.perItem.platformFees).toBeLessThan(5.30);
    expect(r.perItem.profitPerItem).toBeGreaterThan(7.5);
    expect(r.perItem.profitPerItem).toBeLessThan(8.5);
    expect(r.unitsNeeded.perMonth).toBeGreaterThanOrEqual(235);
    expect(r.unitsNeeded.perMonth).toBeLessThanOrEqual(270);
  });

  it('Scenario E: Shopify seller, revenue target', () => {
    const r = calculateGrowthTracker(makeInput({
      platform: 'shopify',
      sellingPrice: 50,
      costPerItem: 15,
      shippingCostPerItem: 6,
      targetAmount: 3000,
      targetType: 'revenue',
    }));
    // Revenue target: 3000 / 50 = 60 units
    expect(r.unitsNeeded.perMonth).toBe(60);
    // Shopify fees present
    expect(r.perItem.platformFees).toBeGreaterThan(0);
    expect(r.perItem.platformFeeBreakdown.length).toBe(2); // payment + monthly
  });

  it('Scenario F: No platform, direct sales', () => {
    const r = calculateGrowthTracker(makeInput({
      platform: 'noFees',
      sellingPrice: 20,
      costPerItem: 7,
      shippingCostPerItem: 0,
      targetAmount: 500,
    }));
    expect(r.perItem.platformFees).toBe(0);
    expect(r.perItem.profitPerItem).toBe(13);
    // 500 / 13 ≈ 39
    expect(r.unitsNeeded.perMonth).toBeGreaterThanOrEqual(38);
    expect(r.unitsNeeded.perMonth).toBeLessThanOrEqual(40);
  });

  it('Scenario G: Revenue target ignores costs for unit count', () => {
    const r = calculateGrowthTracker(makeInput({
      targetAmount: 1000,
      targetType: 'revenue',
      sellingPrice: 25,
    }));
    // Revenue: 1000 / 25 = 40 units (not reduced by costs)
    expect(r.unitsNeeded.perMonth).toBe(40);
  });

  it('Scenario H: Infeasible pace detected', () => {
    const r = calculateGrowthTracker(makeInput({
      platform: 'noFees',
      targetAmount: 5000,
      sellingPrice: 10,
      costPerItem: 5,
      shippingCostPerItem: 0,
      hoursPerWeek: 10,
    }));
    // 5000 / 5 = 1000 units/month → ~231/week
    // 10 hours / 231 = ~0.04 hours/item = ~2.6 minutes
    expect(r.timeEstimate).toBeDefined();
    expect(r.timeEstimate!.feasible).toBe(false);
    expect(r.timeEstimate!.feasibilityNote).toContain('minutes');
  });

  it('Scenario I: Progress tracking', () => {
    const r = calculateGrowthTracker(makeInput({
      platform: 'noFees',
      sellingPrice: 20,
      costPerItem: 7,
      shippingCostPerItem: 0,
      targetAmount: 1300, // 1300 / 13 = 100 units
      currentMonthlySales: 60,
    }));
    expect(r.progress).toBeDefined();
    expect(r.progress!.progressPercent).toBe(60);
    expect(r.progress!.monthlyGap).toBe(40);
    expect(r.progress!.onTrack).toBe(false);
  });

  it('Scenario J: TikTok Shop', () => {
    const r = calculateGrowthTracker(makeInput({
      platform: 'tiktokShop',
      sellingPrice: 12,
      costPerItem: 3,
      shippingCostPerItem: 0,
      targetAmount: 800,
    }));
    // TikTok: 12 × 0.05 = 0.60
    expect(r.perItem.platformFees).toBeCloseTo(0.60, 1);
    expect(r.perItem.profitPerItem).toBeCloseTo(8.40, 1);
    // 800 / 8.40 ≈ 96
    expect(r.unitsNeeded.perMonth).toBeGreaterThanOrEqual(95);
    expect(r.unitsNeeded.perMonth).toBeLessThanOrEqual(96);
  });

  it('Scenario K: Depop zero fees', () => {
    const r = calculateGrowthTracker(makeInput({
      platform: 'depop',
      sellingPrice: 18,
      costPerItem: 6,
      shippingCostPerItem: 4,
      targetAmount: 500,
    }));
    expect(r.perItem.platformFees).toBe(0);
    expect(r.perItem.profitPerItem).toBe(8);
    // 500 / 8 = 63
    expect(r.unitsNeeded.perMonth).toBeGreaterThanOrEqual(62);
    expect(r.unitsNeeded.perMonth).toBeLessThanOrEqual(63);
  });

  it('Scenario L: Facebook Marketplace', () => {
    const r = calculateGrowthTracker(makeInput({
      platform: 'facebookMarketplace',
      sellingPrice: 20,
      costPerItem: 5,
      shippingCostPerItem: 3,
    }));
    // FB: (20 × 0.05) + 0.40 = 1.40
    expect(r.perItem.platformFees).toBeCloseTo(1.40, 1);
    expect(r.perItem.profitPerItem).toBeCloseTo(10.60, 1);
  });

  it('platform comparison includes all 9 platforms', () => {
    const r = calculateGrowthTracker(makeInput());
    expect(r.platformComparison.length).toBe(9);
    const names = r.platformComparison.map(p => p.platform);
    expect(names).toContain('etsy');
    expect(names).toContain('vinted');
    expect(names).toContain('noFees');
  });

  it('yearly target divides by 12 for monthly', () => {
    const r = calculateGrowthTracker(makeInput({
      platform: 'noFees',
      sellingPrice: 20,
      costPerItem: 7,
      shippingCostPerItem: 0,
      targetAmount: 1200,
      targetPeriod: 'yearly',
    }));
    // 1200/yr / 12 = 100/month profit target. 100 / 13 = ~8/month
    expect(r.unitsNeeded.perMonth).toBeGreaterThanOrEqual(7);
    expect(r.unitsNeeded.perMonth).toBeLessThanOrEqual(8);
  });

  it('zero selling price returns empty result', () => {
    const r = calculateGrowthTracker(makeInput({ sellingPrice: 0 }));
    expect(r.unitsNeeded.perMonth).toBe(0);
    expect(r.perItem.profitPerItem).toBe(0);
  });

  it('feasible time estimate with generous hours', () => {
    const r = calculateGrowthTracker(makeInput({
      platform: 'noFees',
      sellingPrice: 50,
      costPerItem: 10,
      shippingCostPerItem: 0,
      targetAmount: 400,
      hoursPerWeek: 20,
    }));
    // 400 / 40 = 10/month → ~2.3/week
    // 20 / 2.3 ≈ 8.7 hours per item
    expect(r.timeEstimate).toBeDefined();
    expect(r.timeEstimate!.feasible).toBe(true);
    expect(r.timeEstimate!.hoursPerItem).toBeGreaterThan(5);
  });
});
