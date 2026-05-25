/**
 * Platform Seller HMRC Reporting Checker — pure logic, no side effects
 * 2026/27 rules: DAC7 platform reporting + £1,000 trading allowance
 */

export type ActivityType =
  | 'selling-made-items'
  | 'buying-to-resell'
  | 'selling-personal-items'
  | 'freelance-services'
  | 'gig-delivery'
  | 'content-creation'
  | 'rental-property'
  | 'mixed';

export type Severity = 'info' | 'warning' | 'success' | 'danger';

export interface PlatformSellerInput {
  platforms: string[];
  activityType: ActivityType;
  totalTransactions: number;
  grossRevenue: number;
  grossTradingIncomeTaxYear: number;
  actualExpenses: number;
  sellingPersonalItemsAtLoss: boolean;
  buyingToResell: boolean;
  regularActivity: boolean;
  joinedMidYear: boolean;
  monthJoined?: number; // 1–12
  hasReceivedHMRCLetter: boolean;
  taxYear?: string;
}

export interface VerdictCard {
  icon: string;
  title: string;
  explanation: string;
  severity: Severity;
}

export interface PlatformSellerResult {
  platformReporting: {
    isBeingReported: boolean;
    reportingReason: string;
    reportingThresholdTransactions: number;
    reportingThresholdRevenue: number;
    userTransactions: number;
    userRevenue: number;
    platformsReporting: string[];
    calendarYearNote: string;
  };
  tradingStatus: {
    isTradingActivity: boolean;
    tradingReason: string;
    riskLevel: 'low' | 'medium' | 'high';
    riskExplanation: string;
  };
  taxLiability: {
    needsToRegister: boolean;
    registrationDeadline: string;
    coveredByTradingAllowance: boolean;
    recommendedDeductionMethod: 'trading-allowance' | 'actual-expenses' | 'not-applicable';
    taxableProfit: number;
    estimatedTax: number;
    tradingAllowanceComparison: {
      taxableWithAllowance: number;
      taxableWithExpenses: number;
      betterOption: string;
      saving: number;
    };
  };
  hmrcLetterGuidance: {
    applicable: boolean;
    steps: string[];
  };
  verdicts: {
    reporting: VerdictCard;
    trading: VerdictCard;
    tax: VerdictCard;
    action: VerdictCard;
  };
  deadlines: { name: string; date: string; description: string }[];
  platformNotes: { platform: string; note: string }[];
}

// --- Constants ---

/** DAC7 base thresholds (calendar year, goods only) */
const DAC7_TRANSACTION_THRESHOLD = 30;
const DAC7_REVENUE_THRESHOLD_GBP = 1700; // ~€2,000

/** Trading allowance */
const TRADING_ALLOWANCE = 1000;

/** Services platforms — no threshold, always reported */
const SERVICES_PLATFORMS = new Set([
  'fiverr', 'upwork', 'deliveroo', 'uber', 'youtube', 'tiktok-shop-services',
  'other-services',
]);

/** Property platforms */
const PROPERTY_PLATFORMS = new Set(['airbnb']);

/** Activity types that count as services */
const SERVICES_ACTIVITIES = new Set<ActivityType>([
  'freelance-services', 'gig-delivery', 'content-creation',
]);

