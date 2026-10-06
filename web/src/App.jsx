import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Summary from './components/Summary';
import CallToday from './components/CallToday';
import Pipeline from './components/Pipeline';
import AddJobDrawer from './components/AddJobDrawer';
import { getJobs, getSummary, getCallToday, createJob, updateJob, addContact } from './api';

function App() {
  const [jobs, setJobs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [callTodayJobs, setCallTodayJobs] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [jobsRes, summaryRes, callTodayRes] = await Promise.all([
        getJobs(),
        getSummary(),
        getCallToday()
      ]);
      setJobs(jobsRes.jobs);
      setSummary(summaryRes);
      setCallTodayJobs(callTodayRes.jobs);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveJob = async (jobData) => {
    try {
      await createJob(jobData);
      await loadData();
    } catch (err) {
      console.error("Failed to save job", err);
    }
  };

  const handleChangeStage = async (jobId, newStage) => {
    try {
      await updateJob(jobId, { stage: newStage });
      await loadData();
    } catch (err) {
      console.error("Failed to change stage", err);
    }
  };

  const handleMarkContacted = async (jobId) => {
    try {
      await addContact(jobId, { note: 'Marked contacted from dashboard' });
      await loadData();
    } catch (err) {
      console.error("Failed to mark contacted", err);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const tzName = new Intl.DateTimeFormat('en-US', { timeZoneName: 'long' })
    .formatToParts(new Date())
    .find(p => p.type === 'timeZoneName')?.value || 'Local Time';
  const today = `${todayStr} • ${tzName}`;

  const filteredJobs = searchQuery
    ? jobs.filter(job =>
        job.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.issue.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : jobs;

  return (
    <div className="bg-frost font-body-lg text-on-surface min-h-screen pb-10">
      <Header />

      <main className="w-full">
        <div className="max-w-[1200px] mx-auto px-margin-desktop py-space-sm">

          {/* Greeting + Search + Add Job row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-space-md mb-space-lg">
            <div>
              <h1 className="font-headline-md text-headline-md text-on-surface leading-tight">
                {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}, Denise
              </h1>
              <p className="font-body-sm text-body-sm text-secondary mt-0.5">{today}</p>
            </div>
            <div className="flex items-center gap-space-sm shrink-0">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-secondary">search</span>
                <input
                  type="text"
                  id="globalJobSearch"
                  placeholder="Search jobs or customer..."
                  className="h-10 w-64 pl-9 pr-3 bg-surface border border-line rounded-[10px] text-body-sm font-body-sm text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                type="button"
                id="openAddJobBtn"
                onClick={() => setIsDrawerOpen(true)}
                className="h-10 px-4 bg-primary-container hover:bg-[#09636D] text-on-primary font-label-lg text-label-lg rounded-[10px] flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add job
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-secondary font-body-lg">
              Loading…
            </div>
          ) : (
            <>
              <Summary summary={summary} />
              <CallToday jobs={callTodayJobs} onMarkContacted={handleMarkContacted} />
              <Pipeline jobs={filteredJobs} onChangeStage={handleChangeStage} />
            </>
          )}
        </div>
      </main>

      <AddJobDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveJob}
      />
    </div>
  );
}

export default App;
