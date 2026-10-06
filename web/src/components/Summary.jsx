import React from 'react';

export default function Summary({ summary }) {
  const getCount = (stage) => {
    if (!summary?.counts_by_stage) return '–';
    const item = summary.counts_by_stage.find(s => s.stage === stage);
    return item ? item.count : 0;
  };

  const openCount = (summary?.counts_by_stage || [])
    .filter(s => s.stage !== 'done')
    .reduce((acc, s) => acc + Number(s.count), 0) || '–';

  const doneCount = (summary?.counts_by_stage || []).find(s => s.stage === 'done')?.count || 0;

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    });
  };

  const tiles = [
    { value: openCount, label: 'Open jobs' },
    { value: getCount('new'), label: 'New leads' },
    { value: getCount('waiting_on_quote'), label: 'Waiting on quote' },
    { value: getCount('waiting_on_yes'), label: 'Waiting on their yes' },
    { value: getCount('scheduled'), label: 'Scheduled for dispatch' },
  ];

  return (
    <section aria-label="Operational Summary" className="mb-space-lg">
      {/* Stat tiles row */}
      <div className="flex gap-space-sm overflow-x-auto pb-1 mb-space-xs">
        {tiles.map((tile, i) => (
          <div
            key={i}
            className="bg-surface rounded-xl px-space-md py-3 border border-line flex flex-col min-w-[120px] flex-1"
          >
            <span className="font-stat-display text-stat-display tabular-nums text-on-surface leading-none mb-1">
              {tile.value}
            </span>
            <span className="font-body-sm text-body-sm text-secondary">{tile.label}</span>
          </div>
        ))}
      </div>

      {/* Footnotes row */}
      <div className="flex items-center justify-between px-1 flex-wrap gap-2">
        <div className="flex items-center gap-space-xs font-body-sm text-body-sm text-secondary">
          <span className="material-symbols-outlined text-[15px] text-primary-container">payments</span>
          <span>
            Estimated open value:{' '}
            <strong className="text-on-surface font-semibold">
              {formatMoney(summary?.open_estimated_value)}
            </strong>
          </span>
        </div>
        {/* <span className="font-body-sm text-body-sm text-secondary">
          1 technician roster active • Denise B.
        </span> */}
      </div>
    </section>
  );
}
