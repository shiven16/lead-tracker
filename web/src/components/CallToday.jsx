import React from 'react';

export default function CallToday({ jobs, onMarkContacted, searchQuery = '' }) {
  if (!jobs || jobs.length === 0) {
    return (
      <section aria-labelledby="allCaughtUpHeading" className="mb-space-xl flex flex-col items-center justify-center p-space-xl bg-surface border border-line rounded-xl text-center">
        <span className="material-symbols-outlined text-[48px] text-success mb-space-sm">check_circle</span>
        <h2 className="font-headline-sm text-headline-sm text-on-surface mb-1">{searchQuery ? 'No matching follow-ups' : 'All caught up'}</h2>
        <p className="font-body-lg text-body-lg text-secondary">{searchQuery ? 'Try another name, phone number, or issue.' : 'No priority calls required today.'}</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="callTodayHeading" className="mb-space-xl">
      <div className="flex items-center justify-between mb-space-md">
        <div className="flex items-center gap-space-sm">
          <h2 className="font-headline-sm text-headline-sm text-on-surface" id="callTodayHeading">Call today</h2>
          <span className="px-2.5 py-0.5 rounded-full bg-urgent-tint text-urgent font-label-md text-label-md">
            {jobs.length} people waiting on you
          </span>
        </div>
        {/* <span className="font-body-sm text-body-sm text-secondary hidden sm:inline">Priority triage • Immediate follow-ups</span> */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
        {jobs.map(job => (
          <article
            key={job.id}
            className={`border border-line rounded-xl p-space-md flex flex-col justify-between transition-all ${
              job.urgent ? 'bg-urgent-tint border-l-4 border-l-urgent' : 'bg-surface'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-space-sm mb-space-xs">
                <h3 className="font-title-md text-title-md text-on-surface">{job.customer_name}</h3>
                {job.urgent && (
                  <span className="px-2.5 py-0.5 rounded-full bg-urgent text-on-primary font-label-md text-label-md shrink-0">Urgent</span>
                )}
                {!job.urgent && job.stage === 'waiting_on_quote' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-attention-tint text-attention font-label-md text-label-md shrink-0">Quote Due</span>
                )}
              </div>
              <p className="font-body-lg text-body-lg text-on-surface mb-space-sm">
                {job.issue}
              </p>
              <div className="flex items-center gap-2 mb-space-md">
                <span className={`w-2 h-2 rounded-full shrink-0 ${job.urgent ? 'bg-urgent' : 'bg-attention'}`}></span>
                <span className={`font-label-md text-label-md ${job.urgent ? 'text-urgent font-medium' : 'text-secondary'}`}>
                  {job.reason || (job.urgent ? 'Urgent request' : 'Needs attention')}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pt-space-xs border-t border-line/60">
              <a
                href={`tel:${job.phone}`}
                className="h-12 px-4 rounded-[10px] border-[1.5px] border-primary-container text-primary-container font-label-lg text-label-lg flex items-center justify-center gap-2 hover:bg-teal-tint transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">call</span>
                <span>Call {job.phone}</span>
              </a>
              <div className="flex items-center gap-space-xs justify-end">
                <button
                  type="button"
                  onClick={() => onMarkContacted(job.id)}
                  className="h-12 px-3.5 bg-surface text-on-surface border border-line font-label-md text-label-md rounded-[10px] hover:bg-frost transition-colors"
                >
                  Mark contacted
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
