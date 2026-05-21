import { taxData, getEffectivePersonalAllowance, getAdjustedIncomeTaxBands } from '../tax-data/index.ts';
import type { TaxYearData, TaxBand } from '../tax-data/types.ts';

export interface SideHustleTaxInput {
  taxYear: string; // "2026/27"
  region: 'EWN' | 'Scotland';
  employmentIncome: number; // Annual PAYE gross
  sideHustleGrossIncome: number; // Annual side hustle gross
  sideHustleExpenses: number; // Actual business expenses
  claimMode: 'auto' | 'tradingAllowance' | 'actualExpenses'; // auto = pick better
}

export interface TaxBandBreakdown {
  band: string;
  amount: number;
  rate: number;
  tax: number;
}

export interface NIBandBreakdown {
  band: string;
  profit: number;
  rate: number;
  ni: number;
}

export interface SideHustleTaxResult {
  // Inputs echoed
  totalGrossIncome: number;
  sideHustleProfitBeforeAllowance: number;

  // Allowance decision
  claimedDeduction: number;
  claimedDeductionType: 'tradingAllowance' | 'actualExpenses';
  sideHustleProfit: number; // After deduction

  // Tax breakdown
  totalTaxableIncome: number;
  personalAllowanceUsed: number;
  incomeTaxBreakdown: TaxBandBreakdown[];
  totalIncomeTax: number;

  // Tax on employment only (to calculate marginal)
  taxOnEmploymentOnly: number;

  // NI
  class4NIBreakdown: NIBandBreakdown[];
  totalClass4NI: number;

  // The key answer for the user
  additionalTaxOwedOnSideHustle: number;
  takeHomeFromSideHustle: number;
  effectiveTaxRateOnSideHustle: number; // 0–1

  // Flags
  flags: {
    belowTradingAllowance: boolean;
    requiresSelfAssessment: boolean;
    personalAllowanceTapered: boolean;
    crossesHigherRateThreshold: boolean;
  };
}

/**
 * Calculate income tax on a given taxable income using provided bands.
 * taxableIncome = total income - personal allowance
 */
function calculateIncomeTax(
  taxableIncome: number,
  bands: TaxBand[]
): { breakdown: TaxBandBreakdown[]; total: number } {
  const breakdown: TaxBandBreakdown[] = [];
  let total = 0;
  let remaining = Math.max(0, taxableIncome);

  for (const band of bands) {
    if (remaining <= 0) break;

    const bandWidth = band.to !== null ? band.to - band.from : Infinity;
    const amountInBand = Math.min(remaining, bandWidth);
    const tax = amountInBand * band.rate;

    const bandLabel =
      band.to !== null
        ? `£${band.from.toLocaleString()} – £${(band.from + bandWidth).toLocaleString()}`
        : `Above £${band.from.toLocaleString()}`;

    breakdown.push({
      band: bandLabel,
      amount: Math.round(amountInBand * 100) / 100,
      rate: band.rate,
      tax: Math.round(tax * 100) / 100,
    });

    total += tax;
    remaining -= amountInBand;
  }

  return { breakdown, total: Math.round(total * 100) / 100 };
}

/**
 * Calculate Class 4 NI on self-employed profit.
 * NI Class 4 is calculated on total self-employed profit, not marginal.
 */
function calculateClass4NI(
  sideHustleProfit: number,
  bands: TaxBand[]
): { breakdown: NIBandBreakdown[]; total: number } {
  const breakdown: NIBandBreakdown[] = [];
  let total = 0;

  for (const band of bands) {
    if (band.rate === 0) continue; // Skip 0% band

    const lower = band.from;
    const upper = band.to ?? Infinity;

    if (sideHustleProfit <= lower) continue;

    const profitInBand = Math.min(sideHustleProfit, upper) - lower;
    const ni = profitInBand * band.rate;

    const bandLabel =
      band.to !== null
        ? `£${lower.toLocaleString()} – £${upper.toLocaleString()}`
        : `Above £${lower.toLocaleString()}`;

    breakdown.push({
      band: bandLabel,
      profit: Math.round(profitInBand * 100) / 100,
      rate: band.rate,
      ni: Math.round(ni * 100) / 100,
    });

    total += ni;
  }

  return { breakdown, total: Math.round(total * 100) / 100 };
}

/**
 * Calculate full income tax liability for a given total income.
 */
function getFullTaxLiability(totalIncome: number, taxYear: TaxYearData): number {
  const pa = getEffectivePersonalAllowance(totalIncome, taxYear);
  const taxableIncome = Math.max(0, totalIncome - pa);
  const adjustedBands = getAdjustedIncomeTaxBands(pa, taxYear);
  const { total } = calculateIncomeTax(taxableIncome, adjustedBands);
  return total;
}

