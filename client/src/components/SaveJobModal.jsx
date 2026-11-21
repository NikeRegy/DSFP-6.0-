import React, { useState } from 'react';
import { X, Bookmark, Check } from 'lucide-react';
import { api } from '../api';

const CATEGORIES = ['Priority', 'Planning to Apply', 'Interested', 'Not Interested'];

export default function SaveJobModal({ job, initialSaved, onClose, onSaved }) {
  const [category, setCategory] = useState(initialSaved?.category || 'Priority');
  const [notes, setNotes] = useState(initialSaved?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (initialSaved?.id) {
        await api.updateSavedJob(initialSaved.id, { category, notes });
      } else {
        await api.saveJob({ jobId: job.id, category, notes });
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUnsave() {
    if (!initialSaved?.id) return;
    setSaving(true);
    try {
      await api.deleteSavedJob(initialSaved.id);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {initialSaved ? 'Edit Saved Vacancy' : 'Save Vacancy'}
            </h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {job.title} &middot; {job.company}
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="field">
              <label className="field-label">Save Category</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`btn btn-sm ${category === cat ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ justifyContent: 'flex-start' }}
                    onClick={() => setCategory(cat)}
                  >
                    {category === cat && <Check size={14} />}
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="field-label">Personal Notes &amp; Strategy (Optional)</label>
              <textarea
                className="textarea"
                placeholder="e.g. Highlight React 18 & design token experience; ask about team velocity in screen."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            {initialSaved ? (
              <button
                type="button"
                className="btn btn-danger-soft btn-sm"
                disabled={saving}
                onClick={handleUnsave}
              >
                Remove from Saved
              </button>
            ) : <span />}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Bookmark size={14} />
                {saving ? 'Saving...' : initialSaved ? 'Update Note' : 'Save Opportunity'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
