import { taxData, DEFAULT_TAX_YEAR, getAdjustedIncomeTaxBands } from '../tax-data/index.ts';
import type { TaxYearData, TaxBand } from '../tax-data/types.ts';

/* ═══════════════════════ Types ═══════════════════════ */

export type StudentLoanPlan = 'plan1' | 'plan2' | 'plan4' | 'plan5' | 'postgraduate';
export type PensionType = 'auto-enrolment' | 'salary-sacrifice' | 'none';

export interface TakeHomePayInput {
  annualGrossSalary: number;
  pensionContributionPercent: number; // default 5
  pensionType: PensionType;
  studentLoanPlans: StudentLoanPlan[];
  taxCode: string; // default '1257L'
  isOverStatePensionAge: boolean; // default false
  taxYear?: string; // default '2026/27'
}

export interface TaxBandBreakdown {
  band: string;
  taxableAmount: number;
  rate: number;
  tax: number;
}

export interface NIBandBreakdown {
  band: string;
  amount: number;
  rate: number;
  ni: number;
}

export interface StudentLoanDeduction {
  plan: string;
  deduction: number;
}

export interface TakeHomePayResult {
  // Gross
  annualGross: number;

  // Pension
  pensionContribution: number;
  pensionEmployer: number;
  pensionableEarnings: number;
  pensionType: string;

  // Taxable income
  taxableIncome: number;
  personalAllowance: number;

  // Income tax
  incomeTax: number;
  incomeTaxBreakdown: TaxBandBreakdown[];

  // National Insurance
  nationalInsurance: number;
  niBreakdown: NIBandBreakdown[];

  // Student loans
  studentLoanDeductions: StudentLoanDeduction[];
  totalStudentLoan: number;

  // Final
  totalDeductions: number;
  annualTakeHome: number;
  monthlyTakeHome: number;
  weeklyTakeHome: number;
  dailyTakeHome: number;
  hourlyTakeHome: number;

  // Rates
  effectiveTaxRate: number;
  marginalTaxRate: number;
}

/* ═══════════════════════ Helpers ═══════════════════════ */

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Parse a UK tax code to determine personal allowance */
function parseTaxCode(code: string, defaultPA: number): { type: 'numeric'; pa: number } | { type: 'special'; code: string } {
  const upper = code.toUpperCase().trim();

  if (upper === 'BR') return { type: 'special', code: 'BR' };
  if (upper === 'D0') return { type: 'special', code: 'D0' };
  if (upper === 'D1') return { type: 'special', code: 'D1' };
  if (upper === 'NT') return { type: 'special', code: 'NT' };

  // K code: negative PA
  const kMatch = upper.match(/^K(\d+)$/);
  if (kMatch) return { type: 'numeric', pa: -(Number(kMatch[1]) * 10) };

  // Standard numeric code (e.g. 1257L, 1100L, 1257M, 1257T etc.)
  const numMatch = upper.match(/^(\d+)[LMNTY]$/);
  if (numMatch) return { type: 'numeric', pa: Number(numMatch[1]) * 10 };

  // Fallback: try to parse just digits
  const digits = upper.match(/^(\d+)/);
  if (digits) return { type: 'numeric', pa: Number(digits[1]) * 10 };

  // Unsupported
  return { type: 'numeric', pa: defaultPA };
}

/** Calculate effective PA after taper */
function getEffectivePA(adjustedNetIncome: number, basePa: number, rates: TaxYearData): number {
  if (basePa <= 0) return basePa; // K codes stay negative, no taper
  if (adjustedNetIncome <= rates.personalAllowance.taperStart) return basePa;

  const excess = adjustedNetIncome - rates.personalAllowance.taperStart;
  const reduction = Math.floor(excess / rates.personalAllowance.taperRate);
  return Math.max(0, basePa - reduction);
}

/** Calculate income tax on taxable income using progressive bands */
function calcIncomeTax(taxableIncome: number, bands: TaxBand[]): { breakdown: TaxBandBreakdown[]; total: number } {
  const breakdown: TaxBandBreakdown[] = [];
  let total = 0;
  let remaining = Math.max(0, taxableIncome);

  for (const band of bands) {
    if (remaining <= 0) break;
    const width = band.to !== null ? band.to - band.from : Infinity;
    const inBand = Math.min(remaining, width);
    const tax = inBand * band.rate;

    const label = band.to !== null
      ? `£${band.from.toLocaleString()} – £${(band.from + width).toLocaleString()}`
      : `Above £${band.from.toLocaleString()}`;

    breakdown.push({ band: label, taxableAmount: round2(inBand), rate: band.rate, tax: round2(tax) });
    total += tax;
    remaining -= inBand;
  }

  return { breakdown, total: round2(total) };
}

