import { taxData, getEffectivePersonalAllowance, getAdjustedIncomeTaxBands } from '../tax-data/index.ts';
import type { TaxYearData, TaxBand } from '../tax-data/types.ts';

export interface DividendTaxInput {
  taxYear: string;         // "2026/27" or "2025/26"
  otherIncome: number;     // salary / employment / pensions / rental etc.
  dividendIncome: number;  // gross dividends
}

export interface DividendBandBreakdown {
  band: string;
  amount: number;
  rate: number;
  tax: number;
}

export interface DividendTaxResult {
  // Inputs echoed
  totalIncome: number;
  otherIncome: number;
  dividendIncome: number;

  // Personal Allowance
  personalAllowance: number;
  personalAllowanceTapered: boolean;

  // Other income tax (for context)
  taxableOtherIncome: number;
  incomeTaxOnOtherIncome: number;

  // Dividend breakdown
  dividendsCoveredByPA: number;
  taxableDividends: number;
  dividendAllowanceUsed: number;
  dividendBandBreakdown: DividendBandBreakdown[];
  totalDividendTax: number;
  effectiveDividendTaxRate: number; // 0-1

  // Marginal rate
  marginalDividendRate: number; // rate on next £1 of dividends

  // Reporting
  reportingRequirement: 'none' | 'paye-or-sa' | 'self-assessment';

  // Tax year info
  taxYear: string;
  dividendAllowance: number;
  basicRate: number;
  higherRate: number;
  additionalRate: number;
}

/** Basic rate band width (constant across both years) */
const BASIC_BAND_WIDTH = 37700;
/** Gross income threshold where additional rate begins (constant) */
const ADDITIONAL_GROSS_THRESHOLD = 125140;

