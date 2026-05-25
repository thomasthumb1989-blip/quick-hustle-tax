import { getPlatforms, type PlatformInfo } from '../../../lib/calculators/growthTracker';

interface PlatformSelectorProps {
  value: string;
  onChange: (platform: string) => void;
}

const FEE_SUMMARIES: Record<string, string> = {
  etsy: '~13% fees',
  ebay: '12.8% + £0.30',
  vinted: 'Free for sellers',
  amazon: '15% + £0.75/item',
  depop: 'Free for sellers',
  tiktokShop: '5%',
  shopify: '2.9% + £25/mo',
  facebookMarketplace: '5% + £0.40',
  noFees: 'No fees',
};

export function PlatformSelector({ value, onChange }: PlatformSelectorProps) {
  const platforms = getPlatforms();

  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 gap-2">
      {platforms.map((p: PlatformInfo) => {
        const selected = value === p.key;
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => onChange(p.key)}
            className={`rounded-lg border p-3 text-center transition-all ${
              selected
                ? 'bg-primary-100 dark:bg-primary-900/40 border-primary-500 ring-1 ring-primary-500/30 text-primary-900 dark:text-primary-100 font-medium'
                : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span className="text-2xl block">{p.icon}</span>
            <span className="text-xs font-medium block mt-1 leading-tight">{p.name}</span>
            <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
              {FEE_SUMMARIES[p.key] || ''}
            </span>
          </button>
        );
      })}
    </div>
  );
}
