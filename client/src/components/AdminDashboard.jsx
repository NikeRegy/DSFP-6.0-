import React, { useState } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Users,
  Eye,
  EyeOff,
  FileText,
  ExternalLink,
  Save,
  Share2,
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { api } from '../api';
import { formatDate, formatSalary, statusBadgeClass, ALL_APPLICATION_STATUSES } from '../utils';

export default function AdminDashboard({
  jobs = [],
  stats,
  allApplications = [],
  reports = [],
  onOpenPostJob,
  onEditJob,
  onToggleJobStatus,
  onDeleteJob,
  onInspectApplicants,
  onUpdateApplication,
  onUpdateReport,
  onShareJob
}) {
  const [subTab, setSubTab] = useState('jobs'); // 'jobs' | 'applicants' | 'reports'
  const [appStatusFilter, setAppStatusFilter] = useState('All');
  const [reportStatusFilter, setReportStatusFilter] = useState('All');
  const [notesDraft, setNotesDraft] = useState({});
  const [savingAppId, setSavingAppId] = useState('');

  const filteredApps =
    appStatusFilter === 'All'
      ? allApplications
      : allApplications.filter((a) => a.status === appStatusFilter);

  const filteredReports =
    reportStatusFilter === 'All'
      ? reports
      : reports.filter((r) => r.status === reportStatusFilter);

  async function saveAppChange(appItem, nextStatus) {
    setSavingAppId(appItem.id);
    try {
      const note = notesDraft[appItem.id] !== undefined ? notesDraft[appItem.id] : appItem.adminNotes || '';
      await onUpdateApplication(appItem.id, { status: nextStatus, adminNotes: note });
    } finally {
      setSavingAppId('');
    }
  }

  const pendingReportsCount = reports.filter((r) => r.status === 'Pending').length;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-label">Open Job Postings</div>
          <div className="stat-value">{stats?.openJobs ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Closed / Draft</div>
          <div className="stat-value">{stats?.closedOrDraftJobs ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Applications</div>
          <div className="stat-value">{stats?.totalApplications ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Reported Vacancies</div>
          <div className="stat-value" style={{ color: pendingReportsCount > 0 ? 'var(--text-rose)' : 'inherit' }}>
            {pendingReportsCount} Pending
          </div>
        </div>
      </div>

      <div className="section-header">
        <div className="nav-tabs">
          <button
            type="button"
            className={`nav-tab ${subTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setSubTab('jobs')}
          >
            Posted Jobs ({jobs.length})
          </button>
          <button
            type="button"
            className={`nav-tab ${subTab === 'applicants' ? 'active' : ''}`}
            onClick={() => setSubTab('applicants')}
          >
            All Applications ({allApplications.length})
          </button>
          <button
            type="button"
            className={`nav-tab ${subTab === 'reports' ? 'active' : ''}`}
            onClick={() => setSubTab('reports')}
          >
            Reported Vacancies {pendingReportsCount > 0 ? `(${pendingReportsCount})` : ''}
          </button>
        </div>

        <button type="button" className="btn btn-primary" onClick={onOpenPostJob}>
          <Plus size={16} />
          Post New Job Opening
        </button>
      </div>

      {/* SUBTAB 1: Posted Jobs */}
      {subTab === 'jobs' && (
        jobs.length === 0 ? (
          <div className="empty-state">
            <h3>No job openings posted yet</h3>
            <p>Create your first job opening so applicants can discover and apply.</p>
            <button type="button" className="btn btn-primary" onClick={onOpenPostJob}>
              Post First Job
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Role &amp; Department</th>
                  <th>Location &amp; Mode</th>
                  <th>Compensation</th>
                  <th>Status</th>
                  <th>Applicants</th>
                  <th>Deadline</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{job.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {job.company} &middot; {job.department}
                      </div>
                    </td>
                    <td>
                      <div>{job.location}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {job.workMode} &middot; {job.employmentType}
                      </div>
                    </td>
                    <td>{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</td>
                    <td>
                      <span className={statusBadgeClass(job.status)}>{job.status}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline-accent btn-sm"
                        onClick={() => onInspectApplicants(job)}
                      >
                        <Users size={14} />
                        {job.applicantCount || 0}
                      </button>
                    </td>
                    <td>{job.deadline ? formatDate(job.deadline) : 'Open'}</td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="btn btn-outline-accent btn-sm"
                          title="Copy shareable job link"
                          onClick={() => onShareJob(job)}
                        >
                          <Share2 size={14} />
                          Share
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          title={job.status === 'Open' ? 'Close job' : 'Reopen job'}
                          onClick={() => onToggleJobStatus(job)}
                        >
                          {job.status === 'Open' ? <EyeOff size={14} /> : <Eye size={14} />}
                          {job.status === 'Open' ? 'Close' : 'Open'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => onEditJob(job)}
                        >
                          <Edit3 size={14} />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-soft btn-sm"
                          onClick={() => onDeleteJob(job)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* SUBTAB 2: All Applications */}
      {subTab === 'applicants' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.85rem' }}>
            <select
              className="select"
              style={{ maxWidth: 220 }}
              value={appStatusFilter}
              onChange={(e) => setAppStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses ({allApplications.length})</option>
              {ALL_APPLICATION_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {filteredApps.length === 0 ? (
            <div className="empty-state">
              <h3>No matching applications</h3>
              <p>Try clearing the status filter or check back once candidates apply.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredApps.map((appItem) => (
                <div key={appItem.id} className="card">
                  <div className="card-header">
                    <div>
                      <h4 className="card-title">
                        {appItem.applicantName}{' '}
                        <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                          applied for
                        </span>{' '}
                        {appItem.jobTitle}
                      </h4>
                      <div className="card-company">
                        {appItem.applicantEmail}
                        {appItem.phone ? ` · ${appItem.phone}` : ''}
                        {appItem.yearsExperience ? ` · ${appItem.yearsExperience} exp` : ''}
                        {` · Applied ${formatDate(appItem.createdAt)}`}
                      </div>
                    </div>
                    <span className={statusBadgeClass(appItem.status)}>{appItem.status}</span>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.87rem', color: 'var(--text-body)' }}>
                    {appItem.coverLetter}
                  </p>

                  <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
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

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '190px 1fr auto',
                      gap: '0.6rem',
                      alignItems: 'center',
                      paddingTop: '0.65rem',
                      borderTop: '1px solid var(--border-color)'
                    }}
                  >
                    <select
                      className="select"
                      value={appItem.status}
                      disabled={savingAppId === appItem.id}
                      onChange={(e) => saveAppChange(appItem, e.target.value)}
                    >
                      {ALL_APPLICATION_STATUSES.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>

                    <input
                      className="input"
                      type="text"
                      placeholder="Recruiter update / feedback for candidate..."
                      value={
                        notesDraft[appItem.id] !== undefined
                          ? notesDraft[appItem.id]
                          : appItem.adminNotes || ''
                      }
                      onChange={(e) =>
                        setNotesDraft((prev) => ({ ...prev, [appItem.id]: e.target.value }))
                      }
                    />

                    <button
                      type="button"
                      className="btn btn-outline-accent btn-sm"
                      disabled={savingAppId === appItem.id}
                      onClick={() => saveAppChange(appItem, appItem.status)}
                    >
                      <Save size={14} />
                      Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: Reported Vacancies */}
      {subTab === 'reports' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.85rem' }}>
            <select
              className="select"
              style={{ maxWidth: 220 }}
              value={reportStatusFilter}
              onChange={(e) => setReportStatusFilter(e.target.value)}
            >
              <option value="All">All Reports ({reports.length})</option>
              <option value="Pending">Pending</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Resolved">Resolved</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>

          {filteredReports.length === 0 ? (
            <div className="empty-state">
              <ShieldAlert size={36} color="var(--primary-600)" />
              <h3>No reported vacancies</h3>
              <p>Job reports submitted by users for suspicious or misleading postings will appear here for review.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredReports.map((report) => (
                <div key={report.id} className="card">
                  <div className="card-header">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                        <span className="badge badge-danger">Reason: {report.reason}</span>
                        <span className="badge badge-subtle">{report.status}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Reported on {formatDate(report.createdAt)}
                        </span>
                      </div>
                      <h4 className="card-title">
                        Listing: {report.jobTitle} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>at</span> {report.company}
                      </h4>
                      <div className="card-company">
                        Reporter: {report.reporterEmail}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <select
                        className="select select-sm"
                        value={report.status}
                        onChange={(e) => onUpdateReport(report.id, { status: e.target.value })}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Reviewed">Reviewed</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Dismissed">Dismissed</option>
                      </select>
                    </div>
                  </div>

                  {report.details && (
                    <div style={{ background: 'var(--bg-subtle)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.86rem' }}>
                      <strong style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                        Report Details:
                      </strong>
                      <p style={{ margin: 0, color: 'var(--text-body)' }}>{report.details}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
