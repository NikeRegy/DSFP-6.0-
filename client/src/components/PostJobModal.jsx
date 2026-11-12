import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { api } from '../api';

export default function PostJobModal({ job, onClose, onSaved }) {
  const isEditing = Boolean(job);

  const [title, setTitle] = useState(job?.title || '');
  const [company, setCompany] = useState(job?.company || 'Jobify');
  const [department, setDepartment] = useState(job?.department || 'Engineering');
  const [location, setLocation] = useState(job?.location || '');
  const [workMode, setWorkMode] = useState(job?.workMode || 'Hybrid');
  const [employmentType, setEmploymentType] = useState(job?.employmentType || 'Full-time');
  const [salaryMin, setSalaryMin] = useState(job?.salaryMin ?? '');
  const [salaryMax, setSalaryMax] = useState(job?.salaryMax ?? '');
  const [currency, setCurrency] = useState(job?.currency || 'USD');
  const [deadline, setDeadline] = useState(job?.deadline || '');
  const [status, setStatus] = useState(job?.status || 'Open');
  const [summary, setSummary] = useState(job?.summary || '');
  const [responsibilities, setResponsibilities] = useState(
    (job?.responsibilities || []).join('\n')
  );
  const [requirements, setRequirements] = useState((job?.requirements || []).join('\n'));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        title,
        company,
        department,
        location,
        workMode,
        employmentType,
        salaryMin,
        salaryMax,
        currency,
        deadline,
        status,
        summary,
        responsibilities,
        requirements
      };
      const res = isEditing
        ? await api.updateJob(job.id, payload)
        : await api.createJob(payload);
      onSaved(res.job, isEditing);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEditing ? 'Edit Job Opening' : 'Post New Job Opening'}</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-grid-2">
              <div className="field">
                <label className="field-label">Job Title *</label>
                <input
                  className="input"
                  type="text"
                  required
                  placeholder="e.g. Full-Stack Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label">Company / Organization *</label>
                <input
                  className="input"
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="field">
                <label className="field-label">Department *</label>
                <input
                  className="input"
                  type="text"
                  required
                  placeholder="e.g. Engineering, Design, Product"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label">Location *</label>
                <input
                  className="input"
                  type="text"
                  required
                  placeholder="e.g. Remote, New York, NY"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="field">
                <label className="field-label">Work Mode</label>
                <select className="select" value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>

              <div className="field">
                <label className="field-label">Employment Type</label>
                <select
                  className="select"
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="field">
                <label className="field-label">Salary Range (Min / Max)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 95px', gap: '0.5rem' }}>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                  />
                  <input
                    className="input"
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                  />
                  <input
                    className="input"
                    type="text"
                    placeholder="USD"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Application Deadline &amp; Status</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: '0.5rem' }}>
                  <input
                    className="input"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                  <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="Open">Open</option>
                    <option value="Draft">Draft</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="field">
              <label className="field-label">Role Summary *</label>
              <textarea
                className="textarea"
                required
                placeholder="Describe the impact of this role and who you are looking for..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>

            <div className="form-grid-2">
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">Responsibilities (one per line)</label>
                <textarea
                  className="textarea"
                  placeholder="Build accessible interfaces&#10;Collaborate with product & backend teams"
                  value={responsibilities}
                  onChange={(e) => setResponsibilities(e.target.value)}
                />
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">Requirements (one per line)</label>
                <textarea
                  className="textarea"
                  placeholder="3+ years with React or Vue&#10;Strong communication skills"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={15} />
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Publish Job Opening'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

