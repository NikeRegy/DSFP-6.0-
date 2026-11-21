import React from 'react';
import {
  MapPin,
  Clock,
  DollarSign,
  Building2,
  CheckCircle2,
  ArrowRight,
  Share2,
  Bookmark,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { formatSalary, formatDate, statusBadgeClass } from '../utils';

export default function JobCard({
  job,
  user,
  onViewDetails,
  onApply,
  onShare,
  onSave,
  onMatch
}) {
  const alreadyApplied = Boolean(job.myApplicationId);
  const isSaved = Boolean(job.isSaved);
  const isExpired = Boolean(job.isExpired);
  const isClosingSoon = Boolean(job.isClosingSoon);
  const isAdmin = user?.role === 'admin';

  return (
    <article className="card interactive">
      <div>
        <div className="card-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
              <span className="meta-pill accent" style={{ fontSize: '0.72rem', padding: '0.12rem 0.45rem' }}>
                {job.experienceLevel || 'Mid'}
              </span>
              {isExpired && <span className="badge-expired">Expired</span>}
              {!isExpired && isClosingSoon && <span className="badge-closing-soon">Closing Soon</span>}
            </div>

            <h3 className="card-title" style={{ fontSize: '1.05rem', lineHeight: 1.3 }}>
              {job.title}
            </h3>
            <div className="card-company">
              {job.company} &middot; {job.department}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
            {alreadyApplied ? (
              <span className={statusBadgeClass(job.myApplicationStatus)}>
                <CheckCircle2 size={13} />
                {job.myApplicationStatus}
              </span>
            ) : (
              <span className={statusBadgeClass(job.status)}>{job.status}</span>
            )}
          </div>
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
          {job.deadline ? `Closes ${formatDate(job.deadline)}` : `Posted ${formatDate(job.createdAt)}`}
        </span>

        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {user?.role === 'user' && (
            <>
              <button
                type="button"
                className={`btn btn-sm ${isSaved ? 'btn-outline-accent' : 'btn-ghost'}`}
                title={isSaved ? `Saved as ${job.savedCategory}` : 'Save this vacancy'}
                onClick={() => onSave(job)}
              >
                <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
                {isSaved ? 'Saved' : 'Save'}
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                title="AI Job Fit Match"
                onClick={() => onMatch(job)}
              >
                <Sparkles size={14} color="var(--primary-600)" />
                Fit
              </button>
            </>
          )}

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            title="Copy shareable link"
            onClick={() => onShare(job)}
          >
            <Share2 size={14} />
          </button>

          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onViewDetails(job)}>
            Details
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={alreadyApplied || isExpired}
            onClick={() => onApply(job)}
          >
            {alreadyApplied ? 'Applied' : isExpired ? 'Closed' : isAdmin ? 'Apply as User' : 'Apply'}
            {!alreadyApplied && !isExpired && <ArrowRight size={14} />}
          </button>
        </div>
      </div>
    </article>
  );
}