/** Calculate income tax for special codes */
function calcSpecialCodeTax(gross: number, code: string): { breakdown: TaxBandBreakdown[]; total: number } {
  if (code === 'NT') return { breakdown: [], total: 0 };

  const rateMap: Record<string, number> = { BR: 0.20, D0: 0.40, D1: 0.45 };
  const rate = rateMap[code] ?? 0.20;
  const tax = round2(gross * rate);

  return {
    breakdown: [{ band: `All income (${code})`, taxableAmount: round2(gross), rate, tax }],
    total: tax,
  };
}

/** Calculate employee NI (Class 1) */
function calcEmployeeNI(salary: number, bands: TaxBand[]): { breakdown: NIBandBreakdown[]; total: number } {
  const breakdown: NIBandBreakdown[] = [];
  let total = 0;

  for (const band of bands) {
    if (band.rate === 0) continue;
    const lower = band.from;
    const upper = band.to ?? Infinity;
    if (salary <= lower) continue;

    const inBand = Math.min(salary, upper) - lower;
    const ni = inBand * band.rate;

    const label = band.to !== null
      ? `£${lower.toLocaleString()} – £${upper.toLocaleString()}`
      : `Above £${lower.toLocaleString()}`;

    breakdown.push({ band: label, amount: round2(inBand), rate: band.rate, ni: round2(ni) });
    total += ni;
  }

  return { breakdown, total: round2(total) };
}

/** Calculate student loan repayments */
function calcStudentLoans(grossSalary: number, plans: StudentLoanPlan[], rates: TaxYearData): StudentLoanDeduction[] {
  const loanData: Record<string, { threshold: number; rate: number; label: string }> = {
    plan1: { ...rates.studentLoan.plan1, label: 'Plan 1' },
    plan2: { ...rates.studentLoan.plan2, label: 'Plan 2' },
    plan4: { ...rates.studentLoan.plan4, label: 'Plan 4' },
    plan5: { ...rates.studentLoan.plan5, label: 'Plan 5' },
    postgraduate: { ...rates.studentLoan.postgrad, label: 'Postgraduate' },
  };

  return plans.map((plan) => {
    const data = loanData[plan];
    if (!data || grossSalary <= data.threshold) return { plan: data?.label ?? plan, deduction: 0 };
    return { plan: data.label, deduction: round2((grossSalary - data.threshold) * data.rate) };
  });
}

/** Calculate pension contributions */
function calcPension(
  grossSalary: number,
  percent: number,
  pensionType: PensionType,
  rates: TaxYearData
): { employeeContribution: number; employerContribution: number; pensionableEarnings: number } {
  if (pensionType === 'none' || percent <= 0) {
    return { employeeContribution: 0, employerContribution: 0, pensionableEarnings: 0 };
  }

  const pLower = rates.pension.qualifyingEarningsLower;
  const pUpper = rates.pension.qualifyingEarningsUpper;

  if (pensionType === 'salary-sacrifice') {
    // Salary sacrifice: percentage of gross salary
    const employeeContribution = round2(grossSalary * (percent / 100));
    const employerContribution = round2(grossSalary * rates.pension.defaultEmployerRate);
    return { employeeContribution, employerContribution, pensionableEarnings: grossSalary };
  }

  // Auto-enrolment: percentage of qualifying earnings
  const qualifyingEarnings = Math.max(0, Math.min(grossSalary, pUpper) - pLower);
  const employeeContribution = round2(qualifyingEarnings * (percent / 100));
  const employerContribution = round2(qualifyingEarnings * rates.pension.defaultEmployerRate);
  return { employeeContribution, employerContribution, pensionableEarnings: qualifyingEarnings };
}

/* ═══════════════════════ Main Calculation ═══════════════════════ */

