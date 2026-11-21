import React, { useState } from 'react';
import {
  X,
  FileText,
  ExternalLink,
  Trash2,
  Archive,
  Clock,
  Plus,
  Send,
  Save,
  User,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  CheckCircle2,
  Video
} from 'lucide-react';
import { api } from '../api';
import { ALL_APPLICATION_STATUSES, APPLICATION_PIPELINE, formatDate, formatDateTime, statusBadgeClass } from '../utils';

function PipelineStepper({ status }) {
  if (status === 'Rejected') {
    return (
      <div style={{ marginTop: '0.65rem', fontSize: '0.8rem', color: '#9f1239', fontWeight: 600 }}>
        Status: Not selected for this opening.
      </div>
    );
  }
  if (status === 'Withdrawn') {
    return (
      <div style={{ marginTop: '0.65rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
        Status: Application withdrawn by candidate.
      </div>
    );
  }

  const currentIdx = APPLICATION_PIPELINE.indexOf(status);

  return (
    <div className="stepper" aria-label="Application progress">
      {APPLICATION_PIPELINE.map((step, idx) => {
        const isDone = currentIdx !== -1 && idx < currentIdx;
        const isCurrent = currentIdx !== -1 && idx === currentIdx;
        return (
          <React.Fragment key={step}>
            <div className={`step-item ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
              <span className="step-dot" />
              <span>{step}</span>
            </div>
            {idx < APPLICATION_PIPELINE.length - 1 && (
              <span className={`step-line ${isDone ? 'done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function ApplicationDetailModal({
  application,
  onClose,
  onUpdated,
  onWithdraw,
  onScheduleInterview,
  onSetReminder
}) {
  const [appData, setAppData] = useState(application);
  const [status, setStatus] = useState(application.status);
  const [statusNote, setStatusNote] = useState('');
  const [nextAction, setNextAction] = useState(application.nextAction || '');
  const [followUpDate, setFollowUpDate] = useState(application.followUpDate || '');
  const [recruiterName, setRecruiterName] = useState(application.recruiterName || '');
  const [recruiterEmail, setRecruiterEmail] = useState(application.recruiterEmail || '');
  const [recruiterPhone, setRecruiterPhone] = useState(application.recruiterPhone || '');
  const [salaryExpectations, setSalaryExpectations] = useState(application.salaryExpectations || '');
  const [personalNotes, setPersonalNotes] = useState(application.personalNotes || '');

  // Manual timeline note state
  const [manualEventType, setManualEventType] = useState('Follow-up Sent');
  const [manualDescription, setManualDescription] = useState('');
  const [manualNote, setManualNote] = useState('');

  const [saving, setSaving] = useState(false);
  const [addingEvent, setAddingEvent] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const job = appData.job;

  async function handleSaveDetails(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.updateApplication(appData.id, {
        status,
        statusNote,
        nextAction,
        followUpDate,
        recruiterName,
        recruiterEmail,
        recruiterPhone,
        salaryExpectations,
        personalNotes
      });
      setAppData({ ...appData, ...res.application });
      setStatusNote('');
      setSuccessMsg('Application details and timeline updated successfully.');
      onUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTimelineEvent(e) {
    e.preventDefault();
    if (!manualDescription.trim()) return;
    setAddingEvent(true);
    setError('');
    try {
      const res = await api.addTimelineEvent(appData.id, {
        eventType: manualEventType,
        description: manualDescription,
        notes: manualNote
      });
      setAppData((prev) => ({
        ...prev,
        timeline: [res.timelineEvent, ...(prev.timeline || [])]
      }));
      setManualDescription('');
      setManualNote('');
      setSuccessMsg('Activity logged to timeline.');
      onUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingEvent(false);
    }
  }

  async function handleToggleArchive() {
    try {
      const res = await api.toggleArchiveApplication(appData.id);
      setAppData({ ...appData, archived: res.archived });
      onUpdated();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
              <span className={statusBadgeClass(appData.status)}>{appData.status}</span>
              {appData.archived && <span className="meta-pill">Archived</span>}
            </div>
            <h2 className="modal-title">{job ? job.title : 'Position Removed'}</h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {job ? `${job.company} · ${job.department} · ${job.location}` : 'Details unavailable'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              title={appData.archived ? 'Restore to active applications' : 'Archive application'}
              onClick={handleToggleArchive}
            >
              <Archive size={14} />
              {appData.archived ? 'Unarchive' : 'Archive'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          <PipelineStepper status={appData.status} />

          {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}
          {successMsg && <div className="alert alert-info" style={{ marginTop: '1rem' }}>{successMsg}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginTop: '1.25rem' }}>
            {/* Left Column: Manage Details Form */}
            <form onSubmit={handleSaveDetails} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.98rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                Application State &amp; Contacts
              </h3>

              <div className="form-grid-2">
                <div className="field">
                  <label className="field-label">Status Stage</label>
                  <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                    {ALL_APPLICATION_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label className="field-label">Status Change Reason / Note</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g. Passed take-home assessment"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="field">
                  <label className="field-label">Next Action</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g. Prepare system design architecture"
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label className="field-label">Follow-up Target Date</label>
                  <input
                    className="input"
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="field">
                  <label className="field-label">Recruiter / Contact Name</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g. Alex Morgan"
                    value={recruiterName}
                    onChange={(e) => setRecruiterName(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label className="field-label">Recruiter Email</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="recruiter@company.com"
                    value={recruiterEmail}
                    onChange={(e) => setRecruiterEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="field">
                  <label className="field-label">Recruiter Phone</label>
                  <input
                    className="input"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={recruiterPhone}
                    onChange={(e) => setRecruiterPhone(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label className="field-label">Salary Expectations Stated</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g. $145,000 / yr"
                    value={salaryExpectations}
                    onChange={(e) => setSalaryExpectations(e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Private Candidate Strategy Notes</label>
                <textarea
                  className="textarea"
                  placeholder="Record insights from company research, hiring manager preferences, or discussion points..."
                  value={personalNotes}
                  onChange={(e) => setPersonalNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  <Save size={14} />
                  {saving ? 'Saving Changes...' : 'Save Application Updates'}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-accent btn-sm"
                  onClick={() => onScheduleInterview(appData)}
                >
                  <Video size={14} />
                  Schedule Interview
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onSetReminder(appData)}
                >
                  <Clock size={14} />
                  Set Reminder
                </button>
              </div>

              {/* Submitted Credentials Snapshot */}
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '0.85rem',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem'
                }}
              >
                <h4 style={{ margin: '0 0 0.4rem', fontSize: '0.86rem', color: 'var(--text-main)' }}>
                  Submission Snapshot
                </h4>
                <div>
                  <strong>CV / Resume: </strong>
                  {appData.resumeFile ? (
                    <a href={api.getResumeDownloadUrl(appData.id)} target="_blank" rel="noreferrer">
                      {appData.resumeFile.originalName} ({appData.cvVersionName || 'Submitted CV'})
                    </a>
                  ) : (
                    'None attached'
                  )}
                </div>
                {appData.portfolioUrl && (
                  <div style={{ marginTop: '0.2rem' }}>
                    <strong>Portfolio: </strong>
                    <a href={appData.portfolioUrl} target="_blank" rel="noreferrer">
                      {appData.portfolioUrl} <ExternalLink size={12} />
                    </a>
                  </div>
                )}
                {appData.coverLetter && (
                  <div style={{ marginTop: '0.4rem', color: 'var(--text-body)' }}>
                    <strong>Cover Pitch: </strong>
                    {appData.coverLetter}
                  </div>
                )}
              </div>
            </form>

            {/* Right Column: Activity Timeline Stream & Add Event */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.98rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                Activity Timeline &amp; History
              </h3>

              {/* Add Manual Event Form */}
              <form
                onSubmit={handleAddTimelineEvent}
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Record New Activity Entry
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.4rem' }}>
                  <select
                    className="select"
                    style={{ fontSize: '0.82rem', padding: '0.4rem 0.5rem' }}
                    value={manualEventType}
                    onChange={(e) => setManualEventType(e.target.value)}
                  >
                    <option value="Follow-up Sent">Follow-up Sent</option>
                    <option value="Interview Completed">Interview Completed</option>
                    <option value="Assessment Submitted">Assessment Submitted</option>
                    <option value="Recruiter Contact">Recruiter Contact</option>
                    <option value="Candidate Note">Candidate Note</option>
                  </select>

                  <input
                    className="input"
                    style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
                    type="text"
                    required
                    placeholder="Event description..."
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                  />
                </div>

                <input
                  className="input"
                  style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
                  type="text"
                  placeholder="Optional details or key takeaway..."
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                />

                <button
                  type="submit"
                  className="btn btn-outline-accent btn-sm"
                  style={{ alignSelf: 'flex-end' }}
                  disabled={addingEvent}
                >
                  <Plus size={13} />
                  {addingEvent ? 'Adding...' : 'Log Event'}
                </button>
              </form>

              {/* Timeline Entries */}
              <div className="timeline-stream" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                {appData.timeline?.length > 0 ? (
                  appData.timeline.map((event) => (
                    <div
                      key={event.id}
                      className={`timeline-entry ${event.source === 'recruiter' ? 'recruiter' : ''}`}
                    >
                      <div className="timeline-meta">
                        <span>{formatDateTime(event.createdAt)}</span>
                        <span>&middot;</span>
                        <span style={{ fontWeight: 600, color: event.source === 'recruiter' ? 'var(--text-rose)' : 'var(--text-primary-strong)' }}>
                          {event.source === 'recruiter' ? 'Recruiter Update' : 'Applicant Log'}
                        </span>
                      </div>
                      <div className="timeline-text">{event.description}</div>
                      {event.notes && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-body)', marginTop: '0.15rem' }}>
                          {event.notes}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    No timeline events recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          {appData.status !== 'Offer' ? (
            <button
              type="button"
              className="btn btn-danger-soft btn-sm"
              onClick={() => onWithdraw(appData)}
            >
              <Trash2 size={14} />
              Withdraw Application
            </button>
          ) : <span />}

          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
