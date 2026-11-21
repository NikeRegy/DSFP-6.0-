import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, AlertCircle, Lightbulb, UserCheck, ArrowRight } from 'lucide-react';
import { api } from '../api';

export default function MatchModal({ job, onClose, onApply, onOpenProfile }) {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .matchJob(job.id)
      .then((res) => {
        if (active) setMatchData(res.match);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [job.id]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Sparkles size={18} color="var(--primary-600)" />
              Smart Job Fit Analysis
            </h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {job.title} &middot; {job.company}
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {loading && (
            <div className="empty-state">
              <Sparkles size={28} color="var(--primary-600)" />
              <h3>Analyzing candidate alignment...</h3>
              <p>Comparing your career profile skills, work history, and preferences against this opening.</p>
            </div>
          )}

          {error && (
            <div className="alert alert-error" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div>{error}</div>
              {onOpenProfile && (
                <button
                  type="button"
                  className="btn btn-outline-accent btn-sm"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => {
                    onClose();
                    onOpenProfile();
                  }}
                >
                  <UserCheck size={14} />
                  Complete Career Profile Now
                </button>
              )}
            </div>
          )}

          {!loading && matchData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'var(--bg-accent-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Overall Match Score
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginTop: '0.2rem' }}>
                    {matchData.explanation}
                  </div>
                </div>
                <div className="match-score-badge">
                  {matchData.score}%
                </div>
              </div>

              {matchData.matchingSkills?.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.88rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={15} color="#166534" />
                    Matching Skills Identified ({matchData.matchingSkills.length})
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {matchData.matchingSkills.map((s, idx) => (
                      <span key={idx} className="skill-chip match">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {matchData.missingSkills?.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.88rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertCircle size={15} color="var(--text-rose)" />
                    Recommended Additional Focus Areas
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {matchData.missingSkills.map((s, idx) => (
                      <span key={idx} className="skill-chip gap">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {matchData.suggestions?.length > 0 && (
                <div style={{ background: 'var(--bg-subtle)', padding: '0.9rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 0.4rem', fontSize: '0.88rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Lightbulb size={15} color="var(--primary-600)" />
                    Application Tailoring Tips
                  </h4>
                  <ul className="detail-list" style={{ margin: 0, paddingLeft: '1.2rem' }}>
                    {matchData.suggestions.map((s, idx) => (
                      <li key={idx} style={{ marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onClose();
              onApply(job);
            }}
          >
            Apply with Tailored Pitch
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
