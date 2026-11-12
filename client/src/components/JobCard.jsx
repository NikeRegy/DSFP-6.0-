import React from 'react';
import { MapPin, Clock, DollarSign, Building2, CheckCircle2, ArrowRight, Share2 } from 'lucide-react';
import { formatSalary, formatDate, statusBadgeClass } from '../utils';

export default function JobCard({ job, user, onViewDetails, onApply, onShare }) {
  const alreadyApplied = Boolean(job.myApplicationId);
  const isAdmin = user?.role === 'admin';

  return (
    <article className="card interactive">
      <div>
        <div className="card-header">
          <div>
            <h3 className="card-title">{job.title}</h3>
            <div className="card-company">
              {job.company} &middot; {job.department}
            </div>
          </div>
          {alreadyApplied ? (
            <span className={statusBadgeClass(job.myApplicationStatus)}>
              <CheckCircle2 size={13} />
              {job.myApplicationStatus}
            </span>
          ) : (
            <span className={statusBadgeClass(job.status)}>{job.status}</span>
          )}
        </div>

        <p className="card-summary">{job.summary}</p>

        <div className="meta-row">
          <span className="meta-pill accent">
            <Building2 size={13} />
            {job.workMode}
          </span>
          <span className="meta-pill">
            <Clock size={13} />
            {job.employmentType}
          </span>
          <span className="meta-pill">
            <MapPin size={13} />
            {job.location}
          </span>
          <span className="meta-pill">
            <DollarSign size={13} />
            {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
          </span>
        </div>
      </div>

      <div className="card-footer">
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {job.deadline ? `Apply by ${formatDate(job.deadline)}` : `Posted ${formatDate(job.createdAt)}`}
        </span>

        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            title="Copy shareable job link"
            onClick={() => onShare(job)}
          >
            <Share2 size={14} />
            Share
          </button>

          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onViewDetails(job)}>
            Details
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={alreadyApplied}
            onClick={() => onApply(job)}
          >
            {alreadyApplied ? 'Applied' : isAdmin ? 'Apply as User' : 'Apply'}
            {!alreadyApplied && <ArrowRight size={14} />}
          </button>
        </div>
      </div>
    </article>
  );
}
