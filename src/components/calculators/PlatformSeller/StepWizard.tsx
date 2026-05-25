import { useState, useCallback } from 'react';
import type { ActivityType, PlatformSellerInput } from '../../../lib/calculators/platformSellerChecker';

const PLATFORMS = [
  { value: 'etsy', label: 'Etsy', icon: '🛍️' },
  { value: 'ebay', label: 'eBay', icon: '🏷️' },
  { value: 'vinted', label: 'Vinted', icon: '👗' },
  { value: 'depop', label: 'Depop', icon: '📱' },
  { value: 'amazon', label: 'Amazon', icon: '📦' },
  { value: 'tiktok-shop', label: 'TikTok Shop', icon: '🎵' },
  { value: 'fiverr', label: 'Fiverr', icon: '💼' },
  { value: 'upwork', label: 'Upwork', icon: '💻' },
  { value: 'deliveroo', label: 'Deliveroo', icon: '🚴' },
  { value: 'uber', label: 'Uber', icon: '🚗' },
  { value: 'youtube', label: 'YouTube', icon: '🎬' },
  { value: 'airbnb', label: 'Airbnb', icon: '🏠' },
  { value: 'other-marketplace', label: 'Other marketplace', icon: '🔧' },
  { value: 'other-services', label: 'Other services', icon: '📝' },
];

