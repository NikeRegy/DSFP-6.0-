import React, { useState } from 'react';
import {
  X,
  MapPin,
  Building2,
  Clock,
  DollarSign,
  Calendar,
  Users,
  CheckCircle2,
  Share2,
  Check,
  Link2,
  Bookmark,
  Sparkles,
  AlertTriangle,
  Gift,
  CheckSquare
} from 'lucide-react';
import { formatSalary, formatDate, statusBadgeClass, getJobShareUrl } from '../utils';

export default function JobDetailModal({
  job,
  user,
  onClose,
  onApply,
  onShare,
  onSave,
  onMatch,
  onReport
}) {
  const [copied, setCopied] = useState(false);

  if (!job) return null;
  const alreadyApplied = Boolean(job.myApplicationId);
  const isSaved = Boolean(job.isSaved);
  const isExpired = Boolean(job.isExpired);
  const isClosingSoon = Boolean(job.isClosingSoon);
  const isAdmin = user?.role === 'admin';
  const shareUrl = getJobShareUrl(job.id);

  async function handleCopy() {
    await onShare(job);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
              <span className="meta-pill accent" style={{ fontSize: '0.72rem' }}>
                {job.experienceLevel || 'Mid'}
              </span>
              {isExpired && <span className="badge-expired">Vacancy Expired</span>}
              {!isExpired && isClosingSoon && <span className="badge-closing-soon">Closing Soon</span>}
            </div>
            <h2 className="modal-title">{job.title}</h2>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              {job.company} &middot; {job.department} &middot; {job.location}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {user?.role === 'user' && (
              <>
                <button
                  type="button"
                  className={`btn btn-sm ${isSaved ? 'btn-outline-accent' : 'btn-secondary'}`}
                  onClick={() => onSave(job)}
                >
                  <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
                  {isSaved ? `Saved (${job.savedCategory})` : 'Save Job'}
                </button>

                <button type="button" className="btn btn-outline-accent btn-sm" onClick={() => onMatch(job)}>
                  <Sparkles size={14} />
                  Match Score
                </button>
              </>
            )}

            <button type="button" className="btn btn-outline-accent btn-sm" onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Share2 size={14} />}
              {copied ? 'Link Copied' : 'Share'}
            </button>

            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          <div className="meta-row" style={{ marginTop: 0, marginBottom: '1rem' }}>
            <span className={statusBadgeClass(job.status)}>{job.status}</span>
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
            {job.deadline && (
              <span className="meta-pill">
                <Calendar size={13} />
                Deadline: {formatDate(job.deadline)}
              </span>
            )}
            <span className="meta-pill">
              <Users size={13} />
              {job.applicantCount || 0} applicants
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.6rem',
              background: 'var(--bg-rose-tint)',
              border: '1px solid var(--border-rose)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.55rem 0.8rem',
              marginBottom: '1.25rem',
              fontSize: '0.8rem'
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--text-rose)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              <Link2 size={14} />
              {shareUrl}
            </span>
            <button type="button" className="btn btn-outline-accent btn-sm" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          <h4 style={{ margin: '0 0 0.4rem', color: 'var(--text-main)' }}>About the Position</h4>
          <p style={{ margin: '0 0 1.25rem', color: 'var(--text-body)', fontSize: '0.92rem', lineHeight: 1.6 }}>
            {job.summary}
          </p>

          {job.responsibilities?.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.4rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckSquare size={16} color="var(--primary-600)" />
                Key Responsibilities
              </h4>
              <ul className="detail-list">
                {job.responsibilities.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {job.requirements?.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.4rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckSquare size={16} color="var(--primary-600)" />
                Core Requirements
              </h4>
              <ul className="detail-list">
                {job.requirements.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {job.qualifications?.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.4rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckSquare size={16} color="var(--primary-600)" />
                Preferred Qualifications
              </h4>
              <ul className="detail-list">
                {job.qualifications.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {job.benefits?.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.4rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Gift size={16} color="var(--text-rose)" />
                Compensation &amp; Benefits
              </h4>
              <ul className="detail-list">
                {job.benefits.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {job.applicationInstructions && (
            <div
              style={{
                background: 'var(--bg-primary-tint)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem',
                fontSize: '0.86rem',
                color: 'var(--text-primary-strong)'
              }}
            >
              <strong>Application Instructions: </strong>
              {job.applicationInstructions}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div>
            {user?.role === 'user' && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--text-rose)' }}
                onClick={() => onReport(job)}
              >
                <AlertTriangle size={14} />
                Report listing
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>

            {job.status === 'Open' && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={alreadyApplied || isExpired}
                onClick={() => onApply(job)}
              >
                {alreadyApplied ? (
                  <>
                    <CheckCircle2 size={16} />
                    Applied ({job.myApplicationStatus})
                  </>
                ) : isExpired ? (
                  'Applications Closed'
                ) : isAdmin ? (
                  'Switch to Applicant & Apply'
                ) : (
                  'Apply for this Opportunity'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
