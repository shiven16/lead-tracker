import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { login } from '../api';

const DEMO_EMAIL = 'denise@thaw.demo';
const DEMO_PASSWORD = 'ThawDemo2026!';

export default function Login({ onAuthenticated }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const result = await login({ email, password });
      onAuthenticated(result.user);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not sign in. Check that the API is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const useDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setShowDemo(false);
    setError('');
  };

  return (
    <main className="min-h-screen bg-frost px-4 py-10 flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-sm">
        <div className="mb-7">
          <div className="font-label-lg text-label-lg text-primary tracking-wide">THAW</div>
          <p className="mt-1 text-sm text-secondary">Thaw Refrigeration Service</p>
        </div>
        <h1 className="font-headline-md text-headline-md text-on-surface">Sign in to your dashboard</h1>
        <p className="mt-2 text-sm leading-6 text-secondary">Access Denise’s job pipeline and today’s follow-up list.</p>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <label htmlFor="loginEmail" className="text-sm font-medium text-on-surface">Email</label>
            <input id="loginEmail" type="email" autoComplete="username" required value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 w-full rounded-lg border border-line bg-white px-3 text-on-surface outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="loginPassword" className="text-sm font-medium text-on-surface">Password</label>
            <input id="loginPassword" type="password" autoComplete="current-password" required value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 w-full rounded-lg border border-line bg-white px-3 text-on-surface outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20" />
          </div>

          {error && <p role="alert" className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</p>}

          <button type="submit" disabled={isSubmitting}
            className="h-11 w-full rounded-lg bg-primary-container font-semibold text-on-primary transition-colors hover:bg-[#09636D] disabled:cursor-wait disabled:opacity-60">
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-5 border-t border-line pt-4 text-center">
          <button type="button" onClick={() => setShowDemo(value => !value)}
            className="text-sm font-medium text-primary-container underline underline-offset-4 hover:text-primary">
            {showDemo ? 'Hide demo credentials' : 'Click here to get demo credentials'}
          </button>
          {showDemo && (
            <div className="mt-3 rounded-lg bg-frost p-3 text-left text-sm text-on-surface">
              <p><span className="font-medium">Email:</span> {DEMO_EMAIL}</p>
              <p className="mt-1"><span className="font-medium">Password:</span> {DEMO_PASSWORD}</p>
              <button type="button" onClick={useDemo} className="mt-3 font-medium text-primary-container hover:underline">
                Fill demo credentials
              </button>
            </div>
          )}
        </div>
        <p className="mt-5 text-center text-sm text-secondary">
          Need a repair?{' '}
          <Link to="/request-service" className="font-semibold text-primary-container underline underline-offset-4 hover:text-primary">
            Request service
          </Link>
        </p>
      </section>
    </main>
  );
}
