import { taxData, getEffectivePersonalAllowance, getAdjustedIncomeTaxBands } from '../tax-data/index.ts';
import type { TaxYearData } from '../tax-data/types.ts';
import { DEFAULT_TAX_YEAR } from '../tax-data/index.ts';

// ─── Input / Output Types ────────────────────────────────────────────

export interface SoleTraderVsLtdInput {
  annualProfit: number;
  hasEmploymentAllowance: boolean;
  accountingCosts: number;
  taxYear?: string;
}

export interface TaxBandBreakdown {
  band: string;
  amount: number;
  rate: number;
  tax: number;
}

export interface NIBandBreakdown {
  band: string;
  amount: number;
  rate: number;
  ni: number;
}

export interface SoleTraderResult {
  grossProfit: number;
  personalAllowance: number;
  incomeTax: number;
  incomeTaxBreakdown: TaxBandBreakdown[];
  class2NI: number;
  class4NI: number;
  class4Breakdown: NIBandBreakdown[];
  totalTax: number;
  takeHome: number;
  effectiveRate: number;
}

export interface LtdCompanyResult {
  grossProfit: number;
  directorSalary: number;
  employerNI: number;
  employmentAllowanceUsed: number;
  netEmployerNI: number;
  corporationTaxableProfit: number;
  corporationTax: number;
  corporationTaxRate: string;
  marginalRelief: number;
  profitAfterCT: number;
  dividendsPaid: number;
  dividendAllowance: number;
  dividendTax: number;
  dividendTaxBreakdown: TaxBandBreakdown[];
  personalIncomeTax: number;
  personalNI: number;
  accountingCosts: number;
  totalTax: number;
  totalCosts: number;
  takeHome: number;
  effectiveRate: number;
}

export interface ComparisonResult {
  annualSaving: number;
  monthlySaving: number;
  betterOption: 'sole-trader' | 'ltd-company' | 'similar';
  crossoverPoint: number;
  breakdownMessage: string;
}

export interface SoleTraderVsLtdResult {
  soleTrader: SoleTraderResult;
  ltdCompany: LtdCompanyResult;
  comparison: ComparisonResult;
}

// ─── Helpers ─────────────────────────────────────────────────────────

const round2 = (n: number) => Math.round(n * 100) / 100;

function bandLabel(from: number, to: number | null): string {
  if (to !== null) {
    return `£${from.toLocaleString()} – £${to.toLocaleString()}`;
  }
  return `Above £${from.toLocaleString()}`;
}

/** Calculate income tax using progressive bands */
function calcIncomeTax(
  taxableIncome: number,
  bands: { from: number; to: number | null; rate: number }[]
): { breakdown: TaxBandBreakdown[]; total: number } {
  const breakdown: TaxBandBreakdown[] = [];
  let total = 0;
  let remaining = Math.max(0, taxableIncome);

  for (const band of bands) {
    if (remaining <= 0) break;
    const width = band.to !== null ? band.to - band.from : Infinity;
    const amount = Math.min(remaining, width);
    const tax = amount * band.rate;

    breakdown.push({
      band: bandLabel(band.from, band.to !== null ? band.from + width : null),
      amount: round2(amount),
      rate: band.rate,
      tax: round2(tax),
    });

    total += tax;
    remaining -= amount;
  }

  return { breakdown, total: round2(total) };
}

// ─── Sole Trader Calculation ─────────────────────────────────────────

