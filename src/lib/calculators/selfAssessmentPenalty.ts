/** Self-Assessment Deadline & Penalty Calculator */

export interface SelfAssessmentPenaltyInput {
  taxYear: '2025/26' | '2026/27';
  hasFiledReturn: boolean;
  filingDate?: string; // ISO date string
  taxOwed: number;
  hasPaidInFull: boolean;
  amountPaid?: number;
  paymentDate?: string; // ISO date string
  checkDate?: string; // ISO date string, defaults to today
}

export interface DeadlineSet {
  taxYearStart: string;
  taxYearEnd: string;
  canFileFrom: string;
  registrationDeadline: string;
  paperDeadline: string;
  onlineDeadline: string;
  paymentDeadline: string;
  secondPaymentOnAccount: string;
}

export interface FilingPenalties {
  initial: number;
  daily: number;
  sixMonth: number;
  twelveMonth: number;
  total: number;
}

export interface PaymentPenalties {
  thirtyDay: number;
  sixMonth: number;
  twelveMonth: number;
  total: number;
}

export interface InterestResult {
  dailyRate: number;
  totalInterest: number;
  interestRate: number;
}

export interface SelfAssessmentPenaltyResult {
  taxYear: string;
  deadlines: DeadlineSet;
  filing: {
    isLate: boolean;
    daysLate: number;
    penalties: FilingPenalties;
    nextPenaltyDate?: string;
    nextPenaltyDescription?: string;
  };
  payment: {
    isLate: boolean;
    daysLate: number;
    unpaidTax: number;
    penalties: PaymentPenalties;
    interest: InterestResult;
    nextPenaltyDate?: string;
    nextPenaltyDescription?: string;
  };
  totalPenalties: number;
  totalInterest: number;
  grandTotal: number;
  status: 'on-track' | 'approaching-deadline' | 'late-filing' | 'late-payment' | 'late-both';
  urgencyLevel: 'green' | 'amber' | 'red';
  actionItems: string[];
}

/** HMRC late payment interest rate: BoE base rate (3.75%) + 4% */
const LATE_PAYMENT_INTEREST_RATE = 0.0775;

/** Parse ISO date string to midnight UTC Date */
function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Format Date as ISO date string */
function toISO(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Days between two dates (a - b), can be negative */
function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86400000;
  return Math.floor((a.getTime() - b.getTime()) / msPerDay);
}

/** Add days to a date */
function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86400000);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function getDeadlines(taxYear: string): DeadlineSet {
  if (taxYear === '2025/26') {
    return {
      taxYearStart: '2025-04-06',
      taxYearEnd: '2026-04-05',
      canFileFrom: '2026-04-06',
      registrationDeadline: '2026-10-05',
      paperDeadline: '2026-10-31',
      onlineDeadline: '2027-01-31',
      paymentDeadline: '2027-01-31',
      secondPaymentOnAccount: '2027-07-31',
    };
  }
  // 2026/27
  return {
    taxYearStart: '2026-04-06',
    taxYearEnd: '2027-04-05',
    canFileFrom: '2027-04-06',
    registrationDeadline: '2027-10-05',
    paperDeadline: '2027-10-31',
    onlineDeadline: '2028-01-31',
    paymentDeadline: '2028-01-31',
    secondPaymentOnAccount: '2028-07-31',
  };
}

function calculateFilingPenalties(daysLate: number, taxOwed: number): FilingPenalties {
  if (daysLate <= 0) {
    return { initial: 0, daily: 0, sixMonth: 0, twelveMonth: 0, total: 0 };
  }

  const initial = 100;

  // Daily penalties: £10/day starting after 90 days late, for up to 90 days
  const dailyPenaltyDays = Math.max(0, Math.min(90, daysLate - 90));
  const daily = dailyPenaltyDays * 10;

  // 6-month penalty: after 182 days
  const sixMonth = daysLate >= 182 ? Math.max(300, round2(taxOwed * 0.05)) : 0;

  // 12-month penalty: after 365 days
  const twelveMonth = daysLate >= 365 ? Math.max(300, round2(taxOwed * 0.05)) : 0;

  const total = round2(initial + daily + sixMonth + twelveMonth);

  return { initial, daily, sixMonth, twelveMonth, total };
}

