/**
 * Side-Hustle Growth Tracker — pure logic, no side effects
 * Calculates units needed to hit income targets, factoring in platform fees
 */

import platformFeesData from '../../data/platform-fees.json';

// ── Types ──────────────────────────────────────────────────

export interface GrowthTrackerInput {
  targetAmount: number;
  targetType: 'revenue' | 'profit';
  targetPeriod: 'monthly' | 'yearly';
  sellingPrice: number;
  costPerItem: number;
  shippingCostPerItem: number;
  platform: string;
  hoursPerWeek?: number;
  currentMonthlySales?: number;
}

export interface FeeLineItem {
  name: string;
  amount: number;
}

export interface PerItemBreakdown {
  sellingPrice: number;
  costOfGoods: number;
  shippingCost: number;
  platformFees: number;
  platformFeeBreakdown: FeeLineItem[];
  totalCosts: number;
  profitPerItem: number;
  profitMargin: number;
  effectiveRevenuePerItem: number;
}

export interface UnitsNeeded {
  forTarget: number;
  perDay: number;
  perWeek: number;
  perMonth: number;
  perWorkingDay: number;
}

export interface Financials {
  grossRevenue: number;
  totalPlatformFees: number;
  totalCostOfGoods: number;
  totalShipping: number;
  totalProfit: number;
  effectivePlatformFeeRate: number;
}

export interface TimeEstimate {
  hoursPerItem: number;
  weeksToTarget: number;
  feasible: boolean;
  feasibilityNote: string;
}

export interface Progress {
  currentMonthlyRevenue: number;
  currentMonthlyProfit: number;
  monthlyGap: number;
  onTrack: boolean;
  progressPercent: number;
  projectedAnnual: number;
}

export interface PlatformComparison {
  platform: string;
  name: string;
  icon: string;
  feesPerItem: number;
  profitPerItem: number;
  unitsPerMonth: number;
}

export interface GrowthTrackerResult {
  perItem: PerItemBreakdown;
  unitsNeeded: UnitsNeeded;
  financials: Financials;
  timeEstimate?: TimeEstimate;
  progress?: Progress;
  platformComparison: PlatformComparison[];
  taxNote: string;
  tradingAllowanceNote: string;
}

// ── Platform info helper ───────────────────────────────────

export interface PlatformInfo {
  key: string;
  name: string;
  icon: string;
  description: string;
  notes: string;
}

export function getPlatforms(): PlatformInfo[] {
  return Object.entries(platformFeesData.platforms).map(([key, p]) => ({
    key,
    name: (p as any).name,
    icon: (p as any).icon,
    description: (p as any).description,
    notes: (p as any).notes,
  }));
}

// ── Fee calculation per platform ───────────────────────────

