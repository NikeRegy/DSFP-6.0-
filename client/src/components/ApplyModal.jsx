import React, { useState } from 'react';
import { X, Upload, Send, LogIn, FileText } from 'lucide-react';
import { api } from '../api';

export default function ApplyModal({
  job,
  user,
  userDocuments = [],
  onClose,
  onSuccess,
  onSwitchToAuth
}) {
  const [applicantName, setApplicantName] = useState(user?.name || '');
  const [applicantEmail, setApplicantEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [salaryExpectations, setSalaryExpectations] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [password, setPassword] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [selectedDocId, setSelectedDocId] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('applicantName', applicantName);
      fd.append('applicantEmail', applicantEmail);
      fd.append('phone', phone);
      fd.append('yearsExperience', yearsExperience);
      fd.append('salaryExpectations', salaryExpectations);
      fd.append('portfolioUrl', portfolioUrl);
      fd.append('coverLetter', coverLetter);

      if (!user && password) {
        fd.append('password', password);
      }

      if (resumeFile) {
        fd.append('resume', resumeFile);
      } else if (selectedDocId) {
        fd.append('cvDocumentId', selectedDocId);
      }

      const res = await api.applyToJob(job.id, fd);
      onSuccess(res.application, res.token, res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const cvDocuments = userDocuments.filter((d) => d.category.includes('CV') || d.category === 'Other');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Apply for {job.title}</h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {job.company} &middot; {job.location} &middot; {job.workMode}
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="modal-body">
            {!user && (
              <div
                className="alert alert-info"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  flexWrap: 'wrap'
                }}
              >
                <span>Submit directly below to apply and track your status automatically.</span>
                <button
                  type="button"
                  className="btn btn-outline-accent btn-sm"
                  onClick={onSwitchToAuth}
                >
                  <LogIn size={14} />
                  Already have an account? Sign In
                </button>
              </div>
            )}

            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-grid-2">
              <div className="field">
                <label className="field-label">Full Name *</label>
                <input
                  className="input"
                  type="text"
                  required
                  placeholder="e.g. Jordan Taylor"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label">Email Address *</label>
                <input
                  className="input"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="field">
                <label className="field-label">Phone Number</label>
                <input
                  className="input"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label">Years of Relevant Experience</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. 4 years"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="field">
                <label className="field-label">LinkedIn / Portfolio / GitHub URL</label>
                <input
                  className="input"
                  type="url"
                  placeholder="https://github.com/..."
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label">Target Salary Expectations</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. $140,000 / year"
                  value={salaryExpectations}
                  onChange={(e) => setSalaryExpectations(e.target.value)}
                />
              </div>
            </div>

            {!user && (
              <div className="field">
                <label className="field-label">
                  Create Account Password (Optional — to log in and track later)
                </label>
                <input
                  className="input"
                  type="password"
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            {/* Document / CV Selection */}
            <div className="field">
              <label className="field-label">Resume / Curriculum Vitae *</label>

              {user && cvDocuments.length > 0 && (
                <div style={{ marginBottom: '0.65rem' }}>
                  <select
                    className="select"
                    value={selectedDocId}
                    onChange={(e) => {
                      setSelectedDocId(e.target.value);
                      if (e.target.value) setResumeFile(null);
                    }}
                  >
                    <option value="">-- Choose saved CV from Document Hub --</option>
                    {cvDocuments.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({doc.category} - {doc.originalName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.75rem 0.95rem',
                  border: '1px dashed var(--border-primary)',
                  background: 'var(--bg-primary-tint)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: '0.86rem',
                  color: 'var(--text-primary-strong)'
                }}
              >
                <Upload size={16} />
                <span>
                  {resumeFile
                    ? `Upload new file: ${resumeFile.name}`
                    : selectedDocId
                    ? 'Using selected CV from Document Hub (or click to upload new)'
                    : 'Choose a resume file to upload (PDF, DOCX, TXT up to 5MB)'}
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setResumeFile(f);
                    if (f) setSelectedDocId('');
                  }}
                />
              </label>
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Why are you a strong fit for this role? (Cover Pitch) *</label>
              <textarea
                className="textarea"
                required
                placeholder="Highlight your relevant accomplishments, design/engineering decisions, and interest in this role..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Send size={15} />
              {submitting ? 'Submitting Application...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
