// Trading Allowance Checker — pure logic, no side effects
// 2026/27 rules: £1,000 trading allowance, SA threshold, MTD thresholds

export type IncomeType = 'trading' | 'personal-sales' | 'employment' | 'rental' | 'unsure';

export type Verdict =
  | 'fully-covered'
  | 'register-claim-allowance'
  | 'register-claim-expenses'
  | 'not-eligible'
  | 'not-trading';

export interface TradingAllowanceInput {
  incomeType: IncomeType;
  anyIncomeFromEmployer: boolean;
  anyIncomeFromPartnership: boolean;
  anyIncomeFromOwnCompany: boolean;
  grossTradingIncome: number;
  actualExpenses: number;
  platforms: string[];
  hasOtherSelfAssessmentReason: boolean;
  taxYear?: string;
}

export interface TradingAllowanceResult {
  verdict: Verdict;
  verdictTitle: string;
  verdictExplanation: string;

  isEligibleForAllowance: boolean;
  ineligibilityReason?: string;

  allowanceDeduction: number;
  expensesDeduction: number;
  betterOption: 'allowance' | 'expenses' | 'equal';
  taxSavingFromBetterOption: number;

  taxableWithAllowance: number;
  taxableWithExpenses: number;

  mustRegister: boolean;
  registrationDeadline: string;
  filingDeadline: string;
  paymentDeadline: string;

  platformReportingApplies: boolean;
  platformReportingNote: string;

  mtdApplies: boolean;
  mtdNote: string;

  futureChangeNote: string;
}

const TRADING_ALLOWANCE = 1000;
const BASIC_RATE = 0.20;
const DAC7_THRESHOLD_GBP = 1700; // ~€2,000
const MTD_THRESHOLD_2026 = 50000;
const MTD_THRESHOLD_2027 = 30000;

function deadlines(taxYear?: string): { registration: string; filing: string; payment: string } {
  // Default to 2026/27
  const year = taxYear || '2026/27';
  if (year === '2025/26') {
    return { registration: '5 October 2026', filing: '31 January 2027', payment: '31 January 2027' };
  }
  return { registration: '5 October 2027', filing: '31 January 2028', payment: '31 January 2028' };
}

function platformNote(platforms: string[], gross: number): { applies: boolean; note: string } {
  if (platforms.length === 0) {
    return { applies: false, note: '' };
  }
  const applies = gross >= DAC7_THRESHOLD_GBP;
  if (applies) {
    return {
      applies: true,
      note: `Since January 2024, platforms like ${platforms.slice(0, 3).join(', ')} report seller data to HMRC if you have 30+ transactions or €2,000+ (~£1,700) in gross sales. This doesn't automatically mean you owe tax — HMRC just sees your sales data.`,
    };
  }
  return {
    applies: false,
    note: `Your sales are below the platform reporting threshold (~£1,700 / €2,000). Platforms may still report your data to HMRC if you have 30+ transactions.`,
  };
}

function mtdNote(gross: number): { applies: boolean; note: string } {
  if (gross > MTD_THRESHOLD_2026) {
    return {
      applies: true,
      note: `Your gross income exceeds £50,000. Making Tax Digital (MTD) for Income Tax requires quarterly digital submissions from April 2026.`,
    };
  }
  if (gross > MTD_THRESHOLD_2027) {
    return {
      applies: false,
      note: `Your gross income is between £30,000 and £50,000. MTD for Income Tax will apply to you from April 2027 (not yet for 2026/27).`,
    };
  }
  return {
    applies: false,
    note: gross <= TRADING_ALLOWANCE
      ? 'Making Tax Digital does not apply — the trading allowance exempts you from the entire digital reporting system.'
      : 'Your income is below the MTD threshold (£50,000 for 2026/27). No quarterly digital reporting required.',
  };
}

const FUTURE_CHANGE =
  "From 2027/28, if your trading income is between £1,000 and £3,000, you'll use a new simplified reporting system instead of full Self Assessment. For 2026/27, the current rules apply.";

