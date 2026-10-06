import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Summary from './components/Summary';
import CallToday from './components/CallToday';
import Pipeline from './components/Pipeline';
import AddJobDrawer from './components/AddJobDrawer';
import Login from './components/Login';
import { getSession, logout, getJobs, getSummary, getCallToday, createJob, updateJob, addContact } from './api';

function App() {
  const location = useLocation();
  const [jobs, setJobs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [callTodayJobs, setCallTodayJobs] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

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
      if (err.response?.status === 401) setUser(null);
      console.error("Failed to load data", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getSession()
      .then(({ user: sessionUser }) => setUser(sessionUser))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setUser(null);
      setJobs([]);
      setCallTodayJobs([]);
      setSummary(null);
    }
  };

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
  const today = todayStr;

  const filteredJobs = useMemo(() => jobs.filter(job => matchesSearch(job, searchQuery)), [jobs, searchQuery]);
  const filteredCallTodayJobs = useMemo(
    () => callTodayJobs.filter(job => matchesSearch(job, searchQuery)),
    [callTodayJobs, searchQuery]
  );

  if (authLoading) {
    return <main className="min-h-screen bg-frost flex items-center justify-center text-secondary">Checking your session…</main>;
  }

  if (!user) {
    return location.pathname === '/login'
      ? <Login onAuthenticated={setUser} />
      : <Navigate to="/login" replace />;
  }

  if (location.pathname !== '/') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="bg-frost font-body-lg text-on-surface min-h-screen pb-10">
      <Header user={user} onLogout={handleLogout} />

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
            <div className="flex items-center gap-space-sm w-full sm:w-auto sm:shrink-0">
              <div className="relative min-w-0 flex-1 sm:flex-none">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-secondary">search</span>
                <input
                  type="text"
                  id="globalJobSearch"
                  placeholder="Search name, phone, issue..."
                  aria-label="Search jobs by customer, phone, issue, source, or notes"
                  className="h-10 w-full sm:w-64 pl-9 pr-9 bg-surface border border-line rounded-[10px] text-body-sm font-body-sm text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && <button type="button" aria-label="Clear search" onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-secondary hover:text-on-surface">×</button>}
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
              <CallToday jobs={filteredCallTodayJobs} onMarkContacted={handleMarkContacted} searchQuery={searchQuery} />
              <Pipeline jobs={filteredJobs} onChangeStage={handleChangeStage} searchQuery={searchQuery} />
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

function matchesSearch(job, rawQuery) {
  const terms = normalizeSearch(rawQuery).split(' ').filter(Boolean);
  if (terms.length === 0) return true;
  const searchableText = normalizeSearch([
    job.customer_name,
    job.phone,
    job.issue,
    job.source,
    job.stage,
    job.notes
  ].filter(Boolean).join(' '));
  return terms.every(term => searchableText.includes(term));
}

function normalizeSearch(value) {
  return String(value ?? '').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export default App;
