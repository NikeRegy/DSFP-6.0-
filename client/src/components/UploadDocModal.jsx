import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, AlertCircle, CheckCircle } from 'lucide-react';

const CATEGORIES = [
  'Resume / CV',
  'Cover Letter',
  'Certificate',
  'Academic Qualification',
  'Portfolio',
  'Other'
];

export default function UploadDocModal({ onClose, onUpload }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Resume / CV');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
      return;
    }
    setFile(selected);
    setError('');
    if (!title.trim()) {
      // Suggest title from file name without extension
      const cleanName = selected.name.replace(/\.[^/.]+$/, '');
      setTitle(cleanName);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError('Please choose a document to upload.');
      return;
    }
    if (!title.trim()) {
      setError('Please provide a document title (e.g. Data Analyst CV).');
      return;
    }

    setUploading(true);
    setError('');

    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', title.trim());
    fd.append('category', category);
    fd.append('description', description.trim());

    try {
      await onUpload(fd);
      onClose();
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <div className="brand-mark" style={{ width: 34, height: 34 }}>
              <FileText size={17} />
            </div>
            <div>
              <h3 className="modal-title">Upload Document</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Store multiple CV versions, cover letters, certificates &amp; portfolios.
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
          {/* File Picker Zone */}
          <div
            className="drop-zone"
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'var(--bg-subtle)'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx,.txt,.rtf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
            />
            <UploadCloud size={32} color="var(--primary-600)" style={{ margin: '0 auto 0.5rem' }} />
            {file ? (
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-main)', margin: '0 0 0.2rem' }}>
                  {file.name}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  {(file.size / 1024).toFixed(1)} KB &middot; Click to choose different file
                </p>
              </div>
            ) : (
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-main)', margin: '0 0 0.2rem' }}>
                  Click to browse or drop your document here
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Supports PDF, DOC, DOCX, TXT (up to 10MB)
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="label">Document Title / Label *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Senior Backend Engineer CV (2026)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
            <div>
              <label className="label">Category</label>
              <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Description / Target Focus</label>
            <textarea
              className="textarea"
              rows={2}
              placeholder="e.g. Tailored for Python & Go distributed systems roles, emphasizing high scalability."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={uploading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload & Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