/** Platform-specific notes */
const PLATFORM_NOTES: Record<string, string> = {
  etsy: 'Etsy reports UK sellers who complete 30+ transactions or earn €2,000+ in goods sales per calendar year. Etsy will contact you to verify your NI number and identity if you hit thresholds. If you don\'t respond within 60 days, Etsy may withhold payouts.',
  ebay: 'eBay reports if you hit 30+ transactions or ~£1,700+ in sales. Private seller accounts are still reported if thresholds are met. eBay does not distinguish between personal and trading sales in its report — HMRC makes that determination.',
  vinted: 'Vinted reports if you exceed 30 sales or ~£1,700 gross revenue. Most Vinted sellers are selling personal items at a loss — this is NOT taxable. Vinted\'s CEO has publicly stated most users won\'t be affected.',
  depop: 'Depop reports under the same thresholds as other goods platforms. If you\'re buying vintage/thrift to resell, this is trading income.',
  amazon: 'Amazon Marketplace reports all seller data. If you\'re an FBA seller, your transaction volumes likely exceed reporting thresholds. Amazon provides annual tax summaries in Seller Central.',
  'tiktok-shop': 'TikTok Shop and Creator Fund income is reported. If selling goods via TikTok Shop, goods thresholds apply. Creator fund payments are services income.',
  fiverr: 'Fiverr reports ALL service income — no threshold. Every penny earned is reported to HMRC.',
  upwork: 'Upwork reports ALL freelance income — no threshold for services.',
  deliveroo: 'Deliveroo reports ALL rider income. You\'re self-employed, not an employee. All delivery income is trading income.',
  uber: 'Uber reports ALL driver/courier income. Self-employed status means you must track income and expenses.',
  youtube: 'Google reports UK creator ad revenue. YouTube Partner Programme income is trading income if regular.',
  airbnb: 'Airbnb reports ALL host income — no threshold for property rental. Note: rental income uses the £1,000 PROPERTY allowance, not the trading allowance.',
};

// --- Helpers ---

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function isServicesActivity(activityType: ActivityType): boolean {
  return SERVICES_ACTIVITIES.has(activityType);
}

function hasServicesplatform(platforms: string[]): boolean {
  return platforms.some((p) => SERVICES_PLATFORMS.has(p));
}

function hasPropertyPlatform(platforms: string[]): boolean {
  return platforms.some((p) => PROPERTY_PLATFORMS.has(p));
}

function getDeadlines(taxYear?: string): { name: string; date: string; description: string }[] {
  if (taxYear === '2025/26') {
    return [
      { name: 'Register for Self Assessment', date: '5 October 2026', description: 'If you need to register for the first time' },
      { name: 'Paper tax return deadline', date: '31 October 2026', description: 'If filing a paper return' },
      { name: 'Online tax return deadline', date: '31 January 2027', description: 'File and pay by this date' },
      { name: 'Payment deadline', date: '31 January 2027', description: 'Tax owed must be paid' },
    ];
  }
  // 2026/27
  return [
    { name: 'Register for Self Assessment', date: '5 October 2027', description: 'If you need to register for the first time' },
    { name: 'Paper tax return deadline', date: '31 October 2027', description: 'If filing a paper return' },
    { name: 'Online tax return deadline', date: '31 January 2028', description: 'File and pay by this date' },
    { name: 'Payment deadline', date: '31 January 2028', description: 'Tax owed must be paid' },
  ];
}

// --- Main function ---

export function checkPlatformSeller(input: PlatformSellerInput): PlatformSellerResult {
  // 1. Platform reporting assessment
  const platformReporting = assessReporting(input);

  // 2. Trading status
  const tradingStatus = assessTradingStatus(input);

  // 3. Tax liability
  const taxLiability = assessTaxLiability(input, tradingStatus.isTradingActivity);

  // 4. HMRC letter guidance
  const hmrcLetterGuidance = buildHMRCLetterGuidance(input.hasReceivedHMRCLetter);

  // 5. Verdicts
  const verdicts = buildVerdicts(platformReporting, tradingStatus, taxLiability, input);

  // 6. Deadlines
  const deadlines = taxLiability.needsToRegister ? getDeadlines(input.taxYear) : [];

  // 7. Platform notes
  const platformNotes = input.platforms
    .filter((p) => PLATFORM_NOTES[p])
    .map((p) => ({ platform: p, note: PLATFORM_NOTES[p] }));

  return {
    platformReporting,
    tradingStatus,
    taxLiability,
    hmrcLetterGuidance,
    verdicts,
    deadlines,
    platformNotes,
  };
}

// --- Sub-assessments ---

