import { describe, it, expect } from 'vitest';
import { toAnnual, toMonthly, convertForToggle } from './periodConversion';

describe('periodConversion', () => {
  describe('toAnnual', () => {
    it('returns value unchanged when already annual', () => {
      expect(toAnnual(30000, 'annual')).toBe(30000);
    });

    it('multiplies monthly by 12', () => {
      expect(toAnnual(2500, 'monthly')).toBe(30000);
    });

    it('rounds result to nearest pound', () => {
      expect(toAnnual(2083, 'monthly')).toBe(24996);
    });
  });

  describe('toMonthly', () => {
    it('returns value unchanged when already monthly', () => {
      expect(toMonthly(2500, 'monthly')).toBe(2500);
    });

    it('divides annual by 12 and rounds', () => {
      expect(toMonthly(30000, 'annual')).toBe(2500);
    });

    it('rounds non-even divisions', () => {
      expect(toMonthly(25000, 'annual')).toBe(2083);
    });
  });

  describe('convertForToggle', () => {
    it('annual → monthly: £30,000 → £2,500', () => {
      expect(convertForToggle(30000, 'annual', 'monthly')).toBe(2500);
    });

    it('monthly → annual: £2,500 → £30,000', () => {
      expect(convertForToggle(2500, 'monthly', 'annual')).toBe(30000);
    });

    it('same period returns unchanged', () => {
      expect(convertForToggle(5000, 'annual', 'annual')).toBe(5000);
    });

    it('rounding: monthly £2,083 → annual £24,996 (not £25,000)', () => {
      expect(convertForToggle(2083, 'monthly', 'annual')).toBe(24996);
    });

    it('rounding: annual £25,000 → monthly £2,083 (not £2,083.33)', () => {
      expect(convertForToggle(25000, 'annual', 'monthly')).toBe(2083);
    });

    it('zero stays zero', () => {
      expect(convertForToggle(0, 'annual', 'monthly')).toBe(0);
      expect(convertForToggle(0, 'monthly', 'annual')).toBe(0);
    });
  });
});
