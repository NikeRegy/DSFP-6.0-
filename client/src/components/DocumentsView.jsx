import React, { useState, useMemo } from 'react';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Edit3,
  Search,
  Award,
  GraduationCap,
  Briefcase,
  Layers,
  FileCheck,
  Check
} from 'lucide-react';
import { api } from '../api';
import { formatDate } from '../utils';

const CATEGORIES = [
  'All',
  'Resume / CV',
  'Cover Letter',
  'Certificate',
  'Academic Qualification',
  'Portfolio',
  'Other'
];

function getCategoryIcon(cat) {
  switch (cat) {
    case 'Resume / CV':
      return <FileText size={20} />;
    case 'Cover Letter':
      return <Layers size={20} />;
    case 'Certificate':
      return <Award size={20} />;
    case 'Academic Qualification':
      return <GraduationCap size={20} />;
    case 'Portfolio':
      return <Briefcase size={20} />;
    default:
      return <FileCheck size={20} />;
  }
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function DocumentsView({
  documents = [],
  onUploadClick,
  onDeleteDoc,
  onUpdateDoc
}) {
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDocId, setEditingDocId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      if (categoryFilter !== 'All' && doc.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = doc.title?.toLowerCase().includes(q);
        const matchesName = doc.originalName?.toLowerCase().includes(q);
        const matchesDesc = doc.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [documents, categoryFilter, searchQuery]);

  function startEdit(doc) {
    setEditingDocId(doc.id);
    setEditTitle(doc.title || '');
    setEditDesc(doc.description || '');
  }

  async function saveEdit(docId) {
    if (!editTitle.trim()) return;
    await onUpdateDoc(docId, { title: editTitle.trim(), description: editDesc.trim() });
    setEditingDocId(null);
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Documents &amp; CV Manager ({documents.length})</h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Organize tailored CV versions, cover letters, certificates, and submission attachments.
          </p>
        </div>

        <button type="button" className="btn btn-primary" onClick={onUploadClick}>
          <Upload size={16} />
          Upload Document
        </button>
      </div>

      {/* Category Pills & Search */}
      <div className="filter-bar" style={{ marginBottom: '1rem' }}>
        <div className="input-wrap" style={{ flex: 1 }}>
          <Search size={16} className="input-icon" />
          <input
            type="text"
            className="input with-icon"
            placeholder="Search documents by title, filename, or focus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="select"
          style={{ width: 'auto', minWidth: '180px' }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {CATEGORIES.map((cat) => {
            const count = cat === 'All' ? documents.length : documents.filter((d) => d.category === cat).length;
            return (
              <option key={cat} value={cat}>
                {cat} ({count})
              </option>
            );
          })}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <FileText size={36} color="var(--primary-600)" />
          <h3>No documents found</h3>
          <p>
            {searchQuery || categoryFilter !== 'All'
              ? 'Try adjusting your search query or category filter.'
              : 'Upload your primary CV, cover letters, or certificates so you can attach them directly when applying.'}
          </p>
          <button type="button" className="btn btn-primary" onClick={onUploadClick}>
            Upload Document
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {filtered.map((doc) => {
            const isEditing = editingDocId === doc.id;
            return (
              <div key={doc.id} className="doc-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                  <div className="doc-icon-wrap">{getCategoryIcon(doc.category)}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <input
                          type="text"
                          className="input input-sm"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Document title"
                        />
                        <input
                          type="text"
                          className="input input-sm"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Description / notes"
                        />
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => saveEdit(doc.id)}
                          >
                            <Check size={13} /> Save
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setEditingDocId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: '0.96rem',
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={doc.title}
                        >
                          {doc.title}
                        </h4>

                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-muted)',
                            marginTop: '0.2rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            flexWrap: 'wrap'
                          }}
                        >
                          <span className="badge badge-subtle">{doc.category}</span>
                          <span>&middot;</span>
                          <span>{formatBytes(doc.size)}</span>
                          <span>&middot;</span>
                          <span>{formatDate(doc.createdAt)}</span>
                        </div>

                        {doc.description && (
                          <p
                            style={{
                              margin: '0.45rem 0 0',
                              fontSize: '0.82rem',
                              color: 'var(--text-body)',
                              lineHeight: 1.4
                            }}
                          >
                            {doc.description}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '0.85rem',
                    paddingTop: '0.65rem',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '0.8rem'
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                    {doc.originalName}
                  </span>

                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <a
                      href={api.getDocumentDownloadUrl(doc.id)}
                      className="btn btn-outline-accent btn-sm"
                      download={doc.originalName}
                      title="Download file"
                    >
                      <Download size={13} />
                      Download
                    </a>
                    {!isEditing && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => startEdit(doc)}
                        title="Rename or edit note"
                      >
                        <Edit3 size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-danger-soft btn-sm"
                      onClick={() => onDeleteDoc(doc.id)}
                      title="Delete document"
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