function calcSoleTrader(profit: number, rates: TaxYearData): SoleTraderResult {
  const pa = getEffectivePersonalAllowance(profit, rates);
  const taxableIncome = Math.max(0, profit - pa);
  const adjustedBands = getAdjustedIncomeTaxBands(pa, rates);
  const { breakdown: itBreakdown, total: incomeTax } = calcIncomeTax(
    taxableIncome,
    adjustedBands
  );

  // Class 2 NI: since April 2024, no longer required (automatic NI credits)
  const class2NI = 0;

  // Class 4 NI
  const c4 = rates.selfEmployedNI;
  const c4Breakdown: NIBandBreakdown[] = [];
  let class4NI = 0;

  if (profit > c4.class4LowerLimit) {
    const mainBandProfit = Math.min(profit, c4.class4UpperLimit) - c4.class4LowerLimit;
    if (mainBandProfit > 0) {
      const ni = mainBandProfit * c4.class4MainRate;
      c4Breakdown.push({
        band: `£${c4.class4LowerLimit.toLocaleString()} – £${c4.class4UpperLimit.toLocaleString()}`,
        amount: round2(mainBandProfit),
        rate: c4.class4MainRate,
        ni: round2(ni),
      });
      class4NI += ni;
    }

    if (profit > c4.class4UpperLimit) {
      const additionalProfit = profit - c4.class4UpperLimit;
      const ni = additionalProfit * c4.class4AdditionalRate;
      c4Breakdown.push({
        band: `Above £${c4.class4UpperLimit.toLocaleString()}`,
        amount: round2(additionalProfit),
        rate: c4.class4AdditionalRate,
        ni: round2(ni),
      });
      class4NI += ni;
    }
  }

  class4NI = round2(class4NI);
  const totalTax = round2(incomeTax + class2NI + class4NI);
  const takeHome = round2(profit - totalTax);

  return {
    grossProfit: profit,
    personalAllowance: pa,
    incomeTax,
    incomeTaxBreakdown: itBreakdown,
    class2NI,
    class4NI,
    class4Breakdown: c4Breakdown,
    totalTax,
    takeHome,
    effectiveRate: profit > 0 ? round2(totalTax / profit * 10000) / 10000 : 0,
  };
}

// ─── Ltd Company Calculation ─────────────────────────────────────────

