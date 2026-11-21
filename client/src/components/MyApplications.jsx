import React, { useState } from 'react';
import {
  FileText,
  ExternalLink,
  Trash2,
  Briefcase,
  Clock,
  Download,
  Filter,
  Eye,
  Archive,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';
import { ALL_APPLICATION_STATUSES, APPLICATION_PIPELINE, formatDate, statusBadgeClass } from '../utils';

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
        Status: Application withdrawn.
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

export default function MyApplications({
  applications,
  onInspectApplication,
  onWithdraw,
  onBrowseJobs,
  onFilterChange,
  showArchived,
  onToggleArchived
}) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = applications.filter((appItem) => {
    if (statusFilter !== 'All' && appItem.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const titleMatch = appItem.job && appItem.job.title.toLowerCase().includes(q);
      const compMatch = appItem.job && appItem.job.company.toLowerCase().includes(q);
      const noteMatch = appItem.personalNotes && appItem.personalNotes.toLowerCase().includes(q);
      if (!titleMatch && !compMatch && !noteMatch) return false;
    }
    return true;
  });

  const total = applications.length;
  const active = applications.filter((a) => !['Rejected', 'Offer', 'Withdrawn'].includes(a.status)).length;
  const interviews = applications.filter((a) => a.status === 'Interview').length;
  const offers = applications.filter((a) => a.status === 'Offer').length;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-label">Total Applications</div>
          <div className="stat-value">{total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active / In Review</div>
          <div className="stat-value">{active}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Interview Stage</div>
          <div className="stat-value">{interviews}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Offers Received</div>
          <div className="stat-value">{offers}</div>
        </div>
      </div>

      <div className="section-header">
        <div>
          <h2 className="section-title">
            {showArchived ? 'Archived Applications' : 'Tracked Job Applications'} ({filtered.length})
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Monitor your stage progress, recruiter updates, next actions, and chronological timeline.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <a
            href={api.getApplicationsExportUrl()}
            className="btn btn-secondary btn-sm"
            download="jobify_applications.csv"
          >
            <Download size={14} />
            Export CSV
          </a>

          <button
            type="button"
            className={`btn btn-sm ${showArchived ? 'btn-primary' : 'btn-secondary'}`}
            onClick={onToggleArchived}
          >
            <Archive size={14} />
            {showArchived ? 'Show Active' : 'Show Archived'}
          </button>

          <button type="button" className="btn btn-outline-accent btn-sm" onClick={onBrowseJobs}>
            <Briefcase size={14} />
            Browse Open Jobs
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: '1rem',
          background: 'var(--bg-surface)',
          padding: '0.75rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)'
        }}
      >
        <input
          className="input"
          style={{ maxWidth: '280px' }}
          type="text"
          placeholder="Filter by company, role, or note..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          className="select"
          style={{ maxWidth: '220px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Application Stages</option>
          {ALL_APPLICATION_STATUSES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Briefcase size={32} color="var(--primary-600)" />
          <h3>No applications match your filter</h3>
          <p>
            {applications.length === 0
              ? 'Explore open positions and submit your first application to track your progress.'
              : 'Try selecting a different status or clearing your search term.'}
          </p>
          <button type="button" className="btn btn-primary" onClick={onBrowseJobs}>
            Explore Job Openings
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {filtered.map((appItem) => (
            <div key={appItem.id} className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">
                    {appItem.job ? appItem.job.title : 'Position Removed'}
                  </h3>
                  <div className="card-company">
                    {appItem.job
                      ? `${appItem.job.company} · ${appItem.job.department} · ${appItem.job.location} · ${appItem.job.workMode}`
                      : 'Job details unavailable'}
                  </div>
                </div>
                <span className={statusBadgeClass(appItem.status)}>{appItem.status}</span>
              </div>

              <PipelineStepper status={appItem.status} />

              {/* Next Action & Recruiter note highlights */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '0.75rem',
                  fontSize: '0.85rem'
                }}
              >
                <div
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.85rem'
                  }}
                >
                  <strong style={{ color: 'var(--text-main)' }}>Next Action: </strong>
                  <span style={{ color: 'var(--text-body)' }}>{appItem.nextAction || 'Awaiting response'}</span>
                  {appItem.followUpDate && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-rose)', marginTop: '0.2rem' }}>
                      Follow-up target: {formatDate(appItem.followUpDate)}
                    </div>
                  )}
                </div>

                {appItem.adminNotes && (
                  <div className="alert alert-info" style={{ margin: 0, padding: '0.65rem 0.85rem' }}>
                    <strong>Recruiter Note: </strong>
                    {appItem.adminNotes}
                  </div>
                )}
              </div>

              <div className="card-footer">
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    alignItems: 'center',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)'
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={13} />
                    Applied {formatDate(appItem.createdAt)}
                  </span>

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
                      {appItem.resumeFile.originalName}
                    </a>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.45rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline-accent btn-sm"
                    onClick={() => onInspectApplication(appItem)}
                  >
                    <Eye size={13} />
                    Manage &amp; Timeline
                  </button>

                  {appItem.status !== 'Offer' && (
                    <button
                      type="button"
                      className="btn btn-danger-soft btn-sm"
                      onClick={() => onWithdraw(appItem)}
                    >
                      <Trash2 size={13} />
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
