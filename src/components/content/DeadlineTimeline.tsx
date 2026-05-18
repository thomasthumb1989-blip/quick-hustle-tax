'use client';

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  color?: 'blue' | 'purple' | 'red';
}

interface DeadlineTimelineProps {
  events: TimelineEvent[];
}

const dotColors = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500',
} as const;

const pillColors = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  purple:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
} as const;

function parseDate(dateStr: string): Date | null {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export function DeadlineTimeline({ events }: DeadlineTimelineProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find where "today" falls relative to events
  let todayIndex = -1;
  for (let i = 0; i < events.length; i++) {
    const eventDate = parseDate(events[i].date);
    if (eventDate && eventDate >= today) {
      todayIndex = i;
      break;
    }
  }

  return (
    <div className="my-6">
      <div className="relative pl-8">
        {/* Vertical line */}
        <div
          className="absolute left-3 top-2 bottom-2 w-0.5"
          style={{ backgroundColor: 'var(--border)' }}
        />

        {events.map((event, index) => {
          const color = event.color || 'blue';
          const showTodayMarker = todayIndex === index;

          return (
            <div key={index} className="relative pb-8 last:pb-0">
              {/* Today marker */}
              {showTodayMarker && (
                <div className="relative -ml-8 mb-4 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Today
                  </span>
                  <div className="h-px flex-1 bg-emerald-500/30" />
                </div>
              )}

              {/* Dot on the timeline */}
              <div
                className={`absolute -left-5 top-1 h-3 w-3 rounded-full ring-4 ${dotColors[color]}`}
                style={{ ringColor: 'var(--bg-primary)' }}
              />

              {/* Event card */}
              <div className="ml-2">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${pillColors[color]}`}
                >
                  {event.date}
                </span>
                <h4
                  className="mt-1.5 text-base font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {event.title}
                </h4>
                <p
                  className="mt-0.5 text-sm leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {event.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
