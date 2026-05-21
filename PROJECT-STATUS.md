Quick Hustle Tax — Complete Project Status
Last updated: 20 May 2026, 20:00 BST Owner: Dan (Thomasthumb1989@gmail.com) Live URL: https://quickhustletax.co.uk Repo: GitHub, branch master, folder name utility-website (local path: C:\Users\Thoma\utility-website)


________________


What This Is
A UK utility website targeting side-hustlers, sole traders, and freelancers with free tax calculators. Monetised via Google AdSense. The site provides accurate, 2026/27 tax-year tools with comprehensive long-form content designed for SEO ranking, AdSense approval, and repeat visitor retention.


________________


Tech Stack
Layer
	Technology
	Framework
	Astro 6 + TypeScript (strict)
	UI Components
	React 19 islands (client:load for calculators)
	Styling
	Tailwind CSS 4
	Fonts
	@fontsource/inter (400/500/600/700) + @fontsource/montserrat (800, header only)
	Content
	Inline Astro pages with reusable React content components
	Testing
	Vitest
	Build
	Vite (via Astro)
	Hosting
	Cloudflare Workers (via @astrojs/cloudflare adapter)
	Deploy
	Wrangler CLI (npx wrangler deploy)
	DNS/CDN
	Cloudflare (free plan)
	Domains
	Porkbun (registrar), Cloudflare (DNS)
	

________________


Domain & Infrastructure
Item
	Value
	Canonical domain
	quickhustletax.co.uk
	Redirect domain
	quickhustletax.com → 301 to .co.uk via Cloudflare Page Rule
	Cloudflare Account ID
	e3b0f1c940ca1eb0c4487e489d667e26
	Worker name
	utility-website
	Workers.dev subdomain
	thomasthumb1989.workers.dev
	SSL
	Full + Always HTTPS on both domains
	AI crawlers
	Blocked (15 bots in robots.txt)
	Search Console
	Verified, sitemap submitted (sitemap-index.xml)
	AdSense
	Applied, status "Getting ready" (pub-5980284561238174)
	AdSense consent
	Google CMP with 3 choices (Consent/Do not consent/Manage)
	ads.txt
	public/ads.txt with Google publisher ID
	Cloudflare Optimisations Enabled (Free Plan)
* Speed Brain (beta, prefetch)
* Early Hints
* HTTP/3
* 0-RTT Connection Resumption
* TLS 1.3
* Web Analytics (RUM)
* Always Use HTTPS
* Polish: NOT available (requires Pro plan — handled via <picture> AVIF/WebP in code)
Security Headers (via src/middleware.ts + public/_headers)
* Strict-Transport-Security (HSTS with preload)
* X-Frame-Options: DENY
* X-Content-Type-Options: nosniff
* Referrer-Policy: strict-origin-when-cross-origin
* Permissions-Policy (camera, microphone, geolocation, payment denied)
* Cross-Origin-Opener-Policy: same-origin
* Content-Security-Policy (self + Google AdSense/Analytics/Clarity wildcards)


IMPORTANT: CSP is managed in TWO files that must stay in sync:


* src/middleware.ts — Astro middleware (sets headers on dynamic responses)
* public/_headers — Cloudflare static asset headers (takes precedence for static files) If you update CSP, update BOTH files or the change won't work.


________________


Lighthouse Scores (Mobile)
Category
	Score
	Performance
	100 🟢
	Accessibility
	96 🟢
	Best Practices
	100 🟢
	SEO
	92 🟢
	Key Performance Metrics
* FCP: 1.2s → improved after CSS inlining
* LCP: 2.6s → improved after logo AVIF/WebP optimisation
* TBT: 0ms
* CLS: 0
* Logo served as AVIF (6.2 KiB, down from 137 KiB PNG)


________________


Tests
79 tests passing across 5 test files, 0 failures.


Test File
	Count
	Covers
	sideHustleTax.test.ts
	16
	Side-hustle tax calculation (2025/26 + 2026/27)
	takeHomePay.test.ts
	19
	Take-home pay with pension/student loan/tax code
	soleTraderVsLtd.test.ts
	11
	Sole trader vs Ltd comparison (2025/26 + 2026/27)
	tradingAllowanceChecker.test.ts
	17
	Trading allowance eligibility decision tree
	periodConversion.test.ts
	4
	Annual/monthly period conversion helpers
	Total
	79
	

	