function assessReporting(input: PlatformSellerInput): PlatformSellerResult['platformReporting'] {
  const calendarYearNote = 'Platform reporting is based on the calendar year (Jan–Dec), not the tax year (Apr–Apr).';

  // Services — always reported, no threshold
  if (isServicesActivity(input.activityType) || hasServicesplatform(input.platforms)) {
    return {
      isBeingReported: true,
      reportingReason: 'Services income is reported from the first penny — no threshold applies.',
      reportingThresholdTransactions: 0,
      reportingThresholdRevenue: 0,
      userTransactions: input.totalTransactions,
      userRevenue: input.grossRevenue,
      platformsReporting: input.platforms,
      calendarYearNote,
    };
  }

  // Property — always reported
  if (input.activityType === 'rental-property' || hasPropertyPlatform(input.platforms)) {
    return {
      isBeingReported: true,
      reportingReason: 'Property rental income is reported from the first penny — no threshold applies.',
      reportingThresholdTransactions: 0,
      reportingThresholdRevenue: 0,
      userTransactions: input.totalTransactions,
      userRevenue: input.grossRevenue,
      platformsReporting: input.platforms,
      calendarYearNote,
    };
  }

  // Goods — apply thresholds with optional pro-rating
  let txThreshold = DAC7_TRANSACTION_THRESHOLD;
  let revThreshold = DAC7_REVENUE_THRESHOLD_GBP;

  if (input.joinedMidYear && input.monthJoined && input.monthJoined >= 1 && input.monthJoined <= 12) {
    const monthsActive = 13 - input.monthJoined;
    txThreshold = Math.ceil(DAC7_TRANSACTION_THRESHOLD * monthsActive / 12);
    revThreshold = Math.ceil(DAC7_REVENUE_THRESHOLD_GBP * monthsActive / 12);
  }

  const overTx = input.totalTransactions >= txThreshold;
  const overRev = input.grossRevenue >= revThreshold;

  if (overTx && overRev) {
    return {
      isBeingReported: true,
      reportingReason: `Above both thresholds: ${input.totalTransactions} transactions (threshold: ${txThreshold}) and £${input.grossRevenue.toLocaleString()} revenue (threshold: ~£${revThreshold.toLocaleString()}).`,
      reportingThresholdTransactions: txThreshold,
      reportingThresholdRevenue: revThreshold,
      userTransactions: input.totalTransactions,
      userRevenue: input.grossRevenue,
      platformsReporting: input.platforms,
      calendarYearNote,
    };
  }

  if (overTx) {
    return {
      isBeingReported: true,
      reportingReason: `${input.totalTransactions} transactions exceeds the ${txThreshold}-transaction threshold.`,
      reportingThresholdTransactions: txThreshold,
      reportingThresholdRevenue: revThreshold,
      userTransactions: input.totalTransactions,
      userRevenue: input.grossRevenue,
      platformsReporting: input.platforms,
      calendarYearNote,
    };
  }

  if (overRev) {
    return {
      isBeingReported: true,
      reportingReason: `£${input.grossRevenue.toLocaleString()} revenue exceeds the ~£${revThreshold.toLocaleString()} threshold (~€2,000).`,
      reportingThresholdTransactions: txThreshold,
      reportingThresholdRevenue: revThreshold,
      userTransactions: input.totalTransactions,
      userRevenue: input.grossRevenue,
      platformsReporting: input.platforms,
      calendarYearNote,
    };
  }

  return {
    isBeingReported: false,
    reportingReason: `Below both thresholds: ${input.totalTransactions} transactions (need ${txThreshold}) and £${input.grossRevenue.toLocaleString()} revenue (need ~£${revThreshold.toLocaleString()}).`,
    reportingThresholdTransactions: txThreshold,
    reportingThresholdRevenue: revThreshold,
    userTransactions: input.totalTransactions,
    userRevenue: input.grossRevenue,
    platformsReporting: [],
    calendarYearNote,
  };
}

