import React from 'react';
import { FileText, ExternalLink, Trash2, Briefcase, Clock } from 'lucide-react';
import { api } from '../api';
import { APPLICATION_PIPELINE, formatDate, statusBadgeClass } from '../utils';

function PipelineStepper({ status }) {
  if (status === 'Rejected') {
    return (
      <div style={{ marginTop: '0.65rem', fontSize: '0.8rem', color: '#991b1b', fontWeight: 500 }}>
        Application status: Not selected for this opening.
      </div>
    );
  }

  const currentIdx = APPLICATION_PIPELINE.indexOf(status);

  return (
    <div className="stepper" aria-label="Application progress">
      {APPLICATION_PIPELINE.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <React.Fragment key={step}>
            <div className={`step-item ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
              <span className="step-dot" />
              <span>{step}</span>
            </div>
            {idx < APPLICATION_PIPELINE.length - 1 && (
              <span className={`step-line ${idx < currentIdx ? 'done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function MyApplications({ applications, onWithdraw, onBrowseJobs }) {
  const total = applications.length;
  const active = applications.filter((a) => !['Rejected', 'Offer'].includes(a.status)).length;
  const interviews = applications.filter((a) => a.status === 'Interview').length;
  const offers = applications.filter((a) => a.status === 'Offer').length;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-label">Total Applied</div>
          <div className="stat-value">{total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Progress</div>
          <div className="stat-value">{active}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Interviews</div>
          <div className="stat-value">{interviews}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Offers</div>
          <div className="stat-value">{offers}</div>
        </div>
      </div>

      <div className="section-header">
        <h2 className="section-title">My Job Applications</h2>
        <button type="button" className="btn btn-outline-accent btn-sm" onClick={onBrowseJobs}>
          <Briefcase size={15} />
          Browse More Jobs
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="empty-state">
          <Briefcase size={32} color="var(--primary-600)" />
          <h3>No applications yet</h3>
          <p>Explore open positions and submit your first application to track your progress here.</p>
          <button type="button" className="btn btn-primary" onClick={onBrowseJobs}>
            Explore Job Openings
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {applications.map((appItem) => (
            <div key={appItem.id} className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">{appItem.job ? appItem.job.title : 'Position Removed'}</h3>
                  <div className="card-company">
                    {appItem.job
                      ? `${appItem.job.company} · ${appItem.job.department} · ${appItem.job.location}`
                      : 'Job details unavailable'}
                  </div>
                </div>
                <span className={statusBadgeClass(appItem.status)}>{appItem.status}</span>
              </div>

              <PipelineStepper status={appItem.status} />

              <div
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 0.9rem',
                  fontSize: '0.86rem',
                  color: 'var(--text-body)'
                }}
              >
                <strong style={{ color: 'var(--text-main)' }}>Your Cover Note: </strong>
                {appItem.coverLetter}
              </div>

              {appItem.adminNotes && (
                <div className="alert alert-info" style={{ marginBottom: 0 }}>
                  <strong>Recruiter Update: </strong>
                  {appItem.adminNotes}
                </div>
              )}

              <div className="card-footer">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
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

                {appItem.status !== 'Offer' && (
                  <button
                    type="button"
                    className="btn btn-danger-soft btn-sm"
                    onClick={() => onWithdraw(appItem)}
                  >
                    <Trash2 size={14} />
                    Withdraw
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

