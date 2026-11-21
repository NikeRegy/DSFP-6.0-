import React, { useState } from 'react';
import { X, Calendar, Video, Clock, MapPin, User, AlertCircle } from 'lucide-react';

const STAGES = [
  'HR screening',
  'Technical interview',
  'Assessment',
  'Final interview',
  'Culture fit',
  'Other'
];

const FORMATS = ['Video', 'Phone', 'In-person'];

export default function ScheduleInterviewModal({
  applications = [],
  initialInterview = null,
  onClose,
  onSave
}) {
  const [applicationId, setApplicationId] = useState(
    initialInterview?.applicationId || ''
  );

  const selectedApp = applications.find((a) => a.id === applicationId);

  const [company, setCompany] = useState(
    initialInterview?.company || (selectedApp ? selectedApp.company : '')
  );
  const [position, setPosition] = useState(
    initialInterview?.position || (selectedApp ? selectedApp.jobTitle : '')
  );
  const [stage, setStage] = useState(initialInterview?.stage || 'Technical interview');
  const [format, setFormat] = useState(initialInterview?.format || 'Video');

  const formatForInput = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const defaultDateTime = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(14, 0, 0, 0);
    return formatForInput(d.toISOString());
  };

  const [interviewDate, setInterviewDate] = useState(
    initialInterview?.interviewDate ? formatForInput(initialInterview.interviewDate) : defaultDateTime()
  );
  const [locationOrLink, setLocationOrLink] = useState(
    initialInterview?.locationOrLink || ''
  );
  const [interviewerName, setInterviewerName] = useState(
    initialInterview?.interviewerName || ''
  );
  const [interviewerEmail, setInterviewerEmail] = useState(
    initialInterview?.interviewerEmail || ''
  );
  const [prepNotes, setPrepNotes] = useState(initialInterview?.prepNotes || '');
  const [questionsToExpect, setQuestionsToExpect] = useState(
    initialInterview?.questionsToExpect || ''
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleApplicationSelect(appId) {
    setApplicationId(appId);
    const match = applications.find((a) => a.id === appId);
    if (match) {
      setCompany(match.company);
      setPosition(match.jobTitle);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!company.trim() || !position.trim()) {
      setError('Please provide company name and position.');
      return;
    }
    if (!interviewDate) {
      setError('Please provide an interview date and time.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onSave({
        applicationId: applicationId || null,
        company: company.trim(),
        position: position.trim(),
        stage,
        format,
        interviewDate: new Date(interviewDate).toISOString(),
        locationOrLink: locationOrLink.trim(),
        interviewerName: interviewerName.trim(),
        interviewerEmail: interviewerEmail.trim(),
        prepNotes: prepNotes.trim(),
        questionsToExpect: questionsToExpect.trim(),
        status: initialInterview?.status || 'Scheduled'
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to schedule interview.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <div className="brand-mark" style={{ width: 34, height: 34 }}>
              <Video size={17} />
            </div>
            <div>
              <h3 className="modal-title">
                {initialInterview ? 'Edit Interview Details' : 'Record / Schedule Interview'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Track dates, meeting links, interviewers, prep notes, and questions.
              </p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label">Link to Existing Application</label>
            <select
              className="select"
              value={applicationId}
              onChange={(e) => handleApplicationSelect(e.target.value)}
            >
              <option value="">Manual Entry (Not linked to application)</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.jobTitle} at {app.company}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label">Company *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Acme Corp"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Position *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Senior Software Engineer"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label">Interview Stage</label>
              <select className="select" value={stage} onChange={(e) => setStage(e.target.value)}>
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Format</label>
              <select className="select" value={format} onChange={(e) => setFormat(e.target.value)}>
                {FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label">Date &amp; Time *</label>
              <input
                type="datetime-local"
                className="input"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Meeting Link or Location</label>
              <input
                type="text"
                className="input"
                placeholder="https://meet.google.com/... or Office address"
                value={locationOrLink}
                onChange={(e) => setLocationOrLink(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label">Interviewer Name</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Alex Morgan"
                value={interviewerName}
                onChange={(e) => setInterviewerName(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Interviewer Email</label>
              <input
                type="email"
                className="input"
                placeholder="alex.morgan@company.com"
                value={interviewerEmail}
                onChange={(e) => setInterviewerEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Preparation Notes</label>
            <textarea
              className="textarea"
              rows={2}
              placeholder="e.g. Review system design architectures, Redis caching, and questions for team lead..."
              value={prepNotes}
              onChange={(e) => setPrepNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Questions to Expect / Practice</label>
            <textarea
              className="textarea"
              rows={2}
              placeholder="e.g. Walk me through a challenging performance bottleneck you resolved in production..."
              value={questionsToExpect}
              onChange={(e) => setQuestionsToExpect(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : initialInterview ? 'Update Interview' : 'Schedule Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