function assessTradingStatus(input: PlatformSellerInput): PlatformSellerResult['tradingStatus'] {
  // Personal items sold at a loss, not buying to resell, not regular
  if (input.sellingPersonalItemsAtLoss && !input.buyingToResell && !input.regularActivity) {
    return {
      isTradingActivity: false,
      tradingReason: 'Selling personal belongings at a loss is not trading.',
      riskLevel: 'low',
      riskExplanation: 'Disposing of personal items you already owned for less than you paid is not taxable. No registration needed.',
    };
  }

  // Activity types that are clearly trading
  if (input.activityType === 'buying-to-resell' || input.buyingToResell) {
    return {
      isTradingActivity: true,
      tradingReason: 'Buying items specifically to resell at a profit is trading.',
      riskLevel: 'high',
      riskExplanation: 'HMRC considers buying to resell as trading activity regardless of volume. Must declare if gross income exceeds £1,000.',
    };
  }

  if (input.activityType === 'selling-made-items') {
    return {
      isTradingActivity: true,
      tradingReason: 'Making items to sell is trading — you\'re producing goods with the intent to profit.',
      riskLevel: 'high',
      riskExplanation: 'Creating products to sell is clearly trading activity. Must declare if gross income exceeds £1,000.',
    };
  }

  if (isServicesActivity(input.activityType)) {
    return {
      isTradingActivity: true,
      tradingReason: 'Providing services for payment is trading income.',
      riskLevel: 'high',
      riskExplanation: 'Freelance work, gig economy, and content creation are all forms of self-employment / trading.',
    };
  }

  if (input.activityType === 'rental-property') {
    return {
      isTradingActivity: false,
      tradingReason: 'Property rental is not trading — it falls under property income rules with its own £1,000 property allowance.',
      riskLevel: 'medium',
      riskExplanation: 'Rental income has separate rules. The trading allowance does NOT apply. The £1,000 property allowance may cover you instead.',
    };
  }

  // Mixed or selling personal items with some trading indicators
  if (input.activityType === 'mixed') {
    return {
      isTradingActivity: true,
      tradingReason: 'Mixed activity that includes any trading element is treated as trading by HMRC.',
      riskLevel: 'high',
      riskExplanation: 'If part of your activity is trading (making, buying to resell, or services), the trading portion must be declared.',
    };
  }

  // Selling personal items but with some indicators
  if (input.regularActivity && !input.sellingPersonalItemsAtLoss) {
    return {
      isTradingActivity: true,
      tradingReason: 'Regular selling activity with apparent profit intent is likely trading.',
      riskLevel: 'medium',
      riskExplanation: 'HMRC looks at frequency, intent, and whether items are sold above cost. Regular activity suggests trading.',
    };
  }

  if (input.activityType === 'selling-personal-items' && !input.sellingPersonalItemsAtLoss) {
    return {
      isTradingActivity: false,
      tradingReason: 'Selling personal items — but since you may not be selling at a loss, HMRC could question this.',
      riskLevel: 'medium',
      riskExplanation: 'If items sell for more than you originally paid, HMRC may consider this trading. Keep records of original purchase prices.',
    };
  }

  return {
    isTradingActivity: false,
    tradingReason: 'Your activity does not appear to be trading based on the information provided.',
    riskLevel: 'low',
    riskExplanation: 'Based on your answers, this is likely personal selling. However, if your circumstances change (e.g. you start buying to resell), reassess.',
  };
}