function calculatePlatformFees(
  platform: string,
  sellingPrice: number,
  monthlyUnits: number,
): { total: number; breakdown: FeeLineItem[] } {
  const breakdown: FeeLineItem[] = [];
  let total = 0;

  switch (platform) {
    case 'etsy': {
      const listing = 0.16;
      const transaction = sellingPrice * 0.065;
      const payment = sellingPrice * 0.04 + 0.20;
      breakdown.push({ name: 'Listing fee', amount: round(listing) });
      breakdown.push({ name: 'Transaction fee (6.5%)', amount: round(transaction) });
      breakdown.push({ name: 'Payment processing (4% + £0.20)', amount: round(payment) });
      total = listing + transaction + payment;
      break;
    }
    case 'ebay': {
      const finalValue = sellingPrice * 0.128 + 0.30;
      breakdown.push({ name: 'Final value fee (12.8% + £0.30)', amount: round(finalValue) });
      total = finalValue;
      break;
    }
    case 'vinted': {
      breakdown.push({ name: 'Seller fee', amount: 0 });
      total = 0;
      break;
    }
    case 'amazon': {
      const referral = sellingPrice * 0.15;
      breakdown.push({ name: 'Referral fee (15%)', amount: round(referral) });
      if (monthlyUnits >= 40) {
        const amortised = 25 / monthlyUnits;
        breakdown.push({ name: 'Professional plan (£25/mo amortised)', amount: round(amortised) });
        total = referral + amortised;
      } else {
        breakdown.push({ name: 'Individual per-item fee', amount: 0.75 });
        total = referral + 0.75;
      }
      break;
    }
    case 'depop': {
      breakdown.push({ name: 'Seller fee', amount: 0 });
      total = 0;
      break;
    }
    case 'tiktokShop': {
      const fee = sellingPrice * 0.05;
      breakdown.push({ name: 'Referral fee (5%)', amount: round(fee) });
      total = fee;
      break;
    }
    case 'shopify': {
      const payment = sellingPrice * 0.029 + 0.30;
      const amortised = monthlyUnits > 0 ? 25 / monthlyUnits : 25;
      breakdown.push({ name: 'Payment processing (2.9% + £0.30)', amount: round(payment) });
      breakdown.push({ name: 'Basic plan (£25/mo amortised)', amount: round(amortised) });
      total = payment + amortised;
      break;
    }
    case 'facebookMarketplace': {
      const fee = sellingPrice * 0.05 + 0.40;
      breakdown.push({ name: 'Shipping seller fee (5% + £0.40)', amount: round(fee) });
      total = fee;
      break;
    }
    case 'noFees':
    default: {
      total = 0;
      break;
    }
  }

  return { total: round(total), breakdown };
}

// ── Main calculation ───────────────────────────────────────

