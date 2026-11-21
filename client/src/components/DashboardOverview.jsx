import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Video,
  Bookmark,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  FileText,
  UserCheck
} from 'lucide-react';
import { formatDate, formatSalary, savedCategoryClass, statusBadgeClass } from '../utils';

export default function DashboardOverview({
  overview,
  range,
  onRangeChange,
  onSelectTab,
  onViewJob,
  onInspectApplication
}) {
  const metrics = overview?.metrics || {
    total: 0,
    inProgress: 0,
    interviewsCount: 0,
    offersCount: 0,
    rejectedCount: 0,
    withdrawnCount: 0
  };

  const upcomingInterviews = overview?.upcomingInterviews || [];
  const pendingReminders = overview?.pendingReminders || [];
  const recentlySaved = overview?.recentlySaved || [];
  const approachingDeadlines = overview?.approachingDeadlines || [];
  const recentRecruiterUpdates = overview?.recentRecruiterUpdates || [];
  const recentApplications = overview?.recentApplications || [];

  return (
    <div>
      {/* Metric Filter Bar */}
      <div className="section-header">
        <div>
          <h2 className="section-title">Job Search Intelligence Dashboard</h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Real-time pipeline overview calculated from your live application records.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Time Window:
          </span>
          <select className="select" style={{ width: 'auto', minWidth: '130px' }} value={range} onChange={(e) => onRangeChange(e.target.value)}>
            <option value="all">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* 6 Key Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-label">Total Applications</div>
          <div className="stat-value">{metrics.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Progress</div>
          <div className="stat-value">{metrics.inProgress}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Interviews Scheduled</div>
          <div className="stat-value">{metrics.interviewsCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Offers Received</div>
          <div className="stat-value" style={{ color: '#166534' }}>{metrics.offersCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Not Selected</div>
          <div className="stat-value" style={{ color: 'var(--text-rose)' }}>{metrics.rejectedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Withdrawn</div>
          <div className="stat-value" style={{ color: 'var(--text-muted)' }}>{metrics.withdrawnCount}</div>
        </div>
      </div>

      {/* Grid of Actionable Widgets */}
      <div className="dashboard-grid-2">
        {/* Upcoming Interviews Widget */}
        <div className="widget-card">
          <div className="widget-header">
            <h3 className="widget-title">
              <Video size={17} color="var(--primary-600)" />
              Upcoming Interviews ({upcomingInterviews.length})
            </h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onSelectTab('interviews')}>
              View All
            </button>
          </div>

          <div className="widget-list">
            {upcomingInterviews.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No pending interviews scheduled. When an application advances, schedule it here.
              </p>
            ) : (
              upcomingInterviews.map((intItem) => (
                <div key={intItem.id} className="widget-item">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      {intItem.position} &middot; {intItem.company}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {intItem.stage} &middot; {intItem.format} &middot; {formatDate(intItem.date)} at {intItem.time}
                    </div>
                  </div>
                  {intItem.location?.startsWith('http') && (
                    <a href={intItem.location} target="_blank" rel="noreferrer" className="btn btn-outline-accent btn-sm">
                      Join Link
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Follow-ups & Reminders Widget */}
        <div className="widget-card">
          <div className="widget-header">
            <h3 className="widget-title">
              <Clock size={17} color="var(--primary-600)" />
              Actionable Follow-ups ({pendingReminders.length})
            </h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onSelectTab('reminders')}>
              Manage
            </button>
          </div>

          <div className="widget-list">
            {pendingReminders.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                All clear! No urgent reminders due.
              </p>
            ) : (
              pendingReminders.map((rem) => (
                <div key={rem.id} className="widget-item">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      {rem.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-rose)' }}>
                      Due {formatDate(rem.reminderDate)} ({rem.type})
                    </div>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => onSelectTab('reminders')}>
                    View
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Approaching Application Deadlines Widget */}
        <div className="widget-card">
          <div className="widget-header">
            <h3 className="widget-title">
              <CalendarDays size={17} color="var(--text-rose)" />
              Approaching Deadlines (Next 7 Days)
            </h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onSelectTab('jobs')}>
              All Jobs
            </button>
          </div>

          <div className="widget-list">
            {approachingDeadlines.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No active openings closing within the next week.
              </p>
            ) : (
              approachingDeadlines.map((job) => (
                <div key={job.id} className="widget-item">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      {job.title} &middot; {job.company}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-rose)', fontWeight: 600 }}>
                      Closes {formatDate(job.deadline)}
                    </div>
                  </div>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => onViewJob(job)}>
                    Apply
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recently Saved Vacancies Widget */}
        <div className="widget-card">
          <div className="widget-header">
            <h3 className="widget-title">
              <Bookmark size={17} color="var(--primary-600)" />
              Recently Saved Opportunities
            </h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onSelectTab('saved-jobs')}>
              Saved Hub
            </button>
          </div>

          <div className="widget-list">
            {recentlySaved.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No bookmarked vacancies. Click "Save" on open jobs to review them here.
              </p>
            ) : (
              recentlySaved.map((item) => (
                <div key={item.id} className="widget-item">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      {item.job ? item.job.title : 'Position'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                      <span className={savedCategoryClass(item.category)}>{item.category}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {item.job?.company}
                      </span>
                    </div>
                  </div>
                  {item.job && (
                    <button type="button" className="btn btn-outline-accent btn-sm" onClick={() => onViewJob(item.job)}>
                      View
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Recruiter Updates Stream */}
      {recentRecruiterUpdates.length > 0 && (
        <div className="widget-card" style={{ marginBottom: '1.5rem' }}>
          <div className="widget-header">
            <h3 className="widget-title">
              <AlertCircle size={17} color="var(--text-rose)" />
              Verified Recruiter Updates
            </h3>
          </div>
          <div className="widget-list">
            {recentRecruiterUpdates.map((update, idx) => (
              <div key={idx} className="widget-item" style={{ borderLeft: '3px solid var(--rose-700)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                    {update.jobTitle} &middot; {update.company}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-body)', marginTop: '0.15rem' }}>
                    {update.description}
                  </div>
                  {update.notes && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Note: {update.notes}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  {formatDate(update.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
