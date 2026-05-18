'use client';

import { useEffect, useRef, useState } from 'react';

interface TOCSection {
  id: string;
  title: string;
}

interface TableOfContentsProps {
  sections: TOCSection[];
}

export function TableOfContents({ sections }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the first intersecting entry
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0,
      }
    );

    elements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, [sections]);

  function handleClick(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const linkList = (
    <ul className="space-y-1">
      {sections.map((section) => {
        const isActive = activeId === section.id;
        return (
          <li key={section.id}>
            <button
              onClick={() => handleClick(section.id)}
              className={`block w-full border-l-2 px-3 py-1.5 text-left text-sm transition-colors ${
                isActive
                  ? 'border-l-primary-500 font-medium text-primary-600 dark:text-primary-400'
                  : 'border-l-transparent hover:border-l-primary-300'
              }`}
              style={{
                color: isActive ? undefined : 'var(--text-muted)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.target as HTMLElement).style.color =
                    'var(--text-secondary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.target as HTMLElement).style.color = 'var(--text-muted)';
                }
              }}
            >
              {section.title}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <nav aria-label="Table of contents">
      {/* Desktop: simple sticky list */}
      <div className="hidden lg:block">{linkList}</div>

      {/* Mobile: collapsible accordion */}
      <details className="lg:hidden rounded-lg border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
        <summary
          className="cursor-pointer select-none px-4 py-3 text-sm font-medium list-none [&::-webkit-details-marker]:hidden"
          style={{ color: 'var(--text-primary)' }}
        >
          <span className="flex items-center gap-2">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" style={{ color: 'var(--text-muted)' }}>
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 012 10z" clipRule="evenodd" />
            </svg>
            Jump to section
          </span>
        </summary>
        <div className="px-4 pb-3">{linkList}</div>
      </details>
    </nav>
  );
}
