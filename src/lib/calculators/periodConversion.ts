export type Period = 'annual' | 'monthly';

/** Convert a value to annual. Monthly values are multiplied by 12 and rounded. */
export function toAnnual(value: number, period: Period): number {
  if (period === 'annual') return value;
  return Math.round(value * 12);
}

/** Convert a value to monthly. Annual values are divided by 12 and rounded. */
export function toMonthly(value: number, period: Period): number {
  if (period === 'monthly') return value;
  return Math.round(value / 12);
}

/** Convert a display value when toggling period. Returns rounded integer. */
export function convertForToggle(value: number, from: Period, to: Period): number {
  if (from === to) return value;
  if (to === 'monthly') return Math.round(value / 12);
  return Math.round(value * 12);
}