export function calculateDividendTax(input: DividendTaxInput): DividendTaxResult {
  const taxYear = taxData.getTaxYear(input.taxYear, 'EWN');
  const div = taxYear.dividendTax;

  const totalIncome = input.otherIncome + input.dividendIncome;

  // 1. Personal Allowance (based on TOTAL income including dividends)
  const pa = getEffectivePersonalAllowance(totalIncome, taxYear);
  const personalAllowanceTapered = pa < taxYear.personalAllowance.amount;

  // Dynamic higher band width — adjusts when PA is tapered
  // At PA=12570: 125140-12570-37700 = 74870 (matches JSON band boundary 112570-37700)
  // At PA=0: 125140-0-37700 = 87440 (wider higher band, additional starts later in taxable space)
  const higherBandWidth = Math.max(0, ADDITIONAL_GROSS_THRESHOLD - pa - BASIC_BAND_WIDTH);

  // 2. Allocate PA to other income first, remainder to dividends
  const paUsedByOtherIncome = Math.min(input.otherIncome, pa);
  const paRemainingForDividends = pa - paUsedByOtherIncome;
  const dividendsCoveredByPA = Math.min(input.dividendIncome, paRemainingForDividends);

  // 3. Taxable amounts
  const taxableOtherIncome = Math.max(0, input.otherIncome - paUsedByOtherIncome);
  const taxableDividends = Math.max(0, input.dividendIncome - dividendsCoveredByPA);

  // 4. Income tax on other income (for context display, with adjusted bands for PA taper)
  const adjustedBands = getAdjustedIncomeTaxBands(pa, taxYear);
  const incomeTaxOnOtherIncome = calculateIncomeTaxOnAmount(taxableOtherIncome, adjustedBands);

  // 5. Determine how much band space other income uses
  const otherInBasic = Math.min(taxableOtherIncome, BASIC_BAND_WIDTH);
  const otherInHigher = Math.min(Math.max(0, taxableOtherIncome - BASIC_BAND_WIDTH), higherBandWidth);

  // 6. Remaining band space for dividends
  let basicRemaining = BASIC_BAND_WIDTH - otherInBasic;
  const higherRemaining = higherBandWidth - otherInHigher;

  // 7. Apply dividend allowance
  const dividendAllowanceUsed = Math.min(div.allowance, taxableDividends);
  // Allowance uses band space even though taxed at 0%
  const allowanceFromBasic = Math.min(dividendAllowanceUsed, basicRemaining);
  basicRemaining -= allowanceFromBasic;
  const allowanceRemainder = dividendAllowanceUsed - allowanceFromBasic;
  const allowanceFromHigher = Math.min(allowanceRemainder, higherRemaining);
  const higherRemainingAfterAllowance = higherRemaining - allowanceFromHigher;
  // Any remaining allowance spills into additional band (unlimited, no tracking needed)

  // 8. Allocate remaining dividends to bands
  const dividendsAfterAllowance = taxableDividends - dividendAllowanceUsed;

  const divsInBasic = Math.min(dividendsAfterAllowance, basicRemaining);
  const divsInHigher = Math.min(
    Math.max(0, dividendsAfterAllowance - divsInBasic),
    higherRemainingAfterAllowance
  );
  const divsInAdditional = Math.max(0, dividendsAfterAllowance - divsInBasic - divsInHigher);

  // 9. Calculate tax
  const taxBasic = round2(divsInBasic * div.basic);
  const taxHigher = round2(divsInHigher * div.higher);
  const taxAdditional = round2(divsInAdditional * div.additional);
  const totalDividendTax = round2(taxBasic + taxHigher + taxAdditional);

  // 10. Build breakdown
  const breakdown: DividendBandBreakdown[] = [];

  if (dividendsCoveredByPA > 0) {
    breakdown.push({
      band: 'Personal Allowance',
      amount: round2(dividendsCoveredByPA),
      rate: 0,
      tax: 0,
    });
  }

  if (dividendAllowanceUsed > 0) {
    breakdown.push({
      band: 'Dividend Allowance',
      amount: round2(dividendAllowanceUsed),
      rate: 0,
      tax: 0,
    });
  }

  if (divsInBasic > 0) {
    breakdown.push({
      band: 'Basic rate',
      amount: round2(divsInBasic),
      rate: div.basic,
      tax: taxBasic,
    });
  }

  if (divsInHigher > 0) {
    breakdown.push({
      band: 'Higher rate',
      amount: round2(divsInHigher),
      rate: div.higher,
      tax: taxHigher,
    });
  }

  if (divsInAdditional > 0) {
    breakdown.push({
      band: 'Additional rate',
      amount: round2(divsInAdditional),
      rate: div.additional,
      tax: taxAdditional,
    });
  }

  // 11. Effective rate
  const effectiveDividendTaxRate =
    input.dividendIncome > 0 ? round4(totalDividendTax / input.dividendIncome) : 0;

  // 12. Marginal rate — what rate would the NEXT £1 of dividend be taxed at?
  const totalTaxableUsed = taxableOtherIncome + taxableDividends;
  let marginalDividendRate: number;
  if (totalTaxableUsed < BASIC_BAND_WIDTH) {
    // Still in basic band (or allowance if dividends small)
    if (taxableDividends < div.allowance) {
      marginalDividendRate = 0; // still within dividend allowance
    } else {
      marginalDividendRate = div.basic;
    }
  } else if (totalTaxableUsed < BASIC_BAND_WIDTH + higherBandWidth) {
    marginalDividendRate = div.higher;
  } else {
    marginalDividendRate = div.additional;
  }

  // If dividends are 0 and PA isn't used up, next dividend would be at 0% (PA)
  if (input.dividendIncome === 0 && pa > input.otherIncome) {
    marginalDividendRate = 0;
  }

  // 13. Reporting requirement
  let reportingRequirement: 'none' | 'paye-or-sa' | 'self-assessment';
  if (input.dividendIncome <= div.allowance) {
    reportingRequirement = 'none';
  } else if (input.dividendIncome <= 10000) {
    reportingRequirement = 'paye-or-sa';
  } else {
    reportingRequirement = 'self-assessment';
  }

  return {
    totalIncome,
    otherIncome: input.otherIncome,
    dividendIncome: input.dividendIncome,
    personalAllowance: pa,
    personalAllowanceTapered,
    taxableOtherIncome,
    incomeTaxOnOtherIncome,
    dividendsCoveredByPA,
    taxableDividends,
    dividendAllowanceUsed,
    dividendBandBreakdown: breakdown,
    totalDividendTax,
    effectiveDividendTaxRate,
    marginalDividendRate,
    reportingRequirement,
    taxYear: input.taxYear,
    dividendAllowance: div.allowance,
    basicRate: div.basic,
    higherRate: div.higher,
    additionalRate: div.additional,
  };
}

/** Calculate income tax on a taxable amount using (adjusted) bands */
function calculateIncomeTaxOnAmount(taxableIncome: number, bands: TaxBand[]): number {
  let remaining = Math.max(0, taxableIncome);
  let total = 0;

  for (const band of bands) {
    if (remaining <= 0) break;
    const bandWidth = band.to !== null ? band.to - band.from : Infinity;
    const inBand = Math.min(remaining, bandWidth);
    total += inBand * band.rate;
    remaining -= inBand;
  }

  return round2(total);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