const ACTIVITY_TYPES: { value: ActivityType; label: string; icon: string }[] = [
  { value: 'selling-made-items', label: 'I make items and sell them (handmade, crafts, art)', icon: '🎨' },
  { value: 'buying-to-resell', label: 'I buy items to resell at a profit (flipping, vintage, wholesale)', icon: '🔄' },
  { value: 'selling-personal-items', label: "I'm selling personal belongings I no longer want", icon: '🧹' },
  { value: 'freelance-services', label: 'I provide freelance services (design, writing, consulting)', icon: '💼' },
  { value: 'gig-delivery', label: 'I do gig/delivery work', icon: '🚗' },
  { value: 'content-creation', label: 'I create content (videos, streams, newsletters)', icon: '🎬' },
  { value: 'rental-property', label: 'I rent out property or a room', icon: '🏠' },
  { value: 'mixed', label: 'Mix of the above', icon: '🔀' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export type WizardResult = Omit<PlatformSellerInput, 'taxYear'>;

interface StepWizardProps {
  onComplete: (result: WizardResult) => void;
}

export function StepWizard({ onComplete }: StepWizardProps) {
  const [step, setStep] = useState(1);

  // Step 1
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  // Step 2
  const [activityType, setActivityType] = useState<ActivityType | null>(null);
  // Step 3
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [grossRevenue, setGrossRevenue] = useState(0);
  const [joinedMidYear, setJoinedMidYear] = useState(false);
  const [monthJoined, setMonthJoined] = useState<number | undefined>();
  const [hasReceivedHMRCLetter, setHasReceivedHMRCLetter] = useState(false);
  // Step 4 (only if trading)
  const [grossTradingIncomeTaxYear, setGrossTradingIncomeTaxYear] = useState(0);
  const [actualExpenses, setActualExpenses] = useState(0);
  // Context questions
  const [sellingPersonalItemsAtLoss, setSellingPersonalItemsAtLoss] = useState(false);
  const [buyingToResell, setBuyingToResell] = useState(false);
  const [regularActivity, setRegularActivity] = useState(false);

  const isServicesActivity = activityType === 'freelance-services' || activityType === 'gig-delivery' || activityType === 'content-creation';
  const isPersonalSelling = activityType === 'selling-personal-items';
  const isRentalProperty = activityType === 'rental-property';
  const needsTaxStep = !isPersonalSelling || !sellingPersonalItemsAtLoss || buyingToResell || regularActivity;

  const totalSteps = needsTaxStep && !isRentalProperty && !isPersonalSelling ? 5 : 4;
  const progress = Math.min(step / totalSteps, 1) * 100;

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleActivitySelect = useCallback((type: ActivityType) => {
    setActivityType(type);
    // Pre-set context flags based on activity
    if (type === 'selling-personal-items') {
      setSellingPersonalItemsAtLoss(true);
      setBuyingToResell(false);
    } else if (type === 'buying-to-resell') {
      setBuyingToResell(true);
      setSellingPersonalItemsAtLoss(false);
    } else if (type === 'selling-made-items') {
      setRegularActivity(true);
      setSellingPersonalItemsAtLoss(false);
      setBuyingToResell(false);
    } else if (isServicesActivity) {
      setRegularActivity(true);
      setSellingPersonalItemsAtLoss(false);
      setBuyingToResell(false);
    }
  }, [isServicesActivity]);

  const handleSubmit = useCallback(() => {
    if (!activityType) return;
    onComplete({
      platforms: selectedPlatforms,
      activityType,
      totalTransactions,
      grossRevenue,
      grossTradingIncomeTaxYear: grossTradingIncomeTaxYear || grossRevenue,
      actualExpenses,
      sellingPersonalItemsAtLoss,
      buyingToResell,
      regularActivity,
      joinedMidYear,
      monthJoined,
      hasReceivedHMRCLetter,
    });
  }, [
    activityType, selectedPlatforms, totalTransactions, grossRevenue,
    grossTradingIncomeTaxYear, actualExpenses, sellingPersonalItemsAtLoss,
    buyingToResell, regularActivity, joinedMidYear, monthJoined, hasReceivedHMRCLetter,
    onComplete,
  ]);

  const canAdvanceStep1 = selectedPlatforms.length > 0;
  const canAdvanceStep2 = activityType !== null;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
          Step {step} of {totalSteps}
        </span>
      </div>

      {/* Step 1: Platform Selection */}
      {step === 1 && (
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
            Which platforms do you sell on?
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Select all that apply — thresholds are combined across platforms.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                onClick={() => togglePlatform(p.value)}
                className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors ${
                  selectedPlatforms.includes(p.value)
                    ? 'border-primary-500 bg-primary-100 dark:bg-primary-900/40 ring-1 ring-primary-500/30'
                    : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-primary-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span className="text-lg shrink-0">{p.icon}</span>
                <span className={selectedPlatforms.includes(p.value) ? 'text-primary-900 dark:text-primary-100 font-medium' : 'text-[var(--text-primary)]'}>
                  {p.label}
                </span>
              </button>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => canAdvanceStep1 && setStep(2)}
              disabled={!canAdvanceStep1}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Activity Type */}
      {step === 2 && (
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
            What best describes your activity?
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            This determines whether HMRC considers your income as trading.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ACTIVITY_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => handleActivitySelect(t.value)}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                  activityType === t.value
                    ? 'border-primary-500 bg-primary-100 dark:bg-primary-900/40 ring-1 ring-primary-500/30'
                    : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-primary-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span className="text-xl shrink-0">{t.icon}</span>
                <span className={activityType === t.value ? 'text-primary-900 dark:text-primary-100 font-medium' : 'text-[var(--text-primary)]'}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => canAdvanceStep2 && setStep(3)}
              disabled={!canAdvanceStep2}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Context Questions */}
      {step === 3 && (
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
            A few more details
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            These help determine if HMRC considers your activity as trading.
          </p>
          <div className="space-y-4">
            {/* Context toggles */}
            {(activityType === 'selling-personal-items' || activityType === 'mixed') && (
              <ToggleQuestion
                label="Are you selling items you already owned for less than you paid?"
                value={sellingPersonalItemsAtLoss}
                onChange={setSellingPersonalItemsAtLoss}
              />
            )}
            {activityType !== 'buying-to-resell' && !isServicesActivity && !isRentalProperty && (
              <ToggleQuestion
                label="Do you buy items specifically to resell at a profit?"
                value={buyingToResell}
                onChange={setBuyingToResell}
              />
            )}
            {!isServicesActivity && (
              <ToggleQuestion
                label="Is this a regular, ongoing activity (not a one-off clearout)?"
                value={regularActivity}
                onChange={setRegularActivity}
              />
            )}

            <ToggleQuestion
              label="Have you received a letter from HMRC about your online selling?"
              value={hasReceivedHMRCLetter}
              onChange={setHasReceivedHMRCLetter}
            />
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Numbers */}
      {step === 4 && (
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
            Your numbers
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Platform reporting uses the <strong>calendar year</strong> (Jan–Dec). Tax uses the <strong>tax year</strong> (6 Apr–5 Apr). These may give different totals.
          </p>
          <div className="space-y-4">
            <NumberInput
              label="Total transactions this calendar year (Jan–Dec 2026)"
              hint="Individual sales/orders across ALL platforms combined"
              value={totalTransactions}
              onChange={setTotalTransactions}
            />
            <NumberInput
              label="Total gross revenue this calendar year"
              hint="Total £ received across ALL platforms before any deductions"
              prefix="£"
              value={grossRevenue}
              onChange={setGrossRevenue}
            />

            <ToggleQuestion
              label="Did you start selling partway through this year?"
              value={joinedMidYear}
              onChange={setJoinedMidYear}
            />
            {joinedMidYear && (
              <div>
                <label className="text-sm font-medium text-[var(--text-primary)] block mb-1">
                  Which month did you start?
                </label>
                <select
                  value={monthJoined ?? ''}
                  onChange={(e) => setMonthJoined(e.target.value ? Number(e.target.value) : undefined)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                >
                  <option value="">Select month</option>
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => {
                if (needsTaxStep && !isRentalProperty && !isPersonalSelling) {
                  setGrossTradingIncomeTaxYear(grossRevenue); // pre-fill
                  setStep(5);
                } else {
                  handleSubmit();
                }
              }}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              {needsTaxStep && !isRentalProperty && !isPersonalSelling ? 'Next →' : 'Check my status →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Tax Position (only for traders) */}
      {step === 5 && (
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
            Tax year income
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            The tax year runs 6 April – 5 April. Your tax year total may differ from your calendar year total.
          </p>
          <div className="space-y-4">
            <NumberInput
              label="Gross trading income this tax year (Apr 2026–Apr 2027)"
              hint="May differ from calendar year figure above"
              prefix="£"
              value={grossTradingIncomeTaxYear}
              onChange={setGrossTradingIncomeTaxYear}
            />
            <NumberInput
              label="Total business expenses this tax year"
              hint="Materials, tools, postage, software, travel — leave at 0 if unsure"
              prefix="£"
              value={actualExpenses}
              onChange={setActualExpenses}
            />
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(4)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              Check my status →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Reusable sub-components ---

function ToggleQuestion({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
      <p className="text-sm text-[var(--text-primary)] mb-2">{label}</p>
      <div className="flex gap-3">
        {(['Yes', 'No'] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt === 'Yes')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              (opt === 'Yes' && value) || (opt === 'No' && !value)
                ? 'bg-primary-500 text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function NumberInput({ label, hint, prefix, value, onChange }: {
  label: string;
  hint?: string;
  prefix?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-[var(--text-primary)] block mb-1">{label}</label>
      {hint && <p className="text-xs text-[var(--text-muted)] mb-1">{hint}</p>}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">{prefix}</span>
        )}
        <input
          type="number"
          inputMode="numeric"
          value={value || ''}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          placeholder="0"
          className={`w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] ${prefix ? 'pl-7' : 'pl-3'} pr-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500`}
        />
      </div>
    </div>
  );
}
