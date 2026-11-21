import React, { useState } from 'react';
import { Bookmark, ExternalLink, Trash2, Edit3, ArrowRight, Download, Filter } from 'lucide-react';
import { api } from '../api';
import { formatDate, formatSalary, savedCategoryClass } from '../utils';

const CATEGORIES = ['All', 'Priority', 'Planning to Apply', 'Interested', 'Not Interested'];

export default function SavedJobs({
  savedJobs,
  onEditSaved,
  onRemoveSaved,
  onApplyJob,
  onViewJob,
  onBrowseJobs
}) {
  const [categoryFilter, setCategoryFilter] = useState('All');

  const filtered =
    categoryFilter === 'All'
      ? savedJobs
      : savedJobs.filter((s) => s.category === categoryFilter);

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Saved Job Opportunities ({savedJobs.length})</h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Bookmark, categorize, and strategically plan your applications before applying.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <a
            href={api.getSavedJobsExportUrl()}
            className="btn btn-secondary btn-sm"
            download="jobify_saved_jobs.csv"
          >
            <Download size={14} />
            Export CSV
          </a>
          <button type="button" className="btn btn-outline-accent btn-sm" onClick={onBrowseJobs}>
            Discover More Jobs
          </button>
        </div>
      </div>

      <div className="subnav-tabs">
        {CATEGORIES.map((cat) => {
          const count = cat === 'All' ? savedJobs.length : savedJobs.filter((s) => s.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              className={`subnav-tab ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Bookmark size={32} color="var(--primary-600)" />
          <h3>No saved jobs in this category</h3>
          <p>Browse open vacancies and click "Save" to organize your priority applications here.</p>
          <button type="button" className="btn btn-primary" onClick={onBrowseJobs}>
            Explore Open Vacancies
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {filtered.map((item) => {
            const job = item.job;
            return (
              <div key={item.id} className="card">
                <div className="card-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
                      <span className={savedCategoryClass(item.category)}>{item.category}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Saved {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <h3
                      className="card-title"
                      style={{ cursor: job ? 'pointer' : 'default' }}
                      onClick={() => job && onViewJob(job)}
                    >
                      {job ? job.title : 'Position No Longer Available'}
                    </h3>

                    <div className="card-company">
                      {job ? `${job.company} · ${job.department} · ${job.location} · ${job.workMode}` : 'Job was removed'}
                    </div>
                  </div>

                  {job && (
                    <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                      {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                    </span>
                  )}
                </div>

                {item.notes && (
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
                    <strong style={{ color: 'var(--text-main)' }}>Strategy Notes: </strong>
                    {item.notes}
                  </div>
                )}

                <div className="card-footer">
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {job?.deadline ? `Deadline: ${formatDate(job.deadline)}` : 'Rolling admissions'}
                  </span>

                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onEditSaved(item)}
                    >
                      <Edit3 size={13} />
                      Edit Notes / Category
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger-soft btn-sm"
                      onClick={() => onRemoveSaved(item)}
                    >
                      <Trash2 size={13} />
                      Remove
                    </button>

                    {job && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => onApplyJob(job)}
                      >
                        Apply Now
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
