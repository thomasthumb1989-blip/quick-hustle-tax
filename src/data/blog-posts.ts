export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  description: string;
  date: string;
  updated: string;
  image: string;
  imageAlt: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'track-self-assessment-tax',
    title: 'How to Track Your Self Assessment Tax Throughout the Year',
    excerpt: 'Year-round Self Assessment tracking for UK sole traders — income, expenses, mileage (including the new 55p rate), tax calculation, and Payment on Account planning.',
    description: 'Year-round Self Assessment tracking for UK sole traders and freelancers. Track income, expenses, and mileage so filing is accurate, stress-free, and you never miss a deduction.',
    date: '2026-06-04',
    updated: '2026-06-04',
    image: '',
    imageAlt: '',
  },
  {
    slug: 'track-freelance-income-expenses',
    title: 'How to Track Your Freelance Income and Expenses (And Why You Need To)',
    excerpt: 'A step-by-step UK guide to tracking freelance income and expenses for Self Assessment — categories, tools, and HMRC record-keeping rules.',
    description: 'How to track freelance income and expenses for UK Self Assessment. Covers allowable expenses, cash basis vs traditional, HMRC record-keeping rules, and Making Tax Digital.',
    date: '2026-06-02',
    updated: '2026-06-02',
    image: '/freelancer-income-expense-tracker.jpg',
    imageAlt: 'Freelancer Income & Expense Tracker spreadsheet by The Finance Specialist',
  },
];
