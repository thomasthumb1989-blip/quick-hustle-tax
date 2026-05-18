'use client';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  return (
    <div
      className="my-6 divide-y rounded-lg border"
      style={{
        borderColor: 'var(--border)',
        divideColor: 'var(--border)',
      }}
    >
      {items.map((item, index) => (
        <details
          key={index}
          className="group"
          style={{ borderColor: 'var(--border)' }}
        >
          <summary
            className="flex cursor-pointer select-none items-center justify-between gap-4 px-5 py-4 text-base font-medium list-none [&::-webkit-details-marker]:hidden"
            style={{ color: 'var(--text-primary)' }}
          >
            <span>{item.question}</span>
            {/* Plus/minus icon */}
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5 shrink-0 transition-transform duration-200 group-open:rotate-45"
              style={{ color: 'var(--text-muted)' }}
            >
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
          </summary>

          {/* Animated content */}
          <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 group-open:grid-rows-[1fr]">
            <div className="overflow-hidden">
              <div
                className="px-5 pb-4 text-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {item.answer}
              </div>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
