import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { submitPublicIntake } from '../api';

const INITIAL_FORM = { customer_name: '', phone: '', issue: '', urgent: false, notes: '', company_website: '' };

export default function ServiceRequest() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const setField = (field, value) => setForm(current => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await submitPublicIntake(form);
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'We could not send your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-frost px-4 py-8 sm:py-12 flex items-center justify-center">
      <section className="w-full max-w-xl rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="font-label-lg text-label-lg tracking-wide text-primary">THAW</div>
            <p className="mt-1 text-sm text-secondary">Thaw Refrigeration Service</p>
          </div>
          <Link to="/login" className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-secondary hover:bg-frost hover:text-on-surface">
            Staff sign in
          </Link>
        </div>

        {submitted ? (
          <div role="status" className="py-5">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success-tint text-success" aria-hidden="true">✓</div>
            <h1 className="font-headline-md text-headline-md text-on-surface">Request received</h1>
            <p className="mt-2 leading-6 text-secondary">Your service request has been sent to our team. We’ll contact you using the phone number you provided.</p>
            <button type="button" onClick={() => { setForm(INITIAL_FORM); setSubmitted(false); }} className="mt-6 h-11 rounded-lg border border-line px-4 font-medium text-on-surface hover:bg-frost">
              Submit another request
            </button>
          </div>
        ) : (
          <>
            <h1 className="font-headline-md text-headline-md text-on-surface">Request refrigeration service</h1>
            <p className="mt-2 text-sm leading-6 text-secondary">Tell us what’s happening and our team will follow up with you.</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                <label htmlFor="companyWebsite">Leave this field empty</label>
                <input id="companyWebsite" name="company_website" tabIndex={-1} autoComplete="off" value={form.company_website} onChange={event => setField('company_website', event.target.value)} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name or business" htmlFor="requestName">
                  <input id="requestName" name="customer_name" autoComplete="name" maxLength={120} required value={form.customer_name} onChange={event => setField('customer_name', event.target.value)} className={inputClass} placeholder="Your name or business" />
                </Field>
                <Field label="Phone number" htmlFor="requestPhone">
                  <input id="requestPhone" name="phone" type="tel" autoComplete="tel" maxLength={40} required value={form.phone} onChange={event => setField('phone', event.target.value)} className={inputClass} placeholder="Best number to reach you" />
                </Field>
              </div>

              <Field label="What needs repair?" htmlFor="requestIssue">
                <textarea id="requestIssue" name="issue" rows={4} maxLength={2000} required value={form.issue} onChange={event => setField('issue', event.target.value)} className={`${inputClass} h-auto py-3`} placeholder="Tell us about the equipment and what it’s doing" />
              </Field>

              <Field label="Additional notes (optional)" htmlFor="requestNotes">
                <textarea id="requestNotes" name="notes" rows={2} maxLength={2000} value={form.notes} onChange={event => setField('notes', event.target.value)} className={`${inputClass} h-auto py-3`} placeholder="Location details, access instructions, or anything else helpful" />
              </Field>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-frost p-3">
                <input type="checkbox" checked={form.urgent} onChange={event => setField('urgent', event.target.checked)} className="mt-1 h-4 w-4 accent-[#0b7a86]" />
                <span>
                  <span className="block text-sm font-semibold text-on-surface">This is urgent</span>
                  <span className="mt-0.5 block text-sm text-secondary">For a refrigeration failure or food safety concern.</span>
                </span>
              </label>

              {error && <p role="alert" className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</p>}

              <button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-lg bg-primary-container font-semibold text-on-primary transition-colors hover:bg-[#09636D] disabled:cursor-wait disabled:opacity-60">
                {isSubmitting ? 'Sending request…' : 'Send service request'}
              </button>
              <p className="text-center text-xs leading-5 text-secondary">Submitting this form does not dispatch a technician. Our office will call you to confirm next steps.</p>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

const inputClass = 'h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-on-surface outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20';

function Field({ label, htmlFor, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-on-surface">{label}</label>
      {children}
    </div>
  );
}