export function calculateTakeHomePay(input: TakeHomePayInput): TakeHomePayResult {
  const year = input.taxYear ?? DEFAULT_TAX_YEAR;
  const rates = taxData.getTaxYear(year, 'EWN');

  const gross = Math.max(0, input.annualGrossSalary);

  // 1. Pension
  const pension = calcPension(gross, input.pensionContributionPercent, input.pensionType, rates);

  // 2. Adjusted gross for tax/NI (reduced by salary sacrifice only)
  const isSalarySacrifice = input.pensionType === 'salary-sacrifice';
  const adjustedGross = isSalarySacrifice ? gross - pension.employeeContribution : gross;

  // 3. Parse tax code
  const parsedCode = parseTaxCode(input.taxCode, rates.personalAllowance.amount);

  // 4. Income tax
  let incomeTaxResult: { breakdown: TaxBandBreakdown[]; total: number };
  let effectivePA: number;

  if (parsedCode.type === 'special') {
    effectivePA = 0;
    incomeTaxResult = calcSpecialCodeTax(adjustedGross, parsedCode.code);
  } else {
    // Apply PA taper based on adjusted net income
    effectivePA = getEffectivePA(adjustedGross, parsedCode.pa, rates);
    const taxableIncome = Math.max(0, adjustedGross - effectivePA);
    const adjustedBands = getAdjustedIncomeTaxBands(effectivePA, rates);
    incomeTaxResult = calcIncomeTax(taxableIncome, adjustedBands);
  }

  // 5. National Insurance
  let niResult: { breakdown: NIBandBreakdown[]; total: number };
  if (input.isOverStatePensionAge) {
    niResult = { breakdown: [], total: 0 };
  } else {
    niResult = calcEmployeeNI(adjustedGross, rates.niEmployeeBands);
  }

  // 6. Student loans (calculated on gross salary, NOT reduced by salary sacrifice)
  const studentLoanDeductions = calcStudentLoans(gross, input.studentLoanPlans, rates);
  const totalStudentLoan = round2(studentLoanDeductions.reduce((sum, d) => sum + d.deduction, 0));

  // 7. Take-home calculation
  let annualTakeHome: number;
  if (isSalarySacrifice) {
    // Salary sacrifice: gross - sacrifice = adjustedGross, then deduct tax + NI + student loans
    annualTakeHome = adjustedGross - incomeTaxResult.total - niResult.total - totalStudentLoan;
  } else {
    // Auto-enrolment or none: gross - tax - NI - student loans - pension
    annualTakeHome = gross - incomeTaxResult.total - niResult.total - totalStudentLoan - pension.employeeContribution;
  }
  annualTakeHome = round2(annualTakeHome);

  const totalDeductions = round2(gross - annualTakeHome);

  // 8. Period breakdowns
  const monthlyTakeHome = round2(annualTakeHome / 12);
  const weeklyTakeHome = round2(annualTakeHome / 52);
  const dailyTakeHome = round2(annualTakeHome / 260);
  const hourlyTakeHome = round2(annualTakeHome / 1950);

  // 9. Effective tax rate
  const effectiveTaxRate = gross > 0 ? round2((totalDeductions / gross) * 10000) / 10000 : 0;

  // 10. Marginal tax rate (tax on the next £1)
  const marginalResult = calculateTakeHomePayInternal({
    ...input,
    annualGrossSalary: gross + 1,
  }, rates);
  const takeHomeOnePound = marginalResult.annualTakeHome;
  const marginalKeep = round2(takeHomeOnePound - annualTakeHome);
  const marginalRate = round2(1 - marginalKeep);

  // Taxable income for display
  const taxableIncome = parsedCode.type === 'special'
    ? adjustedGross
    : Math.max(0, adjustedGross - effectivePA);

  return {
    annualGross: gross,
    pensionContribution: pension.employeeContribution,
    pensionEmployer: pension.employerContribution,
    pensionableEarnings: pension.pensionableEarnings,
    pensionType: input.pensionType,
    taxableIncome,
    personalAllowance: effectivePA,
    incomeTax: incomeTaxResult.total,
    incomeTaxBreakdown: incomeTaxResult.breakdown,
    nationalInsurance: niResult.total,
    niBreakdown: niResult.breakdown,
    studentLoanDeductions,
    totalStudentLoan,
    totalDeductions,
    annualTakeHome,
    monthlyTakeHome,
    weeklyTakeHome,
    dailyTakeHome,
    hourlyTakeHome,
    effectiveTaxRate,
    marginalTaxRate: marginalRate,
  };
}

/** Internal version that doesn't recurse for marginal rate */
function calculateTakeHomePayInternal(input: TakeHomePayInput, rates: TaxYearData): { annualTakeHome: number } {
  const gross = Math.max(0, input.annualGrossSalary);
  const pension = calcPension(gross, input.pensionContributionPercent, input.pensionType, rates);
  const isSalarySacrifice = input.pensionType === 'salary-sacrifice';
  const adjustedGross = isSalarySacrifice ? gross - pension.employeeContribution : gross;

  const parsedCode = parseTaxCode(input.taxCode, rates.personalAllowance.amount);

  let incomeTax: number;
  if (parsedCode.type === 'special') {
    incomeTax = calcSpecialCodeTax(adjustedGross, parsedCode.code).total;
  } else {
    const effectivePA = getEffectivePA(adjustedGross, parsedCode.pa, rates);
    const taxableIncome = Math.max(0, adjustedGross - effectivePA);
    const adjustedBands = getAdjustedIncomeTaxBands(effectivePA, rates);
    incomeTax = calcIncomeTax(taxableIncome, adjustedBands).total;
  }

  const ni = input.isOverStatePensionAge ? 0 : calcEmployeeNI(adjustedGross, rates.niEmployeeBands).total;
  const studentLoanDeductions = calcStudentLoans(gross, input.studentLoanPlans, rates);
  const totalStudentLoan = round2(studentLoanDeductions.reduce((sum, d) => sum + d.deduction, 0));

  let annualTakeHome: number;
  if (isSalarySacrifice) {
    annualTakeHome = adjustedGross - incomeTax - ni - totalStudentLoan;
  } else {
    annualTakeHome = gross - incomeTax - ni - totalStudentLoan - pension.employeeContribution;
  }

  return { annualTakeHome: round2(annualTakeHome) };
}
