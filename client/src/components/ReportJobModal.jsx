import React, { useState } from 'react';
import { X, AlertTriangle, Send } from 'lucide-react';
import { api } from '../api';

const REPORT_REASONS = [
  'Misleading job description or requirements',
  'Incorrect salary or compensation range',
  'Suspected phishing, scam, or advance-fee request',
  'Expired vacancy still marked as open',
  'Duplicate or spam listing',
  'Other ethical or compliance concern'
];

export default function ReportJobModal({ job, onClose, onSuccess }) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await api.reportJob(job.id, { reason, details });
      onSuccess(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-rose)' }}>
              <AlertTriangle size={18} />
              Report Vacancy
            </h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {job.title} &middot; {job.company}
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ margin: '0 0 1rem', fontSize: '0.86rem', color: 'var(--text-body)' }}>
              Our integrity team reviews reported listings promptly to protect job seekers from false, discriminatory, or misleading postings.
            </p>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="field">
              <label className="field-label">Primary Reason *</label>
              <select className="select" value={reason} onChange={(e) => setReason(e.target.value)}>
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field-label">Additional Context or Evidence (Optional)</label>
              <textarea
                className="textarea"
                placeholder="Describe any inconsistencies, external links, or recruiter communication..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger-soft" disabled={submitting}>
              <Send size={14} />
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