function calculatePaymentPenalties(daysLate: number, unpaidTax: number): PaymentPenalties {
  if (daysLate <= 0 || unpaidTax <= 0) {
    return { thirtyDay: 0, sixMonth: 0, twelveMonth: 0, total: 0 };
  }

  const thirtyDay = daysLate >= 30 ? round2(unpaidTax * 0.05) : 0;
  const sixMonth = daysLate >= 182 ? round2(unpaidTax * 0.05) : 0;
  const twelveMonth = daysLate >= 365 ? round2(unpaidTax * 0.05) : 0;
  const total = round2(thirtyDay + sixMonth + twelveMonth);

  return { thirtyDay, sixMonth, twelveMonth, total };
}

function calculateInterest(daysLate: number, unpaidTax: number): InterestResult {
  const dailyRate = LATE_PAYMENT_INTEREST_RATE / 365;
  if (daysLate <= 0 || unpaidTax <= 0) {
    return { dailyRate, totalInterest: 0, interestRate: LATE_PAYMENT_INTEREST_RATE * 100 };
  }
  const totalInterest = round2(unpaidTax * dailyRate * daysLate);
  return { dailyRate, totalInterest, interestRate: LATE_PAYMENT_INTEREST_RATE * 100 };
}

function getNextFilingPenalty(
  daysLate: number,
  onlineDeadline: Date
): { date?: string; description?: string } {
  if (daysLate < 0) {
    // Not yet late — next "penalty" is the deadline itself
    return { date: toISO(onlineDeadline), description: 'Filing deadline — £100 penalty from this date' };
  }
  if (daysLate < 90) {
    const d = addDays(onlineDeadline, 91);
    return { date: toISO(d), description: 'Daily £10 penalties begin (up to £900)' };
  }
  if (daysLate < 180) {
    const remaining = 180 - daysLate;
    const d = addDays(onlineDeadline, 181);
    return { date: toISO(d), description: `Daily penalties end in ${remaining} days — then £300+ 6-month penalty at 182 days` };
  }
  if (daysLate < 182) {
    const d = addDays(onlineDeadline, 182);
    return { date: toISO(d), description: '6-month penalty: £300 or 5% of tax, whichever is higher' };
  }
  if (daysLate < 365) {
    const d = addDays(onlineDeadline, 365);
    return { date: toISO(d), description: '12-month penalty: £300 or 5% of tax, whichever is higher' };
  }
  return {};
}

function getNextPaymentPenalty(
  daysLate: number,
  paymentDeadline: Date,
  unpaidTax: number
): { date?: string; description?: string } {
  if (unpaidTax <= 0) return {};
  if (daysLate < 0) {
    return { date: toISO(paymentDeadline), description: 'Payment deadline — interest begins the next day' };
  }
  if (daysLate < 30) {
    const d = addDays(paymentDeadline, 30);
    return { date: toISO(d), description: '5% surcharge on unpaid tax' };
  }
  if (daysLate < 182) {
    const d = addDays(paymentDeadline, 182);
    return { date: toISO(d), description: 'Additional 5% surcharge on unpaid tax' };
  }
  if (daysLate < 365) {
    const d = addDays(paymentDeadline, 365);
    return { date: toISO(d), description: 'Final 5% surcharge on unpaid tax' };
  }
  return {};
}

function generateActionItems(
  status: string,
  filingLate: boolean,
  paymentLate: boolean,
  unpaidTax: number,
  daysToDeadline: number
): string[] {
  const items: string[] = [];

  if (status === 'on-track') {
    if (daysToDeadline > 180) {
      items.push('File your return early to avoid last-minute stress');
      items.push('Set aside money for your tax bill throughout the year');
    } else if (daysToDeadline > 30) {
      items.push('Start preparing your return — gather receipts and records');
      items.push('Consider filing now to find out exactly what you owe');
    } else {
      items.push('File and pay as soon as possible — the deadline is imminent');
    }
    return items;
  }

  if (status === 'approaching-deadline') {
    items.push('File and pay before 31 January to avoid any penalties');
    items.push('Set up a reminder — penalties start from day one after the deadline');
    return items;
  }

  if (filingLate && paymentLate) {
    items.push('File your return FIRST — this stops filing penalties from growing');
    items.push('Pay what you can immediately to reduce interest and payment penalties');
    if (unpaidTax > 0) {
      items.push('Contact HMRC about a Time to Pay arrangement if you cannot pay in full');
    }
    items.push('Consider appealing if you have a reasonable excuse (serious illness, bereavement)');
  } else if (filingLate) {
    items.push('File your return immediately — daily penalties of £10/day may be accruing');
    items.push('Consider appealing the penalty if you have a reasonable excuse');
  } else if (paymentLate) {
    items.push('Pay what you can now — interest accrues daily at 7.75%');
    if (unpaidTax > 3000) {
      items.push('Contact HMRC about a Time to Pay arrangement (self-serve online for debts up to £30,000)');
    }
    items.push('Do not ignore the debt — penalties escalate at 6 and 12 months');
  }

  return items;
}