________________


Calculators — Status
Live (4 of 8)
#
	Calculator
	Route
	Type
	Key Feature
	1
	Side-Hustle Tax Calculator
	/side-hustle-tax-calculator/
	Calculator
	Stacks side-hustle on PAYE, trading allowance auto-pick
	2
	Take-Home Pay Calculator
	/take-home-pay-calculator/
	Calculator
	PAYE + NI + student loan + pension (auto-enrolment & salary sacrifice)
	3
	Sole Trader vs Ltd Co
	/sole-trader-vs-ltd-calculator/
	Comparison
	Side-by-side with CT + dividend tax. Key finding: Ltd never wins on pure extraction in 2026/27
	4
	Trading Allowance Checker
	/trading-allowance-checker/
	Decision tree
	Step wizard → verdict. Covers platform reporting (DAC7) + MTD
	Remaining (4 to build)
#
	Calculator
	Route
	Priority
	Notes
	5
	Dividend Tax Calculator
	/dividend-tax-calculator/
	High
	2026/27 rates increased +2pp. High search volume.
	6
	Self-Assessment Deadline & Penalty Checker
	/self-assessment-deadline-checker/
	Medium
	Seasonal (peaks Jan). Date-based logic + penalty tiers.
	7
	Etsy/Vinted Seller HMRC Reporting Checker
	/platform-seller-reporting-checker/
	Medium
	DAC7 rules, platform-specific guidance.
	8
	Side-Hustle Growth/Revenue Tracker
	TBD
	Low
	Planning tool: target amount × item price = units per day/week/month. Not a tax tool — separate "Planning" section.
	v2 Cluster (Post-AdSense, Property Tax)
#
	Calculator
	Notes
	9
	Landlord Tax Calculator
	Rental profit + Section 24 mortgage interest restriction
	10
	Stamp Duty Calculator
	SDLT incl. 5% second-home surcharge
	11
	Property Capital Gains Tax Calculator
	24% residential rate
	12
	Rent-a-Room Scheme Checker
	£7,500 allowance
	

________________


Tax Data Architecture
Data Files
* src/data/tax-rates-2025-26.json — previous year (for backward compat dropdown)
* src/data/tax-rates-2026-27.json — current year (default)
Data Service
* src/lib/tax-data/index.ts — loads both JSONs, exports by tax year
* src/lib/tax-data/types.ts — TypeScript interfaces for all tax data structures
* src/config/site.ts — taxYear: '2026/27' default
Tax Year Selector
* src/components/calculators/TaxYearSelector.tsx — shared dropdown, reused by all calculators
* Each calculator persists selected year to localStorage
* Default: 2026/27 (current)
Key Tax Data (2026/27)
Income Tax (England, Wales, NI):


* PA: £12,570 (frozen until 2030/31)
* Basic: 20% (£12,571–£50,270)
* Higher: 40% (£50,271–£125,140)
* Additional: 45% (£125,141+)
* PA taper: -£1 per £2 above £100,000


Employee NI (Class 1):


* 8% on £12,570–£50,270
* 2% above £50,270


Self-Employed NI (Class 4):


* 6% on £12,570–£50,270
* 2% above £50,270


Student Loans (2026/27 thresholds):


* Plan 1: £26,900 @ 9%
* Plan 2: £29,385 @ 9%
* Plan 4: £33,795 @ 9%
* Plan 5: £25,000 @ 9% (now active from April 2026)
* Postgraduate: £21,000 @ 6%


Corporation Tax:


* Small profits (≤£50k): 19%
* Main rate (>£250k): 25%
* Marginal relief (£50k–£250k): effective 26.5%


Dividend Tax (2026/27 — increased +2pp from April 2026):


* Allowance: £500
* Basic: 10.75%
* Higher: 35.75%
* Additional: 39.35%


Employer NI:


* 15% above £5,000 secondary threshold
* Employment Allowance: £10,500 (NOT available to single-director companies)


Trading Allowance: £1,000 on gross income


Pension Auto-Enrolment:


* Employee: 5%, Employer: 3% on qualifying earnings £6,240–£50,270


________________


Critical Finding: Sole Trader vs Ltd in 2026/27
The April 2026 dividend tax increase means extracting all Ltd profit as salary + dividends no longer beats sole trader at any profit level. The combined CT + dividend tax exceeds sole trader IT + NI at every band:


* Basic rate: sole trader 26% vs Ltd 27.7%
* Higher rate: sole trader 42% vs Ltd ~48%


Ltd still makes sense for: retained profits, employer pension contributions (CT-deductible + NI-free), income splitting between directors/shareholders, limited liability.


The calculator correctly reflects this reality and the content explicitly explains it. This is a differentiator — most competitor sites still recommend incorporating above £30k based on outdated pre-April-2026 rates.


________________


Content Architecture
Reusable Components (in src/components/content/)
Component
	Purpose
	TableOfContents.tsx
	Sticky sidebar (desktop) / accordion (mobile), scroll-spy via IntersectionObserver
	AccordionSection.tsx
	Collapsible <details>/<summary> with grid-rows animation
	CalloutBox.tsx
	4 variants: info (blue), warning (amber), tip (green), example (purple)
	WorkedExample.tsx
	Persona card with stat grid, emerald narrative
	ComparisonTable.tsx
	Styled table with column highlighting
	DeadlineTimeline.tsx
	Vertical timeline with coloured date markers
	FAQAccordion.tsx
	Q&A accordion list
	Content Pattern (every calculator page follows this):
1. Calculator widget at top (client:load)
2. Two-column layout below: ToC sidebar (left, 240px) + content (right)
3. Content uses AccordionSection for each H2
4. 3 sections default-open (most searched topics)
5. WorkedExamples with personas
6. CalloutBoxes for key rules/warnings
7. FAQAccordion at bottom
8. JSON-LD: WebApplication + FAQPage + BreadcrumbList
9. "Last updated" line + HMRC attribution
10. Featured snippet sentence near top
11. Cross-links to/from other calculators
SEO / GEO / AEO / AIO Optimisation
* SEO: Unique title (50-60 chars, keyword-first), meta description (120-160 chars), canonical URL, OG + Twitter cards, internal cross-links, H1/H2 hierarchy, image alt tags
* GEO (Generative Engine): HMRC source attribution, structured comparison data, clear factual statements with specific numbers
* AEO (Answer Engine): Featured snippet sentences, FAQ schema matching PAA queries, direct-answer opening paragraphs, comparison tables
* AIO (AI Optimisation): Authoritative tone, current year references, "Last updated" date, clean definitions, specific thresholds


________________


Branding
Asset
	Location
	Details
	OG image
	public/og-default.png
	1200×630, dark navy + emerald £ + wordmark. For social previews only (not displayed on site)
	Hero image
	public/hero.png
	Homepage hero, cropped from OG image
	Header logo
	public/logo.png + logo.webp + logo.avif
	Served as <picture> with AVIF→WebP→PNG fallback. 756×140, explicit width/height for CLS
	Favicons
	public/favicon.ico, .svg, 16x16.png, 32x32.png, apple-touch-icon.png, android-chrome-192x192.png, android-chrome-512x512.png
	Emerald £ on dark navy
	Theme colour
	#0a1628 (dark navy)
	Used in meta theme-color and manifest
	Header font
	Montserrat ExtraBold (800), uppercase, tight tracking
	

	Body font
	Inter (400/500/600/700) with antialiased + optimizeLegibility + grayscale smoothing
	

	Accent colour
	Emerald #10b981 (Tailwind emerald-500)
	

	

________________


File Structure (Key Directories)
src/


├── components/


│   ├── calculators/


│   │   ├── SideHustleTax/          # Calculator #1


│   │   │   ├── index.tsx


│   │   │   ├── InputsPanel.tsx


│   │   │   ├── ResultsPanel.tsx


│   │   │   └── BreakdownTable.tsx


│   │   ├── TakeHomePay/            # Calculator #2


│   │   │   ├── index.tsx


│   │   │   ├── InputsPanel.tsx


│   │   │   ├── ResultsPanel.tsx


│   │   │   └── BreakdownTable.tsx


│   │   ├── SoleTraderVsLtd/        # Calculator #3


│   │   │   ├── index.tsx


│   │   │   ├── InputsPanel.tsx


│   │   │   ├── ComparisonPanel.tsx


│   │   │   ├── BreakdownCard.tsx


│   │   │   └── SavingsBar.tsx


│   │   ├── TradingAllowance/       # Calculator #4


│   │   │   ├── index.tsx


│   │   │   ├── StepWizard.tsx


│   │   │   ├── VerdictPanel.tsx