export function calculateGrowthTracker(input: GrowthTrackerInput): GrowthTrackerResult {
  const {
    targetAmount,
    targetType,
    targetPeriod,
    sellingPrice,
    costPerItem,
    shippingCostPerItem,
    platform,
    hoursPerWeek,
    currentMonthlySales,
  } = input;

  // Guard: zero/negative selling price
  if (sellingPrice <= 0) {
    return emptyResult(input);
  }

  // ── Step 1: Estimate monthly units (initial guess for amortised fees) ──
  let estimatedMonthlyUnits: number;
  if (targetType === 'profit') {
    // Rough guess ignoring fees to seed the calculation
    const roughProfit = sellingPrice - costPerItem - shippingCostPerItem;
    if (roughProfit <= 0) {
      estimatedMonthlyUnits = 9999; // will show as infeasible
    } else {
      const monthlyTarget = targetPeriod === 'monthly' ? targetAmount : targetAmount / 12;
      estimatedMonthlyUnits = Math.ceil(monthlyTarget / roughProfit);
    }
  } else {
    const monthlyTarget = targetPeriod === 'monthly' ? targetAmount : targetAmount / 12;
    estimatedMonthlyUnits = Math.ceil(monthlyTarget / sellingPrice);
  }

  // ── Step 2: Calculate platform fees with estimated units ──
  const { total: feesPerItem, breakdown: feeBreakdown } = calculatePlatformFees(
    platform,
    sellingPrice,
    estimatedMonthlyUnits,
  );

  // ── Step 3: Per-item breakdown ──
  const totalCosts = costPerItem + shippingCostPerItem + feesPerItem;
  const profitPerItem = sellingPrice - totalCosts;
  const profitMargin = sellingPrice > 0 ? (profitPerItem / sellingPrice) * 100 : 0;
  const effectiveRevenuePerItem = sellingPrice - feesPerItem;

  const perItem: PerItemBreakdown = {
    sellingPrice,
    costOfGoods: costPerItem,
    shippingCost: shippingCostPerItem,
    platformFees: feesPerItem,
    platformFeeBreakdown: feeBreakdown,
    totalCosts: round(totalCosts),
    profitPerItem: round(profitPerItem),
    profitMargin: round(profitMargin),
    effectiveRevenuePerItem: round(effectiveRevenuePerItem),
  };

  // ── Step 4: Units needed ──
  let monthlyUnits: number;
  if (targetType === 'profit') {
    if (profitPerItem <= 0) {
      monthlyUnits = Infinity;
    } else {
      const monthlyTarget = targetPeriod === 'monthly' ? targetAmount : targetAmount / 12;
      monthlyUnits = monthlyTarget / profitPerItem;
    }
  } else {
    const monthlyTarget = targetPeriod === 'monthly' ? targetAmount : targetAmount / 12;
    monthlyUnits = monthlyTarget / sellingPrice;
  }

  // Re-calculate fees with better unit estimate (for Shopify/Amazon amortisation)
  if (platform === 'shopify' || platform === 'amazon') {
    const refined = calculatePlatformFees(platform, sellingPrice, Math.ceil(monthlyUnits));
    const refinedProfit = sellingPrice - costPerItem - shippingCostPerItem - refined.total;
    if (targetType === 'profit' && refinedProfit > 0) {
      const monthlyTarget = targetPeriod === 'monthly' ? targetAmount : targetAmount / 12;
      monthlyUnits = monthlyTarget / refinedProfit;
    }
    // Update per-item with refined fees
    perItem.platformFees = refined.total;
    perItem.platformFeeBreakdown = refined.breakdown;
    perItem.totalCosts = round(costPerItem + shippingCostPerItem + refined.total);
    perItem.profitPerItem = round(sellingPrice - perItem.totalCosts);
    perItem.profitMargin = round((perItem.profitPerItem / sellingPrice) * 100);
    perItem.effectiveRevenuePerItem = round(sellingPrice - refined.total);
  }

  const perMonth = Math.ceil(monthlyUnits);
  const perYear = perMonth * 12;
  const perWeek = monthlyUnits / 4.33;
  const perDay = monthlyUnits / 30;
  const perWorkingDay = monthlyUnits / 22;

  const unitsNeeded: UnitsNeeded = {
    forTarget: targetPeriod === 'monthly' ? perMonth : perYear,
    perDay: round(perDay),
    perWeek: round(perWeek),
    perMonth,
    perWorkingDay: round(perWorkingDay),
  };

  // ── Step 5: Financials ──
  const totalUnits = targetPeriod === 'monthly' ? perMonth : perYear;
  const grossRevenue = totalUnits * sellingPrice;
  const totalPlatformFees = totalUnits * perItem.platformFees;
  const totalCostOfGoods = totalUnits * costPerItem;
  const totalShipping = totalUnits * shippingCostPerItem;
  const totalProfit = grossRevenue - totalPlatformFees - totalCostOfGoods - totalShipping;

  const financials: Financials = {
    grossRevenue: round(grossRevenue),
    totalPlatformFees: round(totalPlatformFees),
    totalCostOfGoods: round(totalCostOfGoods),
    totalShipping: round(totalShipping),
    totalProfit: round(totalProfit),
    effectivePlatformFeeRate: grossRevenue > 0 ? round((totalPlatformFees / grossRevenue) * 100) : 0,
  };

  // ── Step 6: Time estimate ──
  let timeEstimate: TimeEstimate | undefined;
  if (hoursPerWeek != null && hoursPerWeek > 0 && perWeek > 0) {
    const hoursPerItem = hoursPerWeek / perWeek;
    const weeksToTarget = targetPeriod === 'yearly' ? 52 : 4.33;
    let feasible = true;
    let feasibilityNote: string;

    if (hoursPerItem < 0.25) {
      feasible = false;
      const minutesPerItem = Math.round(hoursPerItem * 60);
      feasibilityNote = `This pace requires making/selling an item every ${minutesPerItem} minutes. Consider raising your price or adjusting your target.`;
    } else if (hoursPerItem < 0.75) {
      feasibilityNote = `You'd have about ${Math.round(hoursPerItem * 60)} minutes per item at your current availability. Tight but possible if your process is streamlined.`;
    } else {
      feasibilityNote = `You'd have about ${round(hoursPerItem)} hours per item at your current availability. Very feasible.`;
    }

    timeEstimate = { hoursPerItem: round(hoursPerItem), weeksToTarget, feasible, feasibilityNote };
  }

  // ── Step 7: Progress ──
  let progress: Progress | undefined;
  if (currentMonthlySales != null && currentMonthlySales >= 0) {
    const currentMonthlyRevenue = currentMonthlySales * sellingPrice;
    const currentMonthlyProfit = currentMonthlySales * perItem.profitPerItem;
    const monthlyGap = Math.max(0, perMonth - currentMonthlySales);
    const progressPercent = perMonth > 0 ? round((currentMonthlySales / perMonth) * 100) : 0;
    const projectedAnnual = currentMonthlySales * 12 * (targetType === 'profit' ? perItem.profitPerItem : sellingPrice);

    progress = {
      currentMonthlyRevenue: round(currentMonthlyRevenue),
      currentMonthlyProfit: round(currentMonthlyProfit),
      monthlyGap,
      onTrack: currentMonthlySales >= perMonth,
      progressPercent: Math.min(progressPercent, 100),
      projectedAnnual: round(projectedAnnual),
    };
  }

  // ── Step 8: Platform comparison ──
  const platformComparison = buildPlatformComparison(input);

  // ── Step 9: Tax notes ──
  const taxNote =
    'Your side-hustle profit may be subject to tax. Use our Side-Hustle Tax Calculator to see your exact liability.';
  const tradingAllowanceNote =
    'If your total gross revenue stays under £1,000, the trading allowance covers you — no tax to pay.';

  return {
    perItem,
    unitsNeeded,
    financials,
    timeEstimate,
    progress,
    platformComparison,
    taxNote,
    tradingAllowanceNote,
  };
}

