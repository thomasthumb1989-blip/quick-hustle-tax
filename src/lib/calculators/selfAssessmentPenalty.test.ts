import { describe, it, expect } from 'vitest';
import { calculateSelfAssessmentPenalty, getDeadlines } from './selfAssessmentPenalty.ts';
import type { SelfAssessmentPenaltyInput } from './selfAssessmentPenalty.ts';

function makeInput(overrides: Partial<SelfAssessmentPenaltyInput> = {}): SelfAssessmentPenaltyInput {
  return {
    taxYear: '2025/26',
    hasFiledReturn: true,
    filingDate: '2027-01-15',
    taxOwed: 0,
    hasPaidInFull: true,
    checkDate: '2027-01-15',
    ...overrides,
  };
}

describe('getDeadlines', () => {
  it('returns correct 2025/26 deadlines', () => {
    const d = getDeadlines('2025/26');
    expect(d.taxYearStart).toBe('2025-04-06');
    expect(d.taxYearEnd).toBe('2026-04-05');
    expect(d.onlineDeadline).toBe('2027-01-31');
    expect(d.paymentDeadline).toBe('2027-01-31');
    expect(d.paperDeadline).toBe('2026-10-31');
    expect(d.registrationDeadline).toBe('2026-10-05');
    expect(d.secondPaymentOnAccount).toBe('2027-07-31');
  });

  it('returns correct 2026/27 deadlines (Test 10)', () => {
    const d = getDeadlines('2026/27');
    expect(d.taxYearStart).toBe('2026-04-06');
    expect(d.taxYearEnd).toBe('2027-04-05');
    expect(d.onlineDeadline).toBe('2028-01-31');
    expect(d.paymentDeadline).toBe('2028-01-31');
    expect(d.paperDeadline).toBe('2027-10-31');
    expect(d.registrationDeadline).toBe('2027-10-05');
    expect(d.secondPaymentOnAccount).toBe('2028-07-31');
  });
});