│   │   │   └── ComparisonCard.tsx


│   │   ├── TaxYearSelector.tsx     # Shared component


│   │   └── PeriodToggle.tsx        # Shared component


│   ├── content/                    # Reusable content components


│   │   ├── TableOfContents.tsx


│   │   ├── AccordionSection.tsx


│   │   ├── CalloutBox.tsx


│   │   ├── WorkedExample.tsx


│   │   ├── ComparisonTable.tsx


│   │   ├── DeadlineTimeline.tsx


│   │   └── FAQAccordion.tsx


│   └── layout/


│       ├── BaseLayout.astro


│       ├── ToolLayout.astro


│       ├── Header.astro


│       ├── Footer.astro


│       └── CookieConsent.astro


├── config/


│   └── site.ts                     # Site config, default tax year


├── data/


│   ├── tax-rates-2025-26.json


│   └── tax-rates-2026-27.json


├── lib/


│   ├── calculators/


│   │   ├── sideHustleTax.ts + .test.ts


│   │   ├── takeHomePay.ts + .test.ts


│   │   ├── soleTraderVsLtd.ts + .test.ts


│   │   ├── tradingAllowanceChecker.ts + .test.ts


│   │   └── periodConversion.ts + .test.ts


│   ├── tax-data/


│   │   ├── index.ts                # Tax data service


│   │   └── types.ts                # TypeScript interfaces


│   └── seo/


│       └── schema.ts               # JSON-LD generators


├── pages/


│   ├── index.astro                 # Homepage


│   ├── side-hustle-tax-calculator/index.astro


│   ├── take-home-pay-calculator/index.astro


│   ├── sole-trader-vs-ltd-calculator/index.astro


│   ├── trading-allowance-checker/index.astro


│   ├── dividend-tax-calculator/index.astro     # STUB


│   ├── self-assessment-deadline-checker/index.astro  # STUB


│   ├── platform-seller-reporting-checker/index.astro # STUB


│   └── tools/index.astro           # Tools listing page


├── styles/


│   └── global.css                  # CSS variables, font-smoothing, dark/light mode


└── middleware.ts                   # Security headers + CSP


________________


Known Tech Debt
Issue
	Impact
	Priority
	Local dev server broken — "module is not defined" error (Cloudflare Workers workerd runtime issue). Production builds + deploys work fine.
	Can't test locally; must deploy to verify changes.
	Medium — fix before heavy iteration
	PWA removed — @vite-pwa/astro incompatible with Astro 6. Manifest, service worker, offline support all disabled.
	No "install to home screen" on mobile.
	Low — revisit when plugin updates or swap to vite-plugin-pwa direct
	Unused JS in React bundle — client.BjMYZSek.js has ~25 KiB unused (React runtime overhead). Content components (DeadlineTimeline, FAQAccordion) already removed from hydration.
	Minor performance impact, already at Lighthouse 100.
	Low
	Scottish tax rates — data exists in JSON but no calculator supports Scotland toggle yet. All calculators show "Scottish calculator coming soon" info callout.
	Missing Scottish taxpayer support.
	Medium — add as a toggle on all calculators post-v1
	Accessibility 96 (not 100) — remaining issues likely ToC button contrast in dark mode and structured data manual checks.
	4 points from perfect. Diminishing returns.
	Low
	SEO 92 (not 100) — remaining 8 points likely from structured data validation or minor meta issues.
	Diminishing returns.
	Low
	

________________


Deployment Process
# From project root (C:\Users\Thoma\utility-website)


npm run build          # Build Astro → dist/


npx wrangler deploy    # Deploy to Cloudflare Workers


git add .


git commit -m "type(scope): description"


git push
Rollback
Cloudflare Workers stores deployment history. To rollback:


1. Dashboard → Workers & Pages → utility-website → Deployments
2. Find previous version → click → Rollback
After deploying a new calculator page
1. Request indexing in Google Search Console (URL Inspection → Request Indexing)
2. Verify the page is in the sitemap (auto-generated by @astrojs/sitemap)


________________


Google Search Console
* Property: quickhustletax.co.uk
* Sitemap: https://quickhustletax.co.uk/sitemap-index.xml (submitted, status: Success)
* Indexing requested for:
   * / (homepage)
   * /side-hustle-tax-calculator/
   * /take-home-pay-calculator/
   * /sole-trader-vs-ltd-calculator/
   * /trading-allowance-checker/
