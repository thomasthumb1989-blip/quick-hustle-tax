# Quick Hustle Tax

Free UK tax calculators and checkers for side-hustlers, sole traders, and freelancers.

**Live**: https://quickhustletax.co.uk

## Stack

- **Framework**: [Astro](https://astro.build) (static output, Cloudflare Pages)
- **UI**: Tailwind CSS + React islands for interactive calculators
- **Content**: MDX for tool pages
- **Typography**: Inter via @fontsource
- **PWA**: @vite-pwa/astro (offline-capable calculators)
- **TypeScript**: Strict mode

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

## Project Structure

```
src/
├── components/
│   ├── ui/              # Shared primitives (Button, Input, Card, FormField)
│   ├── calculators/     # React islands, one folder per tool
│   ├── layout/          # Header, Footer, ThemeToggle, CookieConsent
│   ├── ads/             # AdSlot (togglable via config)
│   └── affiliates/      # AffiliateCard components
├── config/              # Site config, monetisation flags, analytics
├── content/
│   ├── tools/           # MDX content for each tool
│   ├── blog/            # Markdown blog posts (later)
│   └── legal/           # Privacy, cookies, disclaimer
├── data/                # JSON: tax rates, affiliates
├── lib/
│   ├── tax-data/        # Tax data service abstraction
│   ├── calculators/     # Pure calculation functions (testable)
│   └── seo/             # Schema markup helpers
├── layouts/             # BaseLayout, ToolLayout
├── pages/               # Astro routes
└── styles/              # Global Tailwind / CSS variables
```

## Tax Data Architecture

Tax rates live in `src/data/tax-rates-2025-26.json`. Components consume via `src/lib/tax-data/` service — never import JSON directly. Interface designed for future API swap without changing consumer code.

## Monetisation

- **AdSense**: `MONETISATION.adsenseEnabled` flag (off by default, awaiting approval)
- **Affiliates**: `MONETISATION.affiliatesEnabled` flag (Wise, Tide, ANNA, FreeAgent, Crunch)
- All config in `src/config/site.ts`

## Analytics

- **Cloudflare Web Analytics** — server-side, no consent needed
- **GA4 + Microsoft Clarity** — consent-gated via cookie banner

## Deployment

Target: Cloudflare Pages via wrangler. Domains:
- `quickhustletax.co.uk` (canonical)
- `quickhustletax.com` (301 → .co.uk via Cloudflare Page Rule)

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview build locally
```

## Tax Year

Currently: **2025/26**. Update `src/data/tax-rates-2025-26.json` and `src/config/site.ts` when rates change.
