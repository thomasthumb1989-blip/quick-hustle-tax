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
    slug: 'track-freelance-income-expenses',
    title: 'How to Track Your Freelance Income and Expenses (And Why You Need To)',
    excerpt: 'Learn the simple system for tracking freelance income and expenses so Self Assessment is painless.',
    description: 'A practical guide to tracking freelance income and expenses for UK Self Assessment. Free spreadsheet tips, HMRC-ready categories, and common mistakes to avoid.',
    date: '2026-06-02',
    updated: '2026-06-02',
    image: '/freelancer-income-expense-tracker.jpg',
    imageAlt: 'Freelancer Income & Expense Tracker spreadsheet by The Finance Specialist',
  },
];