describe('calculateSelfAssessmentPenalty', () => {
  it('Test 1: on time — all zeros, green', () => {
    const r = calculateSelfAssessmentPenalty(makeInput({
      hasFiledReturn: true,
      filingDate: '2026-12-01',
      taxOwed: 0,
      hasPaidInFull: true,
      checkDate: '2026-12-01',
    }));

    expect(r.status).toBe('on-track');
    expect(r.urgencyLevel).toBe('green');
    expect(r.filing.isLate).toBe(false);
    expect(r.filing.daysLate).toBe(0);
    expect(r.filing.penalties.total).toBe(0);
    expect(r.payment.isLate).toBe(false);
    expect(r.payment.penalties.total).toBe(0);
    expect(r.totalPenalties).toBe(0);
    expect(r.grandTotal).toBe(0);
  });

  it('Test 2: 1 day late filing, no tax owed', () => {
    const r = calculateSelfAssessmentPenalty(makeInput({
      hasFiledReturn: false,
      taxOwed: 0,
      hasPaidInFull: true,
      checkDate: '2027-02-01', // 1 day after 31 Jan deadline
    }));

    expect(r.filing.isLate).toBe(true);
    expect(r.filing.daysLate).toBe(1);
    expect(r.filing.penalties.initial).toBe(100);
    expect(r.filing.penalties.daily).toBe(0);
    expect(r.filing.penalties.total).toBe(100);
    expect(r.status).toBe('late-filing');
    expect(r.urgencyLevel).toBe('red');
  });

  it('Test 3: 1 day late filing, tax paid on time', () => {
    const r = calculateSelfAssessmentPenalty(makeInput({
      hasFiledReturn: false,
      taxOwed: 5000,
      hasPaidInFull: true,
      paymentDate: '2027-01-31',
      checkDate: '2027-02-01',
    }));

    expect(r.filing.isLate).toBe(true);
    expect(r.filing.penalties.initial).toBe(100);
    expect(r.filing.penalties.total).toBe(100);
    expect(r.payment.isLate).toBe(false);
    expect(r.payment.penalties.total).toBe(0);
    expect(r.totalPenalties).toBe(100);
  });

  it('Test 4: 2 months late, £3000 unpaid', () => {
    // 2 months late = ~61 days (Feb 1 + 60 = Apr 2)
    const r = calculateSelfAssessmentPenalty(makeInput({
      hasFiledReturn: false,
      taxOwed: 3000,
      hasPaidInFull: false,
      checkDate: '2027-04-02', // ~61 days late
    }));

    expect(r.filing.isLate).toBe(true);
    expect(r.filing.daysLate).toBe(61);
    expect(r.filing.penalties.initial).toBe(100);
    expect(r.filing.penalties.daily).toBe(0); // daily starts at 91 days
    expect(r.filing.penalties.total).toBe(100);

    // Payment: 61 days late, 5% surcharge at 30 days
    expect(r.payment.isLate).toBe(true);
    expect(r.payment.penalties.thirtyDay).toBe(150); // 3000 * 0.05
    expect(r.payment.penalties.sixMonth).toBe(0);
    expect(r.payment.penalties.total).toBe(150);

    expect(r.status).toBe('late-both');
    expect(r.urgencyLevel).toBe('red');
  });

  it('Test 5: 4 months late, £5000 unpaid (daily penalties active)', () => {
    // 4 months = ~120 days. Check: 31 Jan + 120 = 31 May 2027
    const r = calculateSelfAssessmentPenalty(makeInput({
      hasFiledReturn: false,
      taxOwed: 5000,
      hasPaidInFull: false,
      checkDate: '2027-05-31', // 120 days late
    }));

    expect(r.filing.daysLate).toBe(120);
    expect(r.filing.penalties.initial).toBe(100);
    // Daily: starts after 90 days, 120-90 = 30 days of £10/day
    expect(r.filing.penalties.daily).toBe(300);
    expect(r.filing.penalties.sixMonth).toBe(0); // not yet 182 days
    expect(r.filing.penalties.total).toBe(400);

    // Payment: 120 days, 5% at 30 days
    expect(r.payment.penalties.thirtyDay).toBe(250); // 5000 * 0.05
    expect(r.payment.penalties.sixMonth).toBe(0);
    expect(r.payment.penalties.total).toBe(250);

    expect(r.totalPenalties).toBe(650);
  });

  it('Test 6: 6 months late, £2000 unpaid', () => {
    // 6 months = 182+ days. 31 Jan + 182 = 1 Aug 2027
    const r = calculateSelfAssessmentPenalty(makeInput({
      hasFiledReturn: false,
      taxOwed: 2000,
      hasPaidInFull: false,
      checkDate: '2027-08-01', // 182 days late
    }));

    expect(r.filing.daysLate).toBe(182);
    expect(r.filing.penalties.initial).toBe(100);
    // Daily: 90 days * £10 = £900
    expect(r.filing.penalties.daily).toBe(900);
    // 6-month: max(300, 2000 * 0.05) = max(300, 100) = 300
    expect(r.filing.penalties.sixMonth).toBe(300);
    expect(r.filing.penalties.twelveMonth).toBe(0);
    expect(r.filing.penalties.total).toBe(1300);

    // Payment: 182 days
    expect(r.payment.penalties.thirtyDay).toBe(100); // 2000 * 0.05
    expect(r.payment.penalties.sixMonth).toBe(100); // 2000 * 0.05
    expect(r.payment.penalties.total).toBe(200);

    expect(r.totalPenalties).toBe(1500);
  });

  it('Test 7: 12 months late, £10000 unpaid', () => {
    // 365+ days. 31 Jan 2027 + 365 = 31 Jan 2028
    const r = calculateSelfAssessmentPenalty(makeInput({
      hasFiledReturn: false,
      taxOwed: 10000,
      hasPaidInFull: false,
      checkDate: '2028-01-31', // 365 days late
    }));

    expect(r.filing.daysLate).toBe(365);
    expect(r.filing.penalties.initial).toBe(100);
    expect(r.filing.penalties.daily).toBe(900); // 90 * £10
    // 6-month: max(300, 10000*0.05) = max(300, 500) = 500
    expect(r.filing.penalties.sixMonth).toBe(500);
    // 12-month: max(300, 10000*0.05) = 500
    expect(r.filing.penalties.twelveMonth).toBe(500);
    expect(r.filing.penalties.total).toBe(2000);

    // Payment: all three surcharges
    expect(r.payment.penalties.thirtyDay).toBe(500);
    expect(r.payment.penalties.sixMonth).toBe(500);
    expect(r.payment.penalties.twelveMonth).toBe(500);
    expect(r.payment.penalties.total).toBe(1500);

    expect(r.totalPenalties).toBe(3500);
  });

  it('Test 8: filed late but no tax owed — still gets filing penalty', () => {
    const r = calculateSelfAssessmentPenalty(makeInput({
      hasFiledReturn: true,
      filingDate: '2027-04-02', // ~61 days late
      taxOwed: 0,
      hasPaidInFull: true,
    }));

    expect(r.filing.isLate).toBe(true);
    expect(r.filing.penalties.initial).toBe(100);
    expect(r.filing.penalties.total).toBe(100);
    expect(r.payment.isLate).toBe(false);
    expect(r.payment.penalties.total).toBe(0);
    expect(r.urgencyLevel).toBe('red');
  });

  it('Test 9: partial payment', () => {
    const r = calculateSelfAssessmentPenalty(makeInput({
      hasFiledReturn: true,
      filingDate: '2027-01-15',
      taxOwed: 5000,
      hasPaidInFull: false,
      amountPaid: 3000,
      checkDate: '2027-03-15', // 43 days after payment deadline
    }));

    expect(r.payment.unpaidTax).toBe(2000); // 5000 - 3000
    expect(r.payment.isLate).toBe(true);
    expect(r.payment.daysLate).toBe(43);
    // 30-day surcharge: 2000 * 0.05 = 100
    expect(r.payment.penalties.thirtyDay).toBe(100);
    expect(r.payment.penalties.total).toBe(100);
    expect(r.filing.penalties.total).toBe(0); // filed on time
  });

  it('Test 11: interest calculation accuracy', () => {
    // 100 days late, £5000 unpaid
    // Interest: 5000 * (0.0775/365) * 100 = 5000 * 0.00021233 * 100 = 106.16
    const r = calculateSelfAssessmentPenalty(makeInput({
      hasFiledReturn: true,
      filingDate: '2027-01-15',
      taxOwed: 5000,
      hasPaidInFull: false,
      checkDate: '2027-05-11', // 100 days after 31 Jan
    }));

    expect(r.payment.interest.interestRate).toBe(7.75);
    expect(r.payment.interest.totalInterest).toBeCloseTo(106.16, 0);
    expect(r.totalInterest).toBeCloseTo(106.16, 0);
  });

  it('Test 12: grand total = filing penalties + payment penalties + interest', () => {
    // 200 days late, £4000 unpaid
    const r = calculateSelfAssessmentPenalty(makeInput({
      hasFiledReturn: false,
      taxOwed: 4000,
      hasPaidInFull: false,
      checkDate: '2027-08-19', // 200 days after 31 Jan
    }));

    const expectedFilingTotal = 100 + 900 + Math.max(300, 4000 * 0.05); // 100 + 900 + 300 = 1300
    const expectedPaymentTotal = (4000 * 0.05) + (4000 * 0.05); // 200 + 200 = 400
    const expectedInterest = 4000 * (0.0775 / 365) * 200;

    expect(r.filing.penalties.total).toBe(expectedFilingTotal);
    expect(r.payment.penalties.total).toBe(expectedPaymentTotal);
    expect(r.totalPenalties).toBe(expectedFilingTotal + expectedPaymentTotal);
    expect(r.grandTotal).toBeCloseTo(expectedFilingTotal + expectedPaymentTotal + expectedInterest, 0);
  });

  it('approaching deadline shows amber', () => {
    const r = calculateSelfAssessmentPenalty(makeInput({
      hasFiledReturn: false,
      taxOwed: 1000,
      hasPaidInFull: false,
      checkDate: '2027-01-15', // 16 days before deadline
    }));

    expect(r.status).toBe('approaching-deadline');
    expect(r.urgencyLevel).toBe('amber');
    expect(r.filing.penalties.total).toBe(0);
    expect(r.payment.penalties.total).toBe(0);
  });

  it('action items populated for late-both status', () => {
    const r = calculateSelfAssessmentPenalty(makeInput({
      hasFiledReturn: false,
      taxOwed: 5000,
      hasPaidInFull: false,
      checkDate: '2027-04-02',
    }));

    expect(r.actionItems.length).toBeGreaterThan(0);
    expect(r.actionItems.some(item => item.includes('File'))).toBe(true);
  });
});
