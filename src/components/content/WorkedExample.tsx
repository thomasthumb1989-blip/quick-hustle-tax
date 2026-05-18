'use client';

import type { ReactNode } from 'react';

interface WorkedExampleProps {
  persona: string;
  job: string;
  sideHustle: string;
  income: number;
  expenses: number;
  children: ReactNode;
}

function formatCurrency(amount: number): string {
  return `£${amount.toLocaleString('en-GB')}`;
}

export function WorkedExample({
  persona,
  job,
  sideHustle,
  income,
  expenses,
  children,
}: WorkedExampleProps) {
  return (
    <div
      className="my-6 overflow-hidden rounded-lg border border-t-4 border-t-emerald-500"
      style={{
        borderColor: 'var(--border)',
        borderTopColor: '#10b981',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h3
          className="text-lg font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {persona}
        </h3>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--text-muted)' }}>
          {job} &middot; {sideHustle}
        </p>
      </div>

      {/* Key Figures */}
      <dl
        className="mx-5 mb-4 grid grid-cols-2 gap-4 rounded-md p-4"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      >
        <div>
          <dt
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: 'var(--text-muted)' }}
          >
            Side Income
          </dt>
          <dd
            className="mt-0.5 text-xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {formatCurrency(income)}
          </dd>
        </div>
        <div>
          <dt
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: 'var(--text-muted)' }}
          >
            Expenses
          </dt>
          <dd
            className="mt-0.5 text-xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {formatCurrency(expenses)}
          </dd>
        </div>
      </dl>

      {/* Calculation Narrative */}
      <div
        className="border-t px-5 py-4 text-sm leading-relaxed [&>*:last-child]:font-bold [&>*:last-child]:text-emerald-600 dark:[&>*:last-child]:text-emerald-400"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--text-secondary)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