export function calculateSideHustleTax(input: SideHustleTaxInput): SideHustleTaxResult {
  const taxYear = taxData.getTaxYear(input.taxYear, input.region);
  const tradingAllowance = taxYear.tradingAllowance;

  // If side hustle income ≤ trading allowance, no tax owed on side hustle.
  // Side hustle profit = 0, so tax position = employment income only.
  // Still compute full income tax breakdown for display consistency.
  if (input.sideHustleGrossIncome <= tradingAllowance) {
    const totalGross = input.employmentIncome + input.sideHustleGrossIncome;
    const empPA = getEffectivePersonalAllowance(input.employmentIncome, taxYear);
    const empTaxable = Math.max(0, input.employmentIncome - empPA);
    const adjustedBands = getAdjustedIncomeTaxBands(empPA, taxYear);
    const { breakdown, total: empTax } = calculateIncomeTax(empTaxable, adjustedBands);

    return {
      totalGrossIncome: totalGross,
      sideHustleProfitBeforeAllowance: input.sideHustleGrossIncome,
      claimedDeduction: input.sideHustleGrossIncome,
      claimedDeductionType: 'tradingAllowance',
      sideHustleProfit: 0,
      totalTaxableIncome: empTaxable,
      personalAllowanceUsed: empPA,
      incomeTaxBreakdown: breakdown,
      totalIncomeTax: empTax,
      taxOnEmploymentOnly: empTax,
      class4NIBreakdown: [],
      totalClass4NI: 0,
      additionalTaxOwedOnSideHustle: 0,
      takeHomeFromSideHustle: input.sideHustleGrossIncome,
      effectiveTaxRateOnSideHustle: 0,
      flags: {
        belowTradingAllowance: true,
        requiresSelfAssessment: false,
        personalAllowanceTapered: false,
        crossesHigherRateThreshold: false,
      },
    };
  }

  // Determine deduction: trading allowance vs actual expenses
  let claimedDeduction: number;
  let claimedDeductionType: 'tradingAllowance' | 'actualExpenses';

  if (input.claimMode === 'tradingAllowance') {
    claimedDeduction = tradingAllowance;
    claimedDeductionType = 'tradingAllowance';
  } else if (input.claimMode === 'actualExpenses') {
    claimedDeduction = input.sideHustleExpenses;
    claimedDeductionType = 'actualExpenses';
  } else {
    // Auto: calculate both ways, pick lower tax
    const profitWithAllowance = input.sideHustleGrossIncome - tradingAllowance;
    const profitWithExpenses = input.sideHustleGrossIncome - input.sideHustleExpenses;

    if (profitWithAllowance <= profitWithExpenses) {
      claimedDeduction = tradingAllowance;
      claimedDeductionType = 'tradingAllowance';
    } else {
      claimedDeduction = input.sideHustleExpenses;
      claimedDeductionType = 'actualExpenses';
    }
  }

  const sideHustleProfit = Math.max(0, input.sideHustleGrossIncome - claimedDeduction);
  const totalGrossIncome = input.employmentIncome + sideHustleProfit;

  // Personal allowance (applied to total income including side hustle profit)
  const personalAllowanceUsed = getEffectivePersonalAllowance(totalGrossIncome, taxYear);
  const totalTaxableIncome = Math.max(0, totalGrossIncome - personalAllowanceUsed);

  // Income tax on total income (adjusted bands for PA taper)
  const adjustedBands = getAdjustedIncomeTaxBands(personalAllowanceUsed, taxYear);
  const { breakdown: incomeTaxBreakdown, total: totalIncomeTax } = calculateIncomeTax(
    totalTaxableIncome,
    adjustedBands
  );

  // Income tax on employment income alone
  const taxOnEmploymentOnly = getFullTaxLiability(input.employmentIncome, taxYear);

  // Additional income tax owed because of side hustle
  const additionalIncomeTax = Math.max(0, totalIncomeTax - taxOnEmploymentOnly);

  // Class 4 NI on side hustle profit
  const { breakdown: class4NIBreakdown, total: totalClass4NI } = calculateClass4NI(
    sideHustleProfit,
    taxYear.niSelfEmployedBands
  );

  // Total additional tax owed via Self Assessment
  const additionalTaxOwedOnSideHustle =
    Math.round((additionalIncomeTax + totalClass4NI) * 100) / 100;

  // Take-home from side hustle
  const takeHomeFromSideHustle =
    Math.round((input.sideHustleGrossIncome - input.sideHustleExpenses - additionalTaxOwedOnSideHustle) * 100) / 100;

  // Effective tax rate on side hustle gross income
  const effectiveTaxRateOnSideHustle =
    input.sideHustleGrossIncome > 0
      ? Math.round((additionalTaxOwedOnSideHustle / input.sideHustleGrossIncome) * 10000) / 10000
      : 0;

  // Flags
  const basicRateTop = taxYear.personalAllowance.amount + taxYear.incomeTaxBands[0].to!;
  const crossesHigherRate =
    input.employmentIncome < basicRateTop && totalGrossIncome > basicRateTop;

  return {
    totalGrossIncome,
    sideHustleProfitBeforeAllowance: input.sideHustleGrossIncome,
    claimedDeduction,
    claimedDeductionType,
    sideHustleProfit,
    totalTaxableIncome,
    personalAllowanceUsed,
    incomeTaxBreakdown,
    totalIncomeTax,
    taxOnEmploymentOnly,
    class4NIBreakdown,
    totalClass4NI,
    additionalTaxOwedOnSideHustle,
    takeHomeFromSideHustle,
    effectiveTaxRateOnSideHustle,
    flags: {
      belowTradingAllowance: false,
      requiresSelfAssessment: true,
      personalAllowanceTapered:
        personalAllowanceUsed < taxYear.personalAllowance.amount,
      crossesHigherRateThreshold: crossesHigherRate,
    },
  };
}