function calcLtdCompany(
  profit: number,
  hasEA: boolean,
  accountingCosts: number,
  rates: TaxYearData
): LtdCompanyResult {
  const eni = rates.employerNI;
  const idealSalary = rates.personalAllowance.amount; // £12,570

  // Cap salary: company must afford salary + net employer NI from profit
  // Iteratively find max salary the company can pay
  let directorSalary = Math.min(idealSalary, profit);

  // Calculate employer NI on salary
  let grossEmployerNI = Math.max(0, directorSalary - eni.secondaryThreshold) * eni.rate;
  let employmentAllowanceUsed = hasEA ? Math.min(grossEmployerNI, eni.employmentAllowance) : 0;
  let netEmployerNI = round2(grossEmployerNI - employmentAllowanceUsed);

  // If salary + net employer NI exceeds profit, reduce salary
  if (directorSalary + netEmployerNI > profit) {
    // Solve: salary + max(0, (salary - ST) * rate - EA_used) = profit
    // Simplify: try salary = profit (employer NI additional cost may reduce it)
    directorSalary = Math.max(0, profit - netEmployerNI);
    // Recalculate employer NI with adjusted salary
    grossEmployerNI = Math.max(0, directorSalary - eni.secondaryThreshold) * eni.rate;
    employmentAllowanceUsed = hasEA ? Math.min(grossEmployerNI, eni.employmentAllowance) : 0;
    netEmployerNI = round2(grossEmployerNI - employmentAllowanceUsed);
  }

  directorSalary = round2(directorSalary);
  grossEmployerNI = round2(grossEmployerNI);

  // CT taxable profit: profit minus salary and NET employer NI (what's actually paid)
  const ctTaxableProfit = round2(Math.max(0, profit - directorSalary - netEmployerNI));
  const ct = rates.corporationTax;

  let corporationTax: number;
  let marginalRelief = 0;
  let ctRateLabel: string;

  if (ctTaxableProfit <= ct.smallProfitsLimit) {
    corporationTax = ctTaxableProfit * ct.smallProfitsRate;
    ctRateLabel = `${(ct.smallProfitsRate * 100).toFixed(0)}% (small profits)`;
  } else if (ctTaxableProfit >= ct.mainRateThreshold) {
    corporationTax = ctTaxableProfit * ct.mainRate;
    ctRateLabel = `${(ct.mainRate * 100).toFixed(0)}% (main rate)`;
  } else {
    // Marginal relief band
    corporationTax = ctTaxableProfit * ct.mainRate;
    marginalRelief = (ct.mainRateThreshold - ctTaxableProfit) * ct.marginalReliefFraction;
    corporationTax -= marginalRelief;
    const effectiveCTRate = ctTaxableProfit > 0 ? (corporationTax / ctTaxableProfit) * 100 : 0;
    ctRateLabel = `${effectiveCTRate.toFixed(1)}% (marginal relief)`;
  }

  corporationTax = round2(corporationTax);
  marginalRelief = round2(marginalRelief);

  const profitAfterCT = round2(ctTaxableProfit - corporationTax);

  // Dividends: all remaining post-CT profit distributed
  const dividendsPaid = profitAfterCT;

  // Personal tax on director income (salary + dividends)
  const totalPersonalIncome = directorSalary + dividendsPaid;
  const personalPA = getEffectivePersonalAllowance(totalPersonalIncome, rates);

  // Salary taxable (after PA)
  const salaryTaxable = Math.max(0, directorSalary - personalPA);

  // Income tax on salary portion (at normal rates)
  let personalIncomeTax = 0;
  if (salaryTaxable > 0) {
    const adjustedBands = getAdjustedIncomeTaxBands(personalPA, rates);
    const { total } = calcIncomeTax(salaryTaxable, adjustedBands);
    personalIncomeTax = total;
  }

  // Employee NI on salary: £0 since salary = PA = primary threshold
  const personalNI = 0;

  // Dividend tax calculation
  const basicBandWidth = rates.incomeTaxBands[0].to!; // 37700
  // Dynamic higher band width — adjusts when PA is tapered
  const higherBandWidth = Math.max(0, 125140 - personalPA - basicBandWidth);
  const dividendAllowance = rates.dividendTax.allowance;

  // How much of basic band used by salary
  const basicBandUsedBySalary = salaryTaxable;
  const basicBandForDividends = Math.max(0, basicBandWidth - basicBandUsedBySalary);

  const divBreakdown: TaxBandBreakdown[] = [];
  let dividendTax = 0;
  let remainingDividends = dividendsPaid;

  // Dividend allowance (0% — uses band space)
  const inAllowance = Math.min(remainingDividends, dividendAllowance);
  if (inAllowance > 0) {
    divBreakdown.push({
      band: 'Dividend allowance',
      amount: round2(inAllowance),
      rate: 0,
      tax: 0,
    });
    remainingDividends -= inAllowance;
  }
  let bandSpaceUsed = inAllowance;

  // Basic rate dividends
  const basicAvailable = Math.max(0, basicBandForDividends - bandSpaceUsed);
  const inBasic = Math.min(remainingDividends, basicAvailable);
  if (inBasic > 0) {
    const tax = inBasic * rates.dividendTax.basic;
    divBreakdown.push({
      band: 'Basic rate',
      amount: round2(inBasic),
      rate: rates.dividendTax.basic,
      tax: round2(tax),
    });
    dividendTax += tax;
    remainingDividends -= inBasic;
  }

  // Higher rate dividends
  const inHigher = Math.min(remainingDividends, higherBandWidth);
  if (inHigher > 0) {
    const tax = inHigher * rates.dividendTax.higher;
    divBreakdown.push({
      band: 'Higher rate',
      amount: round2(inHigher),
      rate: rates.dividendTax.higher,
      tax: round2(tax),
    });
    dividendTax += tax;
    remainingDividends -= inHigher;
  }

  // Additional rate dividends
  if (remainingDividends > 0) {
    const tax = remainingDividends * rates.dividendTax.additional;
    divBreakdown.push({
      band: 'Additional rate',
      amount: round2(remainingDividends),
      rate: rates.dividendTax.additional,
      tax: round2(tax),
    });
    dividendTax += tax;
    remainingDividends = 0;
  }

  dividendTax = round2(dividendTax);

  // Totals
  const totalTax = round2(corporationTax + dividendTax + personalIncomeTax + netEmployerNI);
  const totalCosts = round2(totalTax + accountingCosts);
  const takeHome = round2(directorSalary + dividendsPaid - dividendTax - personalIncomeTax - accountingCosts);

  return {
    grossProfit: profit,
    directorSalary,
    employerNI: round2(grossEmployerNI),
    employmentAllowanceUsed: round2(employmentAllowanceUsed),
    netEmployerNI,
    corporationTaxableProfit: round2(ctTaxableProfit),
    corporationTax,
    corporationTaxRate: ctRateLabel,
    marginalRelief,
    profitAfterCT,
    dividendsPaid: round2(dividendsPaid),
    dividendAllowance,
    dividendTax,
    dividendTaxBreakdown: divBreakdown,
    personalIncomeTax,
    personalNI,
    accountingCosts,
    totalTax,
    totalCosts,
    takeHome,
    effectiveRate: profit > 0 ? round2(totalTax / profit * 10000) / 10000 : 0,
  };
}

