import React, { useState, useMemo } from 'react';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  ExternalLink,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Search,
  Filter
} from 'lucide-react';
import { formatDateTime, formatDate } from '../utils';

const OUTCOMES = ['All', 'Scheduled', 'Completed', 'Passed', 'Failed', 'Rescheduled', 'Cancelled'];
const STAGES = ['All', 'HR screening', 'Technical interview', 'Assessment', 'Final interview', 'Culture fit', 'Other'];

export default function InterviewsView({
  interviews = [],
  applications = [],
  onNewInterview,
  onEditInterview,
  onUpdateInterview,
  onDeleteInterview,
  onViewApplication
}) {
  const [outcomeFilter, setOutcomeFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNotesId, setExpandedNotesId] = useState(null);

  const now = new Date();

  const filtered = useMemo(() => {
    return interviews.filter((item) => {
      if (outcomeFilter !== 'All' && item.status !== outcomeFilter) return false;
      if (stageFilter !== 'All' && item.stage !== stageFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesComp = item.company?.toLowerCase().includes(q);
        const matchesPos = item.position?.toLowerCase().includes(q);
        const matchesName = item.interviewerName?.toLowerCase().includes(q);
        if (!matchesComp && !matchesPos && !matchesName) return false;
      }
      return true;
    });
  }, [interviews, outcomeFilter, stageFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = interviews.length;
    const upcoming = interviews.filter((i) => i.status === 'Scheduled' && new Date(i.interviewDate) >= now).length;
    const passed = interviews.filter((i) => i.status === 'Passed').length;
    return { total, upcoming, passed };
  }, [interviews, now]);

  function getOutcomeBadge(status) {
    switch (status) {
      case 'Passed':
        return <span className="badge badge-success">Passed</span>;
      case 'Failed':
        return <span className="badge badge-danger">Not Selected</span>;
      case 'Scheduled':
        return <span className="badge badge-accent">Scheduled</span>;
      case 'Completed':
        return <span className="badge badge-subtle">Completed</span>;
      case 'Rescheduled':
        return <span className="badge badge-subtle" style={{ color: 'var(--primary-600)' }}>Rescheduled</span>;
      case 'Cancelled':
        return <span className="badge badge-subtle" style={{ opacity: 0.6 }}>Cancelled</span>;
      default:
        return <span className="badge badge-subtle">{status}</span>;
    }
  }

  async function handleQuickOutcomeChange(interview, newStatus) {
    await onUpdateInterview(interview.id, { status: newStatus });
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Interview Hub ({interviews.length})</h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Track interview appointments, preparation strategy, interviewer contacts, and outcomes.
          </p>
        </div>

        <button type="button" className="btn btn-primary" onClick={onNewInterview}>
          <Plus size={16} />
          Record Interview
        </button>
      </div>

      {/* Metric Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-card accent">
          <div className="stat-label">Upcoming Interviews</div>
          <div className="stat-value">{stats.upcoming}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Passed / Advanced</div>
          <div className="stat-value" style={{ color: '#166534' }}>
            {stats.passed}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Conducted</div>
          <div className="stat-value">{stats.total}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar" style={{ marginBottom: '1rem' }}>
        <div className="input-wrap" style={{ flex: 1 }}>
          <Search size={16} className="input-icon" />
          <input
            type="text"
            className="input with-icon"
            placeholder="Search by company, position, or interviewer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="select"
          style={{ width: 'auto', minWidth: '150px' }}
          value={outcomeFilter}
          onChange={(e) => setOutcomeFilter(e.target.value)}
        >
          {OUTCOMES.map((o) => (
            <option key={o} value={o}>
              {o === 'All' ? 'All Outcomes' : o}
            </option>
          ))}
        </select>

        <select
          className="select"
          style={{ width: 'auto', minWidth: '160px' }}
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s === 'All' ? 'All Stages' : s}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Video size={36} color="var(--primary-600)" />
          <h3>No interviews found</h3>
          <p>
            {searchQuery || outcomeFilter !== 'All' || stageFilter !== 'All'
              ? 'Try clearing your filters or search terms.'
              : 'When you are invited for an interview, log it here to prepare questions, store meeting links, and record notes.'}
          </p>
          <button type="button" className="btn btn-primary" onClick={onNewInterview}>
            Record First Interview
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((item) => {
            const isUpcoming = item.status === 'Scheduled' && new Date(item.interviewDate) >= now;
            const isLink = item.locationOrLink && (item.locationOrLink.startsWith('http://') || item.locationOrLink.startsWith('https://'));

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  borderLeft: isUpcoming ? '4px solid var(--primary-600)' : '4px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span className="badge badge-subtle">{item.stage}</span>
                      <span className="badge badge-accent">{item.format}</span>
                      {getOutcomeBadge(item.status)}
                    </div>

                    <h3 className="card-title" style={{ fontSize: '1.1rem' }}>
                      {item.position} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>at</span> {item.company}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.35rem', fontSize: '0.84rem', color: 'var(--text-body)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                        <Clock size={14} color="var(--primary-600)" />
                        {formatDateTime(item.interviewDate)}
                      </span>

                      {item.locationOrLink && (
                        <span>
                          {isLink ? (
                            <a
                              href={item.locationOrLink}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}
                            >
                              Join Call <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span>Location: {item.locationOrLink}</span>
                          )}
                        </span>
                      )}

                      {item.interviewerName && (
                        <span>
                          Interviewer: <strong>{item.interviewerName}</strong>
                          {item.interviewerEmail && ` (${item.interviewerEmail})`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <select
                      className="select select-sm"
                      style={{ width: 'auto' }}
                      value={item.status}
                      onChange={(e) => handleQuickOutcomeChange(item, e.target.value)}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Passed">Passed</option>
                      <option value="Failed">Not Selected</option>
                      <option value="Rescheduled">Rescheduled</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onEditInterview(item)}
                      title="Edit interview"
                    >
                      <Edit3 size={13} />
                      Edit
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger-soft btn-sm"
                      onClick={() => onDeleteInterview(item.id)}
                      title="Delete interview"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Preparation & Expected Questions Accordion */}
                {(item.prepNotes || item.questionsToExpect || item.questionsAsked || item.feedback) && (
                  <div
                    style={{
                      marginTop: '0.85rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--border-color)',
                      fontSize: '0.84rem'
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
                      {item.prepNotes && (
                        <div style={{ background: 'var(--bg-subtle)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
                          <strong style={{ display: 'block', marginBottom: '0.2rem', color: 'var(--text-main)', fontSize: '0.78rem' }}>
                            Preparation Notes:
                          </strong>
                          <p style={{ margin: 0, color: 'var(--text-body)', whiteSpace: 'pre-line' }}>{item.prepNotes}</p>
                        </div>
                      )}

                      {item.questionsToExpect && (
                        <div style={{ background: 'var(--bg-subtle)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
                          <strong style={{ display: 'block', marginBottom: '0.2rem', color: 'var(--text-main)', fontSize: '0.78rem' }}>
                            Questions to Expect:
                          </strong>
                          <p style={{ margin: 0, color: 'var(--text-body)', whiteSpace: 'pre-line' }}>{item.questionsToExpect}</p>
                        </div>
                      )}

                      {item.feedback && (
                        <div style={{ background: 'var(--bg-primary-tint)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
                          <strong style={{ display: 'block', marginBottom: '0.2rem', color: 'var(--text-primary-strong)', fontSize: '0.78rem' }}>
                            Feedback &amp; Post-Interview Reflection:
                          </strong>
                          <p style={{ margin: 0, color: 'var(--text-body)', whiteSpace: 'pre-line' }}>{item.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
