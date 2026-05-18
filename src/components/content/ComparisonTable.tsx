'use client';

interface ComparisonTableProps {
  headers: string[];
  rows: string[][];
  highlightColumn?: number;
}

export function ComparisonTable({
  headers,
  rows,
  highlightColumn,
}: ComparisonTableProps) {
  return (
    <div
      className="my-6 overflow-x-auto rounded-lg border"
      style={{ borderColor: 'var(--border)' }}
    >
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            {headers.map((header, colIndex) => (
              <th
                key={colIndex}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${
                  highlightColumn === colIndex
                    ? 'bg-primary-50 dark:bg-primary-900/30'
                    : ''
                }`}
                style={{ color: 'var(--text-muted)' }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-t"
              style={{
                borderColor: 'var(--border)',
                backgroundColor:
                  rowIndex % 2 === 1 ? 'var(--bg-secondary)' : undefined,
              }}
            >
              {row.map((cell, colIndex) => (
                <td
                  key={colIndex}
                  className={`px-4 py-3 ${
                    highlightColumn === colIndex
                      ? 'bg-primary-50/50 font-medium dark:bg-primary-900/20'
                      : ''
                  }`}
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
