import React, { useState, useMemo } from 'react';
import {
  Bell,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  Trash2,
  Edit3,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';
import { formatDateTime, formatDate, timeAgo } from '../utils';

const TYPES = ['All', 'Follow-up', 'Interview Prep', 'Interview Date', 'Assessment Deadline', 'Closing Date', 'Other'];

export default function RemindersView({
  reminders = [],
  applications = [],
  onNewReminder,
  onToggleComplete,
  onReschedule,
  onDeleteReminder,
  onViewApplication
}) {
  const [statusFilter, setStatusFilter] = useState('pending'); // 'all' | 'pending' | 'completed'
  const [typeFilter, setTypeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const now = new Date();

  const filtered = useMemo(() => {
    return reminders.filter((rem) => {
      if (statusFilter === 'pending' && rem.completed) return false;
      if (statusFilter === 'completed' && !rem.completed) return false;
      if (typeFilter !== 'All' && rem.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNote = rem.notes?.toLowerCase().includes(q);
        const matchesApp = rem.application && (
          rem.application.jobTitle?.toLowerCase().includes(q) ||
          rem.application.company?.toLowerCase().includes(q)
        );
        if (!matchesNote && !matchesApp) return false;
      }
      return true;
    });
  }, [reminders, statusFilter, typeFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = reminders.length;
    const pending = reminders.filter((r) => !r.completed);
    const overdue = pending.filter((r) => new Date(r.reminderDate) < now).length;
    const completed = reminders.filter((r) => r.completed).length;
    return { total, pending: pending.length, overdue, completed };
  }, [reminders, now]);

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Follow-up &amp; Deadline Reminders ({stats.pending})</h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Schedule and track follow-ups, interview preps, and submission deadlines.
          </p>
        </div>

        <button type="button" className="btn btn-primary" onClick={onNewReminder}>
          <Plus size={16} />
          Set New Reminder
        </button>
      </div>

      {/* Quick Stat Highlights */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-card accent">
          <div className="stat-label">Pending Reminders</div>
          <div className="stat-value">{stats.pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Overdue / Action Needed</div>
          <div className="stat-value" style={{ color: stats.overdue > 0 ? 'var(--text-rose)' : 'inherit' }}>
            {stats.overdue}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed Tasks</div>
          <div className="stat-value" style={{ color: '#166534' }}>
            {stats.completed}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar" style={{ marginBottom: '1rem' }}>
        <div className="input-wrap" style={{ flex: 1 }}>
          <Search size={16} className="input-icon" />
          <input
            type="text"
            className="input with-icon"
            placeholder="Search reminders by note, company, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="subnav-tabs" style={{ margin: 0 }}>
          <button
            type="button"
            className={`subnav-tab ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Pending ({stats.pending})
          </button>
          <button
            type="button"
            className={`subnav-tab ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({stats.total})
          </button>
          <button
            type="button"
            className={`subnav-tab ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('completed')}
          >
            Completed ({stats.completed})
          </button>
        </div>

        <select
          className="select"
          style={{ width: 'auto', minWidth: '150px' }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t === 'All' ? 'All Types' : t}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Bell size={34} color="var(--primary-600)" />
          <h3>No reminders found</h3>
          <p>
            {searchQuery || typeFilter !== 'All'
              ? 'Try adjusting your filters to see more reminders.'
              : 'Set a reminder for following up with a recruiter or preparing for an interview.'}
          </p>
          <button type="button" className="btn btn-primary" onClick={onNewReminder}>
            Create Reminder
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filtered.map((rem) => {
            const isOverdue = !rem.completed && new Date(rem.reminderDate) < now;
            const app = rem.application;

            return (
              <div
                key={rem.id}
                className="card"
                style={{
                  borderLeft: isOverdue
                    ? '4px solid var(--text-rose)'
                    : rem.completed
                    ? '4px solid #166534'
                    : '4px solid var(--primary-600)',
                  opacity: rem.completed ? 0.75 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: 1, minWidth: '260px' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '0.2rem', marginTop: '0.15rem' }}
                      title={rem.completed ? 'Mark incomplete' : 'Mark as done'}
                      onClick={() => onToggleComplete(rem)}
                    >
                      <CheckCircle2
                        size={22}
                        color={rem.completed ? '#166534' : 'var(--border-strong)'}
                        fill={rem.completed ? '#dcfce7' : 'none'}
                      />
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                        <span className="badge badge-accent" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {rem.type}
                        </span>

                        <span
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            color: isOverdue ? 'var(--text-rose)' : 'var(--text-main)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <Clock size={13} />
                          {formatDateTime(rem.reminderDate)}
                          {isOverdue && ' (Overdue)'}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: '0.94rem',
                          color: 'var(--text-main)',
                          fontWeight: 500,
                          textDecoration: rem.completed ? 'line-through' : 'none'
                        }}
                      >
                        {rem.notes}
                      </div>

                      {app && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>Linked Application:</span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: 0, textDecoration: 'underline', color: 'var(--primary-600)', fontSize: '0.8rem' }}
                            onClick={() => onViewApplication(app.id)}
                          >
                            {app.jobTitle} at {app.company}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onReschedule(rem)}
                      title="Reschedule reminder"
                    >
                      <Edit3 size={13} />
                      Reschedule
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger-soft btn-sm"
                      onClick={() => onDeleteReminder(rem.id)}
                      title="Delete reminder"
                    >
                      <Trash2 size={13} />
                    </button>
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