// ─── Crossover Finder ────────────────────────────────────────────────

function findCrossoverPoint(
  hasEA: boolean,
  accountingCosts: number,
  rates: TaxYearData
): number {
  for (let p = 1000; p <= 500000; p += 1000) {
    const st = calcSoleTrader(p, rates);
    const ltd = calcLtdCompany(p, hasEA, accountingCosts, rates);
    if (ltd.takeHome > st.takeHome) {
      return p;
    }
  }
  return 0; // Never crosses (or beyond £500k)
}

// ─── Main Export ─────────────────────────────────────────────────────

export function calculateSoleTraderVsLtd(
  input: SoleTraderVsLtdInput
): SoleTraderVsLtdResult {
  const year = input.taxYear || DEFAULT_TAX_YEAR;
  const rates = taxData.getTaxYear(year, 'EWN');

  const soleTrader = calcSoleTrader(input.annualProfit, rates);
  const ltdCompany = calcLtdCompany(
    input.annualProfit,
    input.hasEmploymentAllowance,
    input.accountingCosts,
    rates
  );

  const saving = round2(ltdCompany.takeHome - soleTrader.takeHome);
  const absSaving = Math.abs(saving);

  let betterOption: 'sole-trader' | 'ltd-company' | 'similar';
  let breakdownMessage: string;

  if (absSaving < 500) {
    betterOption = 'similar';
    breakdownMessage = `Both structures produce similar take-home pay (within £${absSaving} per year). Consider non-tax factors like liability protection, admin overhead, and professional image.`;
  } else if (saving > 0) {
    betterOption = 'ltd-company';
    breakdownMessage = `A limited company saves you £${saving.toLocaleString()} per year (£${round2(saving / 12).toLocaleString()}/month) after accounting for corporation tax, dividend tax, and £${input.accountingCosts.toLocaleString()} in company running costs.`;
  } else {
    betterOption = 'sole-trader';
    breakdownMessage = `Staying as a sole trader saves you £${absSaving.toLocaleString()} per year. The limited company's additional costs (accounting, admin, employer NI) outweigh the tax benefit at this profit level.`;
  }

  const crossoverPoint = findCrossoverPoint(
    input.hasEmploymentAllowance,
    input.accountingCosts,
    rates
  );

  return {
    soleTrader,
    ltdCompany,
    comparison: {
      annualSaving: saving,
      monthlySaving: round2(saving / 12),
      betterOption,
      crossoverPoint,
      breakdownMessage,
    },
  };
}
