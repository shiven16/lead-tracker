import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

const STAGES = [
  { id: 'new', label: 'New' },
  { id: 'waiting_on_quote', label: 'Waiting on quote' },
  { id: 'waiting_on_yes', label: 'Waiting on yes' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'done', label: 'Done' },
];

const STAGE_BADGE = {
  new: 'bg-teal-tint text-primary-container',
  waiting_on_quote: 'bg-attention-tint text-attention',
  waiting_on_yes: 'bg-attention-tint text-attention',
  scheduled: 'bg-frost text-secondary border border-line',
  done: 'bg-success-tint text-success',
};

export default function Pipeline({ jobs, onChangeStage }) {
  const [activeStage, setActiveStage] = useState(null); // null = show all

  const jobsByStage = STAGES.reduce((acc, stage) => {
    acc[stage.id] = jobs.filter(job => job.stage === stage.id);
    return acc;
  }, {});

  // Only count stages that actually have jobs
  const activePhaseCount = STAGES.filter(s => jobsByStage[s.id].length > 0).length;

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    });

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return 'never';
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  };

  // Filtered view: single stage list, or all stages
  const stagesToShow = activeStage
    ? STAGES.filter(s => s.id === activeStage)
    : STAGES;

  return (
    <section aria-labelledby="pipelineHeading" className="mb-space-xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-space-md">
        <h2 className="font-headline-sm text-headline-sm text-on-surface" id="pipelineHeading">
          All jobs by stage
        </h2>
        <div className="flex items-center gap-space-xs text-secondary font-label-md text-label-md">
          <span className="material-symbols-outlined text-[16px]">view_column</span>
          <span>{activePhaseCount} Active {activePhaseCount === 1 ? 'Phase' : 'Phases'}</span>
        </div>
      </div>

      {/* Stage filter tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-space-md">
        {/* "All" tab */}
        <button
          type="button"
          onClick={() => setActiveStage(null)}
          className={`h-8 px-3.5 rounded-full font-label-md text-label-md transition-all border ${
            activeStage === null
              ? 'bg-on-surface text-surface border-on-surface'
              : 'bg-surface text-secondary border-line hover:border-on-surface-variant hover:text-on-surface'
          }`}
        >
          All
          <span className={`ml-1.5 font-semibold ${activeStage === null ? 'text-surface' : 'text-on-surface'}`}>
            {jobs.length}
          </span>
        </button>

        {STAGES.map(stage => {
          const count = jobsByStage[stage.id].length;
          const isActive = activeStage === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setActiveStage(isActive ? null : stage.id)}
              className={`h-8 px-3.5 rounded-full font-label-md text-label-md transition-all border flex items-center gap-1.5 ${
                isActive
                  ? 'bg-on-surface text-surface border-on-surface'
                  : count === 0
                  ? 'bg-surface text-secondary border-line opacity-40 cursor-default'
                  : 'bg-surface text-secondary border-line hover:border-on-surface-variant hover:text-on-surface cursor-pointer'
              }`}
              disabled={count === 0}
            >
              {stage.label}
              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                isActive
                  ? 'bg-surface/20 text-surface'
                  : STAGE_BADGE[stage.id]
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Kanban columns — when all: 5-col grid; when filtered: single list */}
      <div className={activeStage ? 'flex flex-col gap-space-sm max-w-sm' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-sm items-start'}>
        {stagesToShow.map(stage => (
          <div key={stage.id} className="flex flex-col gap-space-sm">

            {/* Column header (shown in all-stages view) */}
            {!activeStage && (
              <div className="rounded-lg px-3 py-2 border border-line bg-surface flex items-center justify-between">
                <span className="font-label-lg text-label-lg text-on-surface">{stage.label}</span>
                <span className={`px-2 py-0.5 rounded-full font-label-md text-label-md font-semibold ${STAGE_BADGE[stage.id]}`}>
                  {jobsByStage[stage.id].length}
                </span>
              </div>
            )}

            {/* Job cards */}
            {jobsByStage[stage.id].length === 0 && !activeStage ? (
              <div className="text-center py-4 text-secondary font-body-sm text-body-sm opacity-50">—</div>
            ) : (
              jobsByStage[stage.id].map(job => (
                <div
                  key={job.id}
                  className={`bg-surface rounded-xl p-3.5 border border-line flex flex-col gap-2 ${
                    job.urgent && stage.id !== 'done' ? 'border-l-4 border-l-urgent' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <h4 className={`font-label-lg text-label-lg text-on-surface leading-tight ${job.stage === 'done' ? 'line-through opacity-70' : ''}`}>
                      {job.customer_name}
                    </h4>
                    {job.stage === 'done' ? (
                      <span className="material-symbols-outlined text-[18px] text-success shrink-0">check_circle</span>
                    ) : (
                      <button type="button" className="text-secondary hover:text-on-surface shrink-0" title="Edit">
                        <span className="material-symbols-outlined text-[18px]">edit_note</span>
                      </button>
                    )}
                  </div>

                  <p className={`font-body-sm text-body-sm line-clamp-2 ${job.stage === 'done' ? 'text-secondary' : 'text-on-surface'}`}>
                    {job.issue}
                  </p>

                  <div className="flex items-center gap-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded font-label-md text-label-md border ${
                      job.stage === 'done' ? 'bg-success-tint text-success border-none' : 'bg-frost text-secondary border-line'
                    }`}>
                      {job.stage === 'done' ? 'Paid' : job.source.replace(/_/g, ' ')}
                    </span>
                    <span className="font-label-md text-label-md font-semibold text-on-surface ml-auto tabular-nums">
                      {formatMoney(job.estimated_value)}
                    </span>
                  </div>

                  {job.stage !== 'done' && (
                    <p className="font-body-sm text-body-sm text-secondary">
                      Last contacted {getTimeAgo(job.last_contacted_at || job.created_at)}
                    </p>
                  )}

                  {job.stage !== 'done' && (
                    <div className="pt-1 border-t border-line">
                      <select
                        className="w-full h-8 bg-frost border border-line rounded font-label-md text-label-md text-on-surface px-1.5 focus:outline-none cursor-pointer"
                        value={job.stage}
                        onChange={e => onChangeStage(job.id, e.target.value)}
                      >
                        {STAGES.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.id === job.stage ? `Stage: ${s.label}` : `Move: ${s.label}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
