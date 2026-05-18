import type { SoleTraderResult, LtdCompanyResult } from '../../../lib/calculators/soleTraderVsLtd';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
  }).format(n);

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

interface BreakdownRowProps {
  label: string;
  value: string;
  indent?: boolean;
  bold?: boolean;
  muted?: boolean;
}

function Row({ label, value, indent, bold, muted }: BreakdownRowProps) {
  return (
    <div className={`flex items-center justify-between py-1 ${indent ? 'pl-4' : ''}`}>
      <span className={`text-sm ${muted ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'} ${bold ? 'font-semibold' : ''}`}>
        {label}
      </span>
      <span className={`text-sm tabular-nums ${bold ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-[var(--border)] my-1" />;
}

export function SoleTraderBreakdown({ data }: { data: SoleTraderResult }) {
  return (
    <div className="space-y-0.5">
      <Row label="Gross profit" value={fmt(data.grossProfit)} />
      <Row label="Personal Allowance" value={fmt(data.personalAllowance)} muted />
      <Divider />
      <Row label="Income Tax" value={fmt(data.incomeTax)} />
      {data.incomeTaxBreakdown.map((b, i) => (
        <Row key={i} label={`${b.band} @ ${pct(b.rate)}`} value={fmt(b.tax)} indent muted />
      ))}
      <Divider />
      <Row label="Class 4 NI" value={fmt(data.class4NI)} />
      {data.class4Breakdown.map((b, i) => (
        <Row key={i} label={`${b.band} @ ${pct(b.rate)}`} value={fmt(b.ni)} indent muted />
      ))}
      {data.class2NI > 0 && <Row label="Class 2 NI" value={fmt(data.class2NI)} />}
      <Divider />
      <Row label="Total Tax" value={fmt(data.totalTax)} bold />
      <Row label="Effective Rate" value={pct(data.effectiveRate)} muted />
    </div>
  );
}

export function LtdCompanyBreakdown({ data }: { data: LtdCompanyResult }) {
  return (
    <div className="space-y-0.5">
      <Row label="Gross profit" value={fmt(data.grossProfit)} />
      <Row label="Director salary" value={fmt(data.directorSalary)} muted />
      <Row label="Employer NI (gross)" value={fmt(data.employerNI)} muted />
      {data.employmentAllowanceUsed > 0 && (
        <Row label="Employment Allowance" value={`-${fmt(data.employmentAllowanceUsed)}`} indent muted />
      )}
      <Row label="Employer NI (net)" value={fmt(data.netEmployerNI)} />
      <Divider />
      <Row label="CT Taxable Profit" value={fmt(data.corporationTaxableProfit)} />
      <Row label={`Corporation Tax (${data.corporationTaxRate})`} value={fmt(data.corporationTax)} />
      {data.marginalRelief > 0 && (
        <Row label="Marginal relief" value={`-${fmt(data.marginalRelief)}`} indent muted />
      )}
      <Divider />
      <Row label="Dividends paid" value={fmt(data.dividendsPaid)} />
      <Row label="Dividend Tax" value={fmt(data.dividendTax)} />
      {data.dividendTaxBreakdown.map((b, i) => (
        <Row key={i} label={`${b.band} @ ${pct(b.rate)}`} value={fmt(b.tax)} indent muted />
      ))}
      {data.personalIncomeTax > 0 && (
        <Row label="Personal Income Tax" value={fmt(data.personalIncomeTax)} />
      )}
      <Divider />
      <Row label="Accounting costs" value={fmt(data.accountingCosts)} />
      <Row label="Total Tax + Costs" value={fmt(data.totalCosts)} bold />
      <Row label="Effective Rate" value={pct(data.effectiveRate)} muted />
    </div>
  );
}