export function calculateSelfAssessmentPenalty(
  input: SelfAssessmentPenaltyInput
): SelfAssessmentPenaltyResult {
  const deadlines = getDeadlines(input.taxYear);
  const onlineDeadline = parseDate(deadlines.onlineDeadline);
  const paymentDeadline = parseDate(deadlines.paymentDeadline);

  // Check date: use provided or today
  const checkDate = input.checkDate
    ? parseDate(input.checkDate)
    : new Date(Date.UTC(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate()
      ));

  // Filing
  let filingDaysLate: number;
  if (input.hasFiledReturn && input.filingDate) {
    const filed = parseDate(input.filingDate);
    filingDaysLate = daysBetween(filed, onlineDeadline);
  } else if (input.hasFiledReturn) {
    // Filed but no date given — assume on time
    filingDaysLate = 0;
  } else {
    // Not filed — calculate as of check date
    filingDaysLate = daysBetween(checkDate, onlineDeadline);
  }

  const filingPenalties = calculateFilingPenalties(filingDaysLate, input.taxOwed);

  // Payment
  const unpaidTax = input.hasPaidInFull
    ? 0
    : Math.max(0, input.taxOwed - (input.amountPaid || 0));

  let paymentDaysLate: number;
  if (input.hasPaidInFull && input.paymentDate) {
    paymentDaysLate = daysBetween(parseDate(input.paymentDate), paymentDeadline);
  } else if (input.hasPaidInFull) {
    paymentDaysLate = 0;
  } else {
    paymentDaysLate = daysBetween(checkDate, paymentDeadline);
  }

  const paymentPenalties = calculatePaymentPenalties(paymentDaysLate, unpaidTax);
  const interest = calculateInterest(
    Math.max(0, paymentDaysLate),
    unpaidTax
  );

  // Next penalty dates
  const nextFiling = getNextFilingPenalty(filingDaysLate, onlineDeadline);
  const nextPayment = getNextPaymentPenalty(paymentDaysLate, paymentDeadline, unpaidTax);

  // Totals
  const totalPenalties = round2(filingPenalties.total + paymentPenalties.total);
  const totalInterest = interest.totalInterest;
  const grandTotal = round2(totalPenalties + totalInterest);

  // Status
  const filingIsLate = filingDaysLate > 0 && !input.hasFiledReturn;
  const paymentIsLate = paymentDaysLate > 0 && unpaidTax > 0;
  const daysToDeadline = daysBetween(onlineDeadline, checkDate);

  let status: SelfAssessmentPenaltyResult['status'];
  let urgencyLevel: SelfAssessmentPenaltyResult['urgencyLevel'];

  if (filingIsLate && paymentIsLate) {
    status = 'late-both';
    urgencyLevel = 'red';
  } else if (filingIsLate) {
    status = 'late-filing';
    urgencyLevel = 'red';
  } else if (paymentIsLate) {
    status = 'late-payment';
    urgencyLevel = 'red';
  } else if (daysToDeadline <= 30 && daysToDeadline > 0) {
    status = 'approaching-deadline';
    urgencyLevel = 'amber';
  } else {
    status = 'on-track';
    urgencyLevel = 'green';
  }

  // If user already filed late but paid — still show red for the filing penalty incurred
  if (input.hasFiledReturn && filingDaysLate > 0) {
    urgencyLevel = filingPenalties.total > 0 ? 'red' : 'green';
    status = filingPenalties.total > 0 ? 'late-filing' : 'on-track';
  }

  const actionItems = generateActionItems(
    status,
    filingIsLate || (input.hasFiledReturn && filingDaysLate > 0),
    paymentIsLate,
    unpaidTax,
    daysToDeadline
  );

  return {
    taxYear: input.taxYear,
    deadlines,
    filing: {
      isLate: filingDaysLate > 0,
      daysLate: Math.max(0, filingDaysLate),
      penalties: filingPenalties,
      nextPenaltyDate: nextFiling.date,
      nextPenaltyDescription: nextFiling.description,
    },
    payment: {
      isLate: paymentDaysLate > 0 && unpaidTax > 0,
      daysLate: Math.max(0, paymentDaysLate),
      unpaidTax,
      penalties: paymentPenalties,
      interest,
      nextPenaltyDate: nextPayment.date,
      nextPenaltyDescription: nextPayment.description,
    },
    totalPenalties,
    totalInterest,
    grandTotal,
    status,
    urgencyLevel,
    actionItems,
  };
}