* Status as of 20 May 2026: "Discovered – currently not indexed" (normal for new domain, takes 2-7 days)


________________


Google AdSense
* Publisher ID: ca-pub-5980284561238174
* Status: "Getting ready" (under review)
* Verification tag: In BaseLayout.astro <head>
* ads.txt: public/ads.txt with google.com, pub-5980284561238174, DIRECT, f08c47fec0942fa0
* Consent: Google CMP with 3 choices (GDPR-compliant)
* CSP updated: Allows *.google.com, *.googlesyndication.com, *.doubleclick.net, *.googleadservices.com


________________


Build Prompt Template
When building a new calculator, use this pattern (proven across 4 builds):


1. Deep scrape current HMRC rules/rates for the specific topic
2. Draft comprehensive prompt covering:
   * Tax data (extend JSON files)
   * Pure calculation function with TypeScript interfaces
   * Test scenarios (7-10 minimum with expected values)
   * React island component structure
   * Content sections (2,000-2,500 words using reusable components)
   * SEO: meta tags, JSON-LD schemas, featured snippet, HMRC attribution
   * Cross-links to/from all existing calculators
   * Pre-commit audit checklist
3. Review Claude Code's report before committing
4. Verify: tests pass, build clean, meta/schema/content all present
5. Deploy: npm run build && npx wrangler deploy
6. Request indexing in Search Console
7. Update this document


________________


Session History
Session 1 (17-18 May 2026) — Foundation + Launch
* Strategic discussion: utility sites, AdSense, niche selection
* Domain purchase: quickhustletax.co.uk + .com
* Cloudflare infrastructure: DNS, SSL, redirect, AI bot blocking
* Astro foundation: layouts, components, config
* Calculator #1: Side-Hustle Tax Calculator (MVP)
* Branding: logo, hero, favicons, OG image
* MoneySavingExpert-style content layout refactor
* Production deployment to Cloudflare Workers
* Lighthouse audit: 97/91/100/85 → 100/96/100/92
* Security headers added
* Sitemap submitted, Search Console indexed
* AdSense applied
* Calculator #2: Take-Home Pay Calculator
* Calculator #3: Sole Trader vs Ltd Co (including key finding about 2026/27 rates)
* Tax year update: 2025/26 → 2026/27 across all calculators
Session 2 (20 May 2026) — Calculator #4
* Calculator #4: Trading Allowance Checker (guided decision tree)
* 79 tests passing
* All 4 calculators cross-linked
* This status document created


________________


Next Actions (Priority Order)
1. Check AdSense approval status — if approved, ads start showing immediately
2. Build calculator #5: Dividend Tax Calculator — high search volume, 2026/27 rates increased
3. Build calculator #6: Self-Assessment Deadline & Penalty Checker — seasonal tool
4. Build calculator #7: Etsy/Vinted Seller HMRC Reporting Checker — DAC7 rules
5. Build calculator #8: Side-Hustle Growth/Revenue Tracker — planning tool (not tax)
6. Fix local dev server — "module is not defined" workerd issue
7. Add Scottish tax rates toggle — across all calculators
8. Re-add PWA support — when @vite-pwa/astro updates for Astro 6
9. Start v2 property tax cluster — post-AdSense approval
10. Promote: Reddit (r/UKPersonalFinance, r/SideHustle), Facebook groups, ProductHunt, IndieHackers, TikTok


________________


Important Gotchas (Learned the Hard Way)
1. Always run npm install from the project directory — running from C:\Users\Thoma\ creates user-level node_modules pollution that causes duplicate React, font 403s, and white screens
2. CSP lives in TWO files — middleware.ts AND public/_headers. Update both or the change won't take effect.
3. Ctrl+Shift+R doesn't work in Opera — use Shift+click refresh button, or right-click refresh → "Empty Cache and Hard Reload"
4. F12 doesn't work on Dan's laptop — use right-click → Inspect, or Ctrl+Shift+I
5. vendor.js console errors are Opera extensions — ignore them completely
6. Income tax bands in JSON are relative to taxable income — band 2 to is 112570 (not 125140). The bands are applied AFTER subtracting PA.
7. Always deploy before commit if dev server is broken — production is the verification environment until dev is fixed
8. Test in incognito to bypass browser cache — Ctrl+Shift+N in Opera