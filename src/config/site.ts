export const SITE = {
  name: 'Quick Hustle Tax',
  description: 'Free UK tax calculators and checkers for side-hustlers, sole traders, and freelancers.',
  url: 'https://quickhustletax.co.uk',
  locale: 'en-GB',
  taxYear: '2026/27',
} as const;

export const MONETISATION = {
  adsenseEnabled: true,
  adsensePublisherId: 'ca-pub-5980284561238174',
  emailCaptureEnabled: false,
  affiliatesEnabled: true,
} as const;

export const ANALYTICS = {
  cloudflare: { enabled: true },
  ga4: { enabled: true, measurementId: 'G-REN3R638K6' },
  clarity: { enabled: false, projectId: '' },
} as const;
