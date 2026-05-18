'use client';

import type { ReactNode } from 'react';

interface AccordionSectionProps {
  id: string;
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function AccordionSection({
  id,
  title,
  defaultOpen = false,
  children,
}: AccordionSectionProps) {
  return (
    <details
      id={id}
      open={defaultOpen || undefined}
      className="group my-4 rounded-lg border"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      <summary
        className="flex cursor-pointer select-none items-center gap-3 px-5 py-4 text-xl font-semibold list-none [&::-webkit-details-marker]:hidden"
        style={{ color: 'var(--text-primary)' }}
      >
        {/* Chevron */}
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-5 w-5 shrink-0 transition-transform duration-200 group-open:rotate-90"
          style={{ color: 'var(--text-muted)' }}
        >
          <path
            fillRule="evenodd"
            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
            clipRule="evenodd"
          />
        </svg>
        <span>{title}</span>
      </summary>

      {/* Animated content via grid-rows trick */}
      <div
        className="border-l-4 border-l-primary-500 dark:border-l-primary-400 mx-5 mb-5 overflow-hidden"
      >
        <div
          className="pl-4 text-sm leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {children}
        </div>
      </div>
    </details>
  );
}
