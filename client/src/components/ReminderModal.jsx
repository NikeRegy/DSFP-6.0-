import React, { useState } from 'react';
import { X, Calendar, Clock, Bell, AlertCircle } from 'lucide-react';

const REMINDER_TYPES = [
  'Follow-up',
  'Interview Prep',
  'Interview Date',
  'Assessment Deadline',
  'Closing Date',
  'Other'
];

export default function ReminderModal({
  applications = [],
  initialReminder = null,
  onClose,
  onSave
}) {
  const [applicationId, setApplicationId] = useState(
    initialReminder?.applicationId || ''
  );
  const [type, setType] = useState(initialReminder?.type || 'Follow-up');
  
  // Format initial ISO date to datetime-local input string YYYY-MM-DDTHH:mm
  const formatForInput = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const defaultDateTime = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(9, 0, 0, 0);
    return formatForInput(d.toISOString());
  };

  const [reminderDate, setReminderDate] = useState(
    initialReminder?.reminderDate ? formatForInput(initialReminder.reminderDate) : defaultDateTime()
  );
  const [notes, setNotes] = useState(initialReminder?.notes || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reminderDate) {
      setError('Please select a reminder date and time.');
      return;
    }
    if (!notes.trim()) {
      setError('Please provide a short reminder note or action item.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave({
        applicationId: applicationId || null,
        type,
        reminderDate: new Date(reminderDate).toISOString(),
        notes: notes.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save reminder.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <div className="brand-mark" style={{ width: 34, height: 34 }}>
              <Bell size={17} />
            </div>
            <div>
              <h3 className="modal-title">
                {initialReminder ? 'Reschedule Reminder' : 'Set Follow-up Reminder'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Never miss an interview, follow-up, or deadline.
              </p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label">Associated Application (Optional)</label>
            <select
              className="select"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
            >
              <option value="">None (General Reminder)</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.jobTitle} at {app.company}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label">Reminder Type</label>
              <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
                {REMINDER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Date &amp; Time *</label>
              <input
                type="datetime-local"
                className="input"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Reminder Note / Action *</label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="e.g. Email hiring manager Sarah to inquire about interview feedback..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : initialReminder ? 'Update Reminder' : 'Set Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
