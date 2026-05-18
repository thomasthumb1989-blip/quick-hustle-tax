export const SITE = {
  name: 'Quick Hustle Tax',
  description: 'Free UK tax calculators and checkers for side-hustlers, sole traders, and freelancers.',
  url: 'https://quickhustletax.co.uk',
  locale: 'en-GB',
  taxYear: '2026/27',
} as const;

export const MONETISATION = {
  adsenseEnabled: false,
  adsensePublisherId: '',
  emailCaptureEnabled: false,
  affiliatesEnabled: true,
} as const;

export const ANALYTICS = {
  cloudflare: { enabled: true },
  ga4: { enabled: false, measurementId: '' },
  clarity: { enabled: false, projectId: '' },
} as const;