// ── Platform comparison builder ────────────────────────────

function buildPlatformComparison(input: GrowthTrackerInput): PlatformComparison[] {
  const platforms = getPlatforms();
  const monthlyTarget = input.targetPeriod === 'monthly' ? input.targetAmount : input.targetAmount / 12;

  return platforms.map((p) => {
    const { total } = calculatePlatformFees(p.key, input.sellingPrice, 100); // estimate 100 units
    const profit = input.sellingPrice - input.costPerItem - input.shippingCostPerItem - total;
    let unitsPerMonth: number;
    if (input.targetType === 'profit') {
      unitsPerMonth = profit > 0 ? Math.ceil(monthlyTarget / profit) : Infinity;
    } else {
      unitsPerMonth = Math.ceil(monthlyTarget / input.sellingPrice);
    }

    return {
      platform: p.key,
      name: p.name,
      icon: p.icon,
      feesPerItem: round(total),
      profitPerItem: round(profit),
      unitsPerMonth: isFinite(unitsPerMonth) ? unitsPerMonth : 9999,
    };
  });
}

// ── Empty result for invalid inputs ────────────────────────

function emptyResult(input: GrowthTrackerInput): GrowthTrackerResult {
  return {
    perItem: {
      sellingPrice: input.sellingPrice,
      costOfGoods: input.costPerItem,
      shippingCost: input.shippingCostPerItem,
      platformFees: 0,
      platformFeeBreakdown: [],
      totalCosts: 0,
      profitPerItem: 0,
      profitMargin: 0,
      effectiveRevenuePerItem: 0,
    },
    unitsNeeded: { forTarget: 0, perDay: 0, perWeek: 0, perMonth: 0, perWorkingDay: 0 },
    financials: {
      grossRevenue: 0,
      totalPlatformFees: 0,
      totalCostOfGoods: 0,
      totalShipping: 0,
      totalProfit: 0,
      effectivePlatformFeeRate: 0,
    },
    platformComparison: [],
    taxNote: 'Your side-hustle profit may be subject to tax. Use our Side-Hustle Tax Calculator to see your exact liability.',
    tradingAllowanceNote: 'If your total gross revenue stays under £1,000, the trading allowance covers you — no tax to pay.',
  };
}

// ── Utility ────────────────────────────────────────────────

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