function assessTaxLiability(
  input: PlatformSellerInput,
  isTradingActivity: boolean
): PlatformSellerResult['taxLiability'] {
  const registrationDeadline = input.taxYear === '2025/26' ? '5 October 2026' : '5 October 2027';

  // Not trading → no tax
  if (!isTradingActivity) {
    return {
      needsToRegister: false,
      registrationDeadline,
      coveredByTradingAllowance: false,
      recommendedDeductionMethod: 'not-applicable',
      taxableProfit: 0,
      estimatedTax: 0,
      tradingAllowanceComparison: {
        taxableWithAllowance: 0,
        taxableWithExpenses: 0,
        betterOption: 'Not applicable — not trading',
        saving: 0,
      },
    };
  }

  // Rental property — different rules
  if (input.activityType === 'rental-property') {
    return {
      needsToRegister: input.grossTradingIncomeTaxYear > 1000,
      registrationDeadline,
      coveredByTradingAllowance: false,
      recommendedDeductionMethod: 'not-applicable',
      taxableProfit: Math.max(0, input.grossTradingIncomeTaxYear - Math.max(TRADING_ALLOWANCE, input.actualExpenses)),
      estimatedTax: 0,
      tradingAllowanceComparison: {
        taxableWithAllowance: 0,
        taxableWithExpenses: 0,
        betterOption: 'Property allowance rules apply — not the trading allowance',
        saving: 0,
      },
    };
  }

  const gross = input.grossTradingIncomeTaxYear;

  // Under £1,000 → covered by trading allowance
  if (gross <= TRADING_ALLOWANCE) {
    return {
      needsToRegister: false,
      registrationDeadline,
      coveredByTradingAllowance: true,
      recommendedDeductionMethod: 'trading-allowance',
      taxableProfit: 0,
      estimatedTax: 0,
      tradingAllowanceComparison: {
        taxableWithAllowance: 0,
        taxableWithExpenses: Math.max(0, gross - input.actualExpenses),
        betterOption: 'Fully covered by trading allowance',
        saving: 0,
      },
    };
  }

  // Over £1,000 → compare allowance vs expenses
  const taxableWithAllowance = Math.max(0, gross - TRADING_ALLOWANCE);
  const taxableWithExpenses = Math.max(0, gross - input.actualExpenses);

  let recommendedDeductionMethod: 'trading-allowance' | 'actual-expenses';
  let betterOption: string;
  let saving: number;

  if (taxableWithAllowance <= taxableWithExpenses) {
    recommendedDeductionMethod = 'trading-allowance';
    betterOption = 'Trading allowance';
    saving = round2((taxableWithExpenses - taxableWithAllowance) * 0.2);
  } else {
    recommendedDeductionMethod = 'actual-expenses';
    betterOption = 'Actual expenses';
    saving = round2((taxableWithAllowance - taxableWithExpenses) * 0.2);
  }

  const taxableProfit = Math.min(taxableWithAllowance, taxableWithExpenses);
  const estimatedTax = round2(taxableProfit * 0.2);

  return {
    needsToRegister: true,
    registrationDeadline,
    coveredByTradingAllowance: false,
    recommendedDeductionMethod,
    taxableProfit,
    estimatedTax,
    tradingAllowanceComparison: {
      taxableWithAllowance,
      taxableWithExpenses,
      betterOption,
      saving,
    },
  };
}

function buildHMRCLetterGuidance(hasReceivedLetter: boolean): PlatformSellerResult['hmrcLetterGuidance'] {
  if (!hasReceivedLetter) return { applicable: false, steps: [] };

  return {
    applicable: true,
    steps: [
      'Don\'t panic — a letter is not an accusation. It\'s a \'nudge\' to check your records.',
      'Verify the letter is genuine — check HMRC.gov.uk, don\'t click links in the letter.',
      'Gather your platform records: download annual statements from each platform.',
      'Determine if your activity is trading or personal selling using the criteria above.',
      'If trading and over £1,000: register for Self Assessment if you haven\'t already.',
      'If personal selling at a loss: respond to HMRC stating this with evidence (e.g. original purchase receipts).',
      'Consider speaking to an accountant if you\'re unsure — many offer free initial consultations.',
      'Respond within the deadline stated in the letter. Voluntary disclosure gets lower penalties than HMRC discovery.',
    ],
  };
}

