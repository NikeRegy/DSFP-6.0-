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
  Link2
} from 'lucide-react';
import { formatSalary, formatDate, statusBadgeClass, getJobShareUrl } from '../utils';

export default function JobDetailModal({ job, user, onClose, onApply, onShare }) {
  const [copied, setCopied] = useState(false);

  if (!job) return null;
  const alreadyApplied = Boolean(job.myApplicationId);
  const isAdmin = user?.role === 'admin';
  const shareUrl = getJobShareUrl(job.id);

  async function handleCopy() {
    await onShare(job);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{job.title}</h2>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              {job.company} &middot; {job.department}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button type="button" className="btn btn-outline-accent btn-sm" onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Share2 size={14} />}
              {copied ? 'Link Copied' : 'Share Job'}
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
              marginBottom: '1rem',
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

          <h4 style={{ margin: '0 0 0.4rem', color: 'var(--text-main)' }}>About the Role</h4>
          <p style={{ margin: '0 0 1rem', color: 'var(--text-body)', fontSize: '0.92rem' }}>
            {job.summary}
          </p>

          {job.responsibilities && job.responsibilities.length > 0 && (
            <>
              <h4 style={{ margin: '0 0 0.35rem', color: 'var(--text-main)' }}>Responsibilities</h4>
              <ul className="detail-list">
                {job.responsibilities.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </>
          )}

          {job.requirements && job.requirements.length > 0 && (
            <>
              <h4 style={{ margin: '0 0 0.35rem', color: 'var(--text-main)' }}>Requirements</h4>
              <ul className="detail-list">
                {job.requirements.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>

          {job.status === 'Open' && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={alreadyApplied}
              onClick={() => onApply(job)}
            >
              {alreadyApplied ? (
                <>
                  <CheckCircle2 size={16} />
                  Applied ({job.myApplicationStatus})
                </>
              ) : isAdmin ? (
                'Switch to Applicant & Apply'
              ) : (
                'Apply for this Job'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
