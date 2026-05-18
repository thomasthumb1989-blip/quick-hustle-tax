'use client';

import type { ReactNode } from 'react';

interface CalloutBoxProps {
  variant: 'info' | 'warning' | 'tip' | 'example';
  title?: string;
  children: ReactNode;
}

const variantStyles = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-l-blue-500 dark:border-l-blue-400',
    titleColor: 'text-blue-800 dark:text-blue-300',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0 text-blue-500 dark:text-blue-400">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
      </svg>
    ),
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-l-amber-500 dark:border-l-amber-400',
    titleColor: 'text-amber-800 dark:text-amber-300',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0 text-amber-500 dark:text-amber-400">
        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    ),
  },
  tip: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-l-emerald-500 dark:border-l-emerald-400',
    titleColor: 'text-emerald-800 dark:text-emerald-300',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0 text-emerald-500 dark:text-emerald-400">
        <path d="M10 1a6 6 0 00-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.044a2 2 0 002 2 2 2 0 002-2v-.044c0-1.013.762-1.957 1.815-2.825A6 6 0 0010 1zM8 18a2 2 0 104 0H8z" />
      </svg>
    ),
  },
  example: {
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    border: 'border-l-violet-500 dark:border-l-violet-400',
    titleColor: 'text-violet-800 dark:text-violet-300',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0 text-violet-500 dark:text-violet-400">
        <path d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l4.122 4.12A1.5 1.5 0 0117 7.622V16.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 16.5v-13zM13.25 9a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5H11a.75.75 0 010-1.5h1.5v-1.5a.75.75 0 01.75-.75zM5 12.25a.75.75 0 01.75-.75h3.5a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75zm.75 1.75a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5z" />
      </svg>
    ),
  },
} as const;

export function CalloutBox({ variant, title, children }: CalloutBoxProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={`my-6 rounded-lg border-l-4 p-4 ${styles.bg} ${styles.border}`}
    >
      <div className="flex gap-3">
        <div className="mt-0.5">{styles.icon}</div>
        <div className="min-w-0">
          {title && (
            <p className={`mb-1 text-sm font-semibold ${styles.titleColor}`}>
              {title}
            </p>
          )}
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
