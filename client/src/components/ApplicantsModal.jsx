import React, { useState, useEffect } from 'react';
import { X, FileText, ExternalLink, Save } from 'lucide-react';
import { api } from '../api';
import { formatDate, statusBadgeClass } from '../utils';

const STATUS_OPTIONS = ['Submitted', 'Under Review', 'Interview', 'Offer', 'Rejected'];

export default function ApplicantsModal({ job, onClose, onUpdated }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notesDraft, setNotesDraft] = useState({});
  const [savingId, setSavingId] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .getAdminApplications({ jobId: job.id })
      .then((res) => {
        if (!active) return;
        setApplications(res.applications);
        const notes = {};
        res.applications.forEach((a) => {
          notes[a.id] = a.adminNotes || '';
        });
        setNotesDraft(notes);
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [job.id]);

  async function handleUpdate(appId, statusVal) {
    setSavingId(appId);
    setError('');
    try {
      const res = await api.updateApplicationStatus(appId, {
        status: statusVal,
        adminNotes: notesDraft[appId] ?? ''
      });
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, ...res.application } : a))
      );
      onUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId('');
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Applicants — {job.title}</h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {job.department} &middot; {job.location}
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading applicants...</p>
          ) : applications.length === 0 ? (
            <div className="empty-state">
              <h3>No applications received yet</h3>
              <p>Candidates who apply for this job will appear here for review.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {applications.map((appItem) => (
                <div key={appItem.id} className="card">
                  <div className="card-header">
                    <div>
                      <h4 className="card-title">{appItem.applicantName}</h4>
                      <div className="card-company">
                        {appItem.applicantEmail}
                        {appItem.phone ? ` · ${appItem.phone}` : ''}
                        {appItem.yearsExperience ? ` · ${appItem.yearsExperience} exp` : ''}
                      </div>
                    </div>
                    <span className={statusBadgeClass(appItem.status)}>{appItem.status}</span>
                  </div>

                  <div
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem',
                      fontSize: '0.86rem',
                      color: 'var(--text-body)'
                    }}
                  >
                    {appItem.coverLetter}
                  </div>

                  <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Applied {formatDate(appItem.createdAt)}</span>
                    {appItem.portfolioUrl && (
                      <a
                        href={appItem.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        Portfolio <ExternalLink size={12} />
                      </a>
                    )}
                    {appItem.resumeFile && (
                      <a
                        href={api.getResumeDownloadUrl(appItem.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <FileText size={13} />
                        Download Resume ({appItem.resumeFile.originalName})
                      </a>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '170px 1fr auto',
                      gap: '0.6rem',
                      alignItems: 'center',
                      paddingTop: '0.65rem',
                      borderTop: '1px solid var(--border-color)'
                    }}
                  >
                    <select
                      className="select"
                      value={appItem.status}
                      disabled={savingId === appItem.id}
                      onChange={(e) => handleUpdate(appItem.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>

                    <input
                      className="input"
                      type="text"
                      placeholder="Recruiter note visible to applicant..."
                      value={notesDraft[appItem.id] ?? ''}
                      onChange={(e) =>
                        setNotesDraft((prev) => ({ ...prev, [appItem.id]: e.target.value }))
                      }
                    />

                    <button
                      type="button"
                      className="btn btn-outline-accent btn-sm"
                      disabled={savingId === appItem.id}
                      onClick={() => handleUpdate(appItem.id, appItem.status)}
                    >
                      <Save size={14} />
                      Save Note
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

