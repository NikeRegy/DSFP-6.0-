import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  X,
  Video,
  Bell,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { formatDate, formatDateTime } from '../utils';

export default function CalendarView({
  events = [],
  onViewApplication,
  onViewJob
}) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'agenda'

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  // Generate calendar days matrix
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true });
    }

    // Next month padding to fill complete weeks (multiples of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  // Index events by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      if (!ev.date) return;
      try {
        const d = new Date(ev.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!map[key]) map[key] = [];
        map[key].push(ev);
      } catch {
        // ignore invalid date
      }
    });
    return map;
  }, [events]);

  const todayKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  function getEventClass(type) {
    switch (type) {
      case 'interview':
        return 'calendar-event-interview';
      case 'deadline':
        return 'calendar-event-deadline';
      case 'reminder':
        return 'calendar-event-reminder';
      default:
        return 'calendar-event-pill';
    }
  }

  // Sorted list for Agenda View
  const agendaEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [events]);

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Job Search Calendar</h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Consolidated timeline of upcoming interviews, assessment deadlines, and follow-ups.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div className="subnav-tabs" style={{ margin: 0 }}>
            <button
              type="button"
              className={`subnav-tab ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button
              type="button"
              className={`subnav-tab ${viewMode === 'agenda' ? 'active' : ''}`}
              onClick={() => setViewMode('agenda')}
            >
              Agenda ({events.length})
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="card" style={{ padding: '1rem' }}>
          {/* Calendar Header / Month Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={prevMonth} aria-label="Previous Month">
                <ChevronLeft size={16} />
              </button>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', minWidth: 170, textAlign: 'center' }}>
                {monthName}
              </h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={nextMonth} aria-label="Next Month">
                <ChevronRight size={16} />
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={goToToday}>
                Today
              </button>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.76rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--text-rose)' }} />
                Interview
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--primary-600)' }} />
                Deadline
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--taupe-500)' }} />
                Reminder
              </span>
            </div>
          </div>

          {/* 7-Day Grid */}
          <div className="calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="calendar-day-header">
                {d}
              </div>
            ))}

            {calendarDays.map(({ date, isCurrentMonth }, idx) => {
              const pad = (n) => String(n).padStart(2, '0');
              const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
              const isToday = key === todayKey;
              const dayEvents = eventsByDate[key] || [];

              return (
                <div
                  key={idx}
                  className={`calendar-cell ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                >
                  <div className="calendar-date-number">{date.getDate()}</div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className={`calendar-event-pill ${getEventClass(ev.type)}`}
                        onClick={() => setSelectedEvent(ev)}
                        title={`${ev.title} (${ev.type})`}
                      >
                        {ev.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Agenda View */
        <div className="card">
          {agendaEvents.length === 0 ? (
            <div className="empty-state">
              <CalendarDays size={36} color="var(--primary-600)" />
              <h3>No scheduled activities</h3>
              <p>Applications with deadlines, follow-up reminders, and interviews will populate here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {agendaEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    padding: '0.85rem 1.15rem'
                  }}
                  onClick={() => setSelectedEvent(ev)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <span className={`calendar-event-pill ${getEventClass(ev.type)}`} style={{ textTransform: 'uppercase' }}>
                      {ev.type}
                    </span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {ev.title}
                      </h4>
                      {ev.company && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ev.company}</div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    <Clock size={14} color="var(--primary-600)" />
                    {formatDateTime(ev.date)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="modal-backdrop" onClick={() => setSelectedEvent(null)} role="dialog" aria-modal="true">
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <span className={`calendar-event-pill ${getEventClass(selectedEvent.type)}`}>
                  {selectedEvent.type.toUpperCase()}
                </span>
                <h3 className="modal-title">{selectedEvent.title}</h3>
              </div>
              <button type="button" className="modal-close" onClick={() => setSelectedEvent(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem' }}>
              {selectedEvent.company && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Company: </span>
                  <strong>{selectedEvent.company}</strong>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={15} color="var(--primary-600)" />
                <span>{formatDateTime(selectedEvent.date)}</span>
              </div>

              {selectedEvent.notes && (
                <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                    Notes &amp; Details:
                  </span>
                  <p style={{ margin: 0, color: 'var(--text-body)', whiteSpace: 'pre-line' }}>{selectedEvent.notes}</p>
                </div>
              )}

              {selectedEvent.link && (
                <div>
                  <a
                    href={selectedEvent.link}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline-accent btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    Open Meeting Link <ExternalLink size={13} />
                  </a>
                </div>
              )}

              {selectedEvent.applicationId && (
                <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      const id = selectedEvent.applicationId;
                      setSelectedEvent(null);
                      onViewApplication(id);
                    }}
                  >
                    View Application Record
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