export function checkTradingAllowance(input: TradingAllowanceInput): TradingAllowanceResult {
  const dl = deadlines(input.taxYear);
  const pn = platformNote(input.platforms, input.grossTradingIncome);
  const mn = mtdNote(input.grossTradingIncome);

  const base: Omit<TradingAllowanceResult, 'verdict' | 'verdictTitle' | 'verdictExplanation' | 'isEligibleForAllowance' | 'mustRegister' | 'allowanceDeduction' | 'expensesDeduction' | 'betterOption' | 'taxSavingFromBetterOption' | 'taxableWithAllowance' | 'taxableWithExpenses'> = {
    registrationDeadline: dl.registration,
    filingDeadline: dl.filing,
    paymentDeadline: dl.payment,
    platformReportingApplies: pn.applies,
    platformReportingNote: pn.note,
    mtdApplies: mn.applies,
    mtdNote: mn.note,
    futureChangeNote: FUTURE_CHANGE,
  };

  // ── Non-trading income types ──────────────────────────────────
  if (input.incomeType === 'personal-sales') {
    return {
      ...base,
      verdict: 'not-trading',
      verdictTitle: 'This isn\'t trading income',
      verdictExplanation: 'Selling personal belongings you already owned is not trading. No tax is due, no registration is needed. The trading allowance doesn\'t apply because there\'s nothing to apply it to — personal sales of your own items are simply not taxable (unless you sell them for more than you paid).',
      isEligibleForAllowance: false,
      mustRegister: false,
      allowanceDeduction: 0,
      expensesDeduction: 0,
      betterOption: 'equal',
      taxSavingFromBetterOption: 0,
      taxableWithAllowance: 0,
      taxableWithExpenses: 0,
    };
  }

  if (input.incomeType === 'rental') {
    return {
      ...base,
      verdict: 'not-trading',
      verdictTitle: 'Rental income uses different rules',
      verdictExplanation: 'Rental income is covered by the separate £1,000 property allowance, not the trading allowance. Different rules and tax treatment apply. If your rental income exceeds £1,000, you\'ll need to register for Self Assessment and report it as property income.',
      isEligibleForAllowance: false,
      mustRegister: input.grossTradingIncome > TRADING_ALLOWANCE,
      allowanceDeduction: 0,
      expensesDeduction: 0,
      betterOption: 'equal',
      taxSavingFromBetterOption: 0,
      taxableWithAllowance: 0,
      taxableWithExpenses: 0,
    };
  }

  if (input.incomeType === 'employment') {
    return {
      ...base,
      verdict: 'not-trading',
      verdictTitle: 'Employment income uses PAYE',
      verdictExplanation: 'Employment income is handled through your employer\'s PAYE system, not the trading allowance. If you have self-employed income alongside your employment, use our Side-Hustle Tax Calculator instead.',
      isEligibleForAllowance: false,
      mustRegister: false,
      allowanceDeduction: 0,
      expensesDeduction: 0,
      betterOption: 'equal',
      taxSavingFromBetterOption: 0,
      taxableWithAllowance: 0,
      taxableWithExpenses: 0,
    };
  }

  // ── Exclusions check ──────────────────────────────────────────
  if (input.anyIncomeFromEmployer) {
    return {
      ...base,
      verdict: 'not-eligible',
      verdictTitle: 'You can\'t use the trading allowance',
      verdictExplanation: 'Income from your employer or a connected party disqualifies you from the entire trading allowance — not just the employer portion. You must register for Self Assessment and claim actual expenses instead.',
      isEligibleForAllowance: false,
      ineligibilityReason: 'Income from employer or connected party',
      mustRegister: input.grossTradingIncome > 0,
      allowanceDeduction: 0,
      expensesDeduction: input.actualExpenses,
      betterOption: 'expenses',
      taxSavingFromBetterOption: 0,
      taxableWithAllowance: input.grossTradingIncome,
      taxableWithExpenses: Math.max(0, input.grossTradingIncome - input.actualExpenses),
    };
  }

  if (input.anyIncomeFromPartnership) {
    return {
      ...base,
      verdict: 'not-eligible',
      verdictTitle: 'You can\'t use the trading allowance',
      verdictExplanation: 'Income earned through a business partnership cannot use the trading allowance. Partnership income is reported on your Self Assessment return and you can claim your share of partnership expenses.',
      isEligibleForAllowance: false,
      ineligibilityReason: 'Income earned through a partnership',
      mustRegister: input.grossTradingIncome > 0,
      allowanceDeduction: 0,
      expensesDeduction: input.actualExpenses,
      betterOption: 'expenses',
      taxSavingFromBetterOption: 0,
      taxableWithAllowance: input.grossTradingIncome,
      taxableWithExpenses: Math.max(0, input.grossTradingIncome - input.actualExpenses),
    };
  }

  if (input.anyIncomeFromOwnCompany) {
    return {
      ...base,
      verdict: 'not-eligible',
      verdictTitle: 'You can\'t use the trading allowance',
      verdictExplanation: 'Income from a company you own or control cannot use the trading allowance. This income should be extracted through salary, dividends, or other company distributions.',
      isEligibleForAllowance: false,
      ineligibilityReason: 'Income from a company you control',
      mustRegister: input.grossTradingIncome > 0,
      allowanceDeduction: 0,
      expensesDeduction: input.actualExpenses,
      betterOption: 'expenses',
      taxSavingFromBetterOption: 0,
      taxableWithAllowance: input.grossTradingIncome,
      taxableWithExpenses: Math.max(0, input.grossTradingIncome - input.actualExpenses),
    };
  }

  // ── 'unsure' type: treat as trading for calculation, flag it ──
  // Falls through to normal trading logic

  // ── Eligible for trading allowance ────────────────────────────
  const gross = input.grossTradingIncome;
  const expenses = input.actualExpenses;
  const taxableWithAllowance = Math.max(0, gross - TRADING_ALLOWANCE);
  const taxableWithExpenses = Math.max(0, gross - expenses);

  // Under or at £1,000
  if (gross <= TRADING_ALLOWANCE) {
    return {
      ...base,
      verdict: 'fully-covered',
      verdictTitle: 'You\'re covered by the £1,000 trading allowance',
      verdictExplanation: `Your gross trading income of £${gross.toLocaleString()} is within the £1,000 trading allowance. No tax to pay, no registration needed, and no Self Assessment return required${input.hasOtherSelfAssessmentReason ? ' (though you may need to file for other reasons)' : ''}.`,
      isEligibleForAllowance: true,
      mustRegister: input.hasOtherSelfAssessmentReason,
      allowanceDeduction: gross, // full relief
      expensesDeduction: expenses,
      betterOption: 'allowance',
      taxSavingFromBetterOption: 0,
      taxableWithAllowance: 0,
      taxableWithExpenses: taxableWithExpenses,
    };
  }

  // Over £1,000: compare allowance vs expenses
  const allowanceBetter = TRADING_ALLOWANCE > expenses;
  const expensesBetter = expenses > TRADING_ALLOWANCE;
  const equal = expenses === TRADING_ALLOWANCE;

  let betterOption: 'allowance' | 'expenses' | 'equal';
  let saving: number;

  if (equal) {
    betterOption = 'equal';
    saving = 0;
  } else if (allowanceBetter) {
    betterOption = 'allowance';
    saving = (TRADING_ALLOWANCE - expenses) * BASIC_RATE;
  } else {
    betterOption = 'expenses';
    saving = (expenses - TRADING_ALLOWANCE) * BASIC_RATE;
  }

  const verdict: Verdict = expensesBetter ? 'register-claim-expenses' : 'register-claim-allowance';
  const recText = equal
    ? 'Both options give the same deduction — either works.'
    : expensesBetter
      ? `Claim actual expenses — they're worth £${Math.round(saving)} more in tax savings than the flat £1,000 allowance.`
      : `Claim the £1,000 trading allowance — it saves you £${Math.round(saving)} more than claiming actual expenses of £${expenses.toLocaleString()}.`;

  return {
    ...base,
    verdict,
    verdictTitle: 'You need to register for Self Assessment',
    verdictExplanation: `Your gross trading income of £${gross.toLocaleString()} exceeds the £1,000 trading allowance. You must register with HMRC by ${dl.registration} and file a Self Assessment return by ${dl.filing}. ${recText}`,
    isEligibleForAllowance: true,
    mustRegister: true,
    allowanceDeduction: TRADING_ALLOWANCE,
    expensesDeduction: expenses,
    betterOption,
    taxSavingFromBetterOption: Math.round(saving * 100) / 100,
    taxableWithAllowance,
    taxableWithExpenses,
  };
}