function buildVerdicts(
  reporting: PlatformSellerResult['platformReporting'],
  trading: PlatformSellerResult['tradingStatus'],
  tax: PlatformSellerResult['taxLiability'],
  input: PlatformSellerInput
): PlatformSellerResult['verdicts'] {
  // Reporting verdict
  const reportingVerdict: VerdictCard = reporting.isBeingReported
    ? {
        icon: '📡',
        title: 'Your platforms ARE reporting your data to HMRC',
        explanation: reporting.reportingReason + ' ' + reporting.calendarYearNote,
        severity: 'warning',
      }
    : {
        icon: '🔒',
        title: 'Your platforms are NOT required to report you',
        explanation: reporting.reportingReason,
        severity: 'success',
      };

  // Trading verdict
  let tradingVerdict: VerdictCard;
  if (!trading.isTradingActivity && trading.riskLevel === 'low') {
    tradingVerdict = {
      icon: '✅',
      title: 'This is NOT considered trading',
      explanation: trading.tradingReason + ' ' + trading.riskExplanation,
      severity: 'success',
    };
  } else if (input.activityType === 'rental-property') {
    tradingVerdict = {
      icon: 'ℹ️',
      title: 'Property income — different rules apply',
      explanation: trading.tradingReason + ' ' + trading.riskExplanation,
      severity: 'info',
    };
  } else if (!trading.isTradingActivity && trading.riskLevel === 'medium') {
    tradingVerdict = {
      icon: '⚠️',
      title: 'Probably not trading — but keep records',
      explanation: trading.tradingReason + ' ' + trading.riskExplanation,
      severity: 'warning',
    };
  } else {
    tradingVerdict = {
      icon: '⚠️',
      title: 'This IS trading activity',
      explanation: trading.tradingReason + ' ' + trading.riskExplanation,
      severity: 'danger',
    };
  }

  // Tax verdict
  let taxVerdict: VerdictCard;
  if (!trading.isTradingActivity) {
    taxVerdict = {
      icon: '✅',
      title: 'No tax to pay',
      explanation: 'Since this is not trading activity, there is no income tax liability. Personal items sold at a loss are not taxable.',
      severity: 'success',
    };
  } else if (tax.coveredByTradingAllowance) {
    taxVerdict = {
      icon: '✅',
      title: 'Covered by the £1,000 trading allowance',
      explanation: `Your gross trading income of £${input.grossTradingIncomeTaxYear.toLocaleString()} is within the £1,000 allowance. No registration or tax return needed.`,
      severity: 'success',
    };
  } else if (input.activityType === 'rental-property') {
    taxVerdict = {
      icon: 'ℹ️',
      title: 'Property income — separate allowance applies',
      explanation: 'Rental income uses the £1,000 property allowance, not the trading allowance. Different rules and thresholds apply.',
      severity: 'info',
    };
  } else {
    taxVerdict = {
      icon: '⚠️',
      title: `Must register — estimated tax: £${tax.estimatedTax.toLocaleString()}`,
      explanation: `Gross trading income of £${input.grossTradingIncomeTaxYear.toLocaleString()} exceeds the £1,000 allowance. ${tax.tradingAllowanceComparison.betterOption} saves you more (£${tax.tradingAllowanceComparison.saving} difference). Register by ${tax.registrationDeadline}.`,
      severity: 'warning',
    };
  }

  // Action verdict
  let actionVerdict: VerdictCard;
  if (!trading.isTradingActivity && !reporting.isBeingReported) {
    actionVerdict = {
      icon: '🎉',
      title: 'No action needed',
      explanation: 'You\'re selling personal items below reporting thresholds. No tax, no registration, no reporting. Keep basic records just in case.',
      severity: 'success',
    };
  } else if (!trading.isTradingActivity && reporting.isBeingReported) {
    actionVerdict = {
      icon: 'ℹ️',
      title: 'No tax action needed — but HMRC can see your sales',
      explanation: 'Your platform is reporting your data, but since you\'re selling personal items (not trading), no tax is owed. Keep evidence of original purchase prices in case HMRC asks.',
      severity: 'info',
    };
  } else if (tax.coveredByTradingAllowance) {
    actionVerdict = {
      icon: '✅',
      title: 'Trading allowance covers you — no registration needed',
      explanation: 'Your trading income is within the £1,000 allowance. No need to register, file, or pay. Keep a record of total gross income per platform.',
      severity: 'success',
    };
  } else {
    const steps = [
      `Register for Self Assessment by ${tax.registrationDeadline}`,
      `File your tax return by 31 January ${input.taxYear === '2025/26' ? '2027' : '2028'}`,
      `Claim ${tax.recommendedDeductionMethod === 'trading-allowance' ? 'the £1,000 trading allowance' : 'actual expenses'} for the best tax position`,
      `Pay estimated tax of £${tax.estimatedTax.toLocaleString()}`,
    ];
    actionVerdict = {
      icon: '📋',
      title: 'Registration required — here\'s what to do',
      explanation: steps.join('. ') + '.',
      severity: 'warning',
    };
  }

  return { reporting: reportingVerdict, trading: tradingVerdict, tax: taxVerdict, action: actionVerdict };
}
