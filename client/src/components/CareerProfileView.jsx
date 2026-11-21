import React, { useState, useEffect } from 'react';
import {
  User,
  Briefcase,
  GraduationCap,
  Sparkles,
  Save,
  Plus,
  Trash2,
  X,
  ExternalLink,
  MapPin,
  Mail,
  Phone,
  DollarSign
} from 'lucide-react';

const SUGGESTED_SKILLS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Python',
  'SQL',
  'PostgreSQL',
  'AWS',
  'Docker',
  'Git',
  'REST APIs',
  'GraphQL',
  'Tailwind CSS',
  'System Design',
  'Agile'
];

const COMMON_CATEGORIES = [
  'Engineering',
  'Product',
  'Design',
  'Data & Analytics',
  'Operations',
  'Marketing',
  'Sales',
  'Finance'
];

export default function CareerProfileView({ profile, onSaveProfile, showToast }) {
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [headline, setHeadline] = useState(profile?.headline || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedinUrl || '');
  const [portfolioUrl, setPortfolioUrl] = useState(profile?.portfolioUrl || '');
  const [githubUrl, setGithubUrl] = useState(profile?.githubUrl || '');

  // Career Preferences
  const [preferredWorkModes, setPreferredWorkModes] = useState(
    profile?.preferredWorkModes || ['Remote', 'Hybrid']
  );
  const [preferredCategories, setPreferredCategories] = useState(
    profile?.preferredCategories || ['Engineering']
  );
  const [targetSalaryMin, setTargetSalaryMin] = useState(profile?.targetSalaryMin || '');
  const [targetSalaryMax, setTargetSalaryMax] = useState(profile?.targetSalaryMax || '');
  const [currency, setCurrency] = useState(profile?.currency || 'USD');

  // Skills
  const [skills, setSkills] = useState(profile?.skills || []);
  const [skillInput, setSkillInput] = useState('');

  // Experience
  const [experience, setExperience] = useState(profile?.experience || []);

  // Education
  const [education, setEducation] = useState(profile?.education || []);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setHeadline(profile.headline || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setLocation(profile.location || '');
      setLinkedinUrl(profile.linkedinUrl || '');
      setPortfolioUrl(profile.portfolioUrl || '');
      setGithubUrl(profile.githubUrl || '');
      setPreferredWorkModes(profile.preferredWorkModes || ['Remote', 'Hybrid']);
      setPreferredCategories(profile.preferredCategories || ['Engineering']);
      setTargetSalaryMin(profile.targetSalaryMin || '');
      setTargetSalaryMax(profile.targetSalaryMax || '');
      setCurrency(profile.currency || 'USD');
      setSkills(profile.skills || []);
      setExperience(profile.experience || []);
      setEducation(profile.education || []);
    }
  }, [profile]);

  function handleAddSkill(skillToAdd) {
    const s = (skillToAdd || skillInput).trim();
    if (!s) return;
    if (!skills.some((existing) => existing.toLowerCase() === s.toLowerCase())) {
      setSkills([...skills, s]);
    }
    setSkillInput('');
  }

  function handleRemoveSkill(skillToRemove) {
    setSkills(skills.filter((s) => s !== skillToRemove));
  }

  function handleToggleWorkMode(mode) {
    if (preferredWorkModes.includes(mode)) {
      setPreferredWorkModes(preferredWorkModes.filter((m) => m !== mode));
    } else {
      setPreferredWorkModes([...preferredWorkModes, mode]);
    }
  }

  function handleToggleCategory(cat) {
    if (preferredCategories.includes(cat)) {
      setPreferredCategories(preferredCategories.filter((c) => c !== cat));
    } else {
      setPreferredCategories([...preferredCategories, cat]);
    }
  }

  // Experience handlers
  function addExperienceEntry() {
    setExperience([
      ...experience,
      { title: '', company: '', startDate: '', endDate: 'Present', description: '' }
    ]);
  }

  function updateExperienceEntry(idx, field, val) {
    const next = [...experience];
    next[idx] = { ...next[idx], [field]: val };
    setExperience(next);
  }

  function removeExperienceEntry(idx) {
    setExperience(experience.filter((_, i) => i !== idx));
  }

  // Education handlers
  function addEducationEntry() {
    setEducation([
      ...education,
      { degree: '', fieldOfStudy: '', institution: '', yearGraduated: '' }
    ]);
  }

  function updateEducationEntry(idx, field, val) {
    const next = [...education];
    next[idx] = { ...next[idx], [field]: val };
    setEducation(next);
  }

  function removeEducationEntry(idx) {
    setEducation(education.filter((_, i) => i !== idx));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveProfile({
        fullName,
        headline,
        email,
        phone,
        location,
        linkedinUrl,
        portfolioUrl,
        githubUrl,
        preferredWorkModes,
        preferredCategories,
        targetSalaryMin: Number(targetSalaryMin) || 0,
        targetSalaryMax: Number(targetSalaryMax) || 0,
        currency,
        skills,
        experience,
        education
      });
      showToast('Career profile and match preferences saved successfully!');
    } catch (err) {
      showToast(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Career Profile &amp; Preferences</h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Powers the AI Job Matcher, application pre-filling, and role recommendations.
          </p>
        </div>

        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Personal & Contact Details */}
        <div className="card">
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Personal Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Professional Headline</label>
              <input
                type="text"
                className="input"
                placeholder="Senior Full-Stack Engineer | React & Node.js"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                placeholder="jane.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Phone Number</label>
              <input
                type="tel"
                className="input"
                placeholder="+1 (555) 019-2834"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Location</label>
              <input
                type="text"
                className="input"
                placeholder="San Francisco, CA (or Remote)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label className="label">LinkedIn URL</label>
              <input
                type="url"
                className="input"
                placeholder="https://linkedin.com/in/..."
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Portfolio / Personal Website</label>
              <input
                type="url"
                className="input"
                placeholder="https://janedoe.dev"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="label">GitHub URL</label>
              <input
                type="url"
                className="input"
                placeholder="https://github.com/..."
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Skills Management */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Skills &amp; Technologies ({skills.length})
              </h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                These skills are directly checked against job opening requirements by the AI Matcher.
              </p>
            </div>
          </div>

          {/* Active Skills Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', minHeight: 38, marginBottom: '0.85rem' }}>
            {skills.map((skill) => (
              <span key={skill} className="skill-chip match" style={{ fontSize: '0.82rem' }}>
                {skill}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}
                  onClick={() => handleRemoveSkill(skill)}
                  title={`Remove ${skill}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          {/* Add Skill Input */}
          <div style={{ display: 'flex', gap: '0.5rem', maxWidth: 420 }}>
            <input
              type="text"
              className="input"
              placeholder="Add skill (e.g. Docker, Python, Figma)..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
            />
            <button type="button" className="btn btn-secondary" onClick={() => handleAddSkill()}>
              Add
            </button>
          </div>

          {/* Suggested Skills to Add */}
          <div style={{ marginTop: '0.85rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Quick Add Common Skills:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).slice(0, 10).map((s) => (
                <button
                  key={s}
                  type="button"
                  className="skill-chip neutral"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleAddSkill(s)}
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Job Preferences & Salary Expectations */}
        <div className="card">
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Career &amp; Role Preferences
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="label">Preferred Work Modes</label>
              <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.35rem' }}>
                {['Remote', 'Hybrid', 'On-site'].map((mode) => (
                  <label key={mode} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                    <input
                      type="checkbox"
                      checked={preferredWorkModes.includes(mode)}
                      onChange={() => handleToggleWorkMode(mode)}
                    />
                    {mode}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Target Compensation Range</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <select
                  className="select"
                  style={{ width: 85 }}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                </select>

                <input
                  type="number"
                  className="input"
                  placeholder="Min (e.g. 100000)"
                  value={targetSalaryMin}
                  onChange={(e) => setTargetSalaryMin(e.target.value)}
                />

                <span style={{ color: 'var(--text-muted)' }}>–</span>

                <input
                  type="number"
                  className="input"
                  placeholder="Max (e.g. 140000)"
                  value={targetSalaryMax}
                  onChange={(e) => setTargetSalaryMax(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label className="label">Target Departments / Categories</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: '0.35rem' }}>
              {COMMON_CATEGORIES.map((cat) => {
                const isSelected = preferredCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`subnav-tab ${isSelected ? 'active' : ''}`}
                    style={{ margin: 0, padding: '0.3rem 0.75rem', fontSize: '0.82rem' }}
                    onClick={() => handleToggleCategory(cat)}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Work Experience */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Work Experience ({experience.length})
              </h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Record roles and accomplishments used in auto-matching and applications.
              </p>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addExperienceEntry}>
              <Plus size={14} /> Add Role
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {experience.map((exp, idx) => (
              <div key={idx} style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', flex: 1 }}>
                    <input
                      type="text"
                      className="input input-sm"
                      placeholder="Job Title (e.g. Senior Software Engineer)"
                      value={exp.title}
                      onChange={(e) => updateExperienceEntry(idx, 'title', e.target.value)}
                    />
                    <input
                      type="text"
                      className="input input-sm"
                      placeholder="Company (e.g. Stripe)"
                      value={exp.company}
                      onChange={(e) => updateExperienceEntry(idx, 'company', e.target.value)}
                    />
                    <input
                      type="text"
                      className="input input-sm"
                      placeholder="Period (e.g. 2022 - Present)"
                      value={exp.startDate}
                      onChange={(e) => updateExperienceEntry(idx, 'startDate', e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger-soft btn-sm"
                    onClick={() => removeExperienceEntry(idx)}
                    title="Remove role"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <textarea
                  className="textarea"
                  rows={2}
                  placeholder="Key responsibilities and achievements..."
                  value={exp.description}
                  onChange={(e) => updateExperienceEntry(idx, 'description', e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Education ({education.length})
              </h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Degrees, universities, and academic honors.
              </p>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addEducationEntry}>
              <Plus size={14} /> Add Education
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {education.map((edu, idx) => (
              <div key={idx} style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', flex: 1 }}>
                    <input
                      type="text"
                      className="input input-sm"
                      placeholder="Degree (e.g. Bachelor of Science)"
                      value={edu.degree}
                      onChange={(e) => updateEducationEntry(idx, 'degree', e.target.value)}
                    />
                    <input
                      type="text"
                      className="input input-sm"
                      placeholder="Field of Study (e.g. Computer Science)"
                      value={edu.fieldOfStudy}
                      onChange={(e) => updateEducationEntry(idx, 'fieldOfStudy', e.target.value)}
                    />
                    <input
                      type="text"
                      className="input input-sm"
                      placeholder="Institution (e.g. UC Berkeley)"
                      value={edu.institution}
                      onChange={(e) => updateEducationEntry(idx, 'institution', e.target.value)}
                    />
                    <input
                      type="text"
                      className="input input-sm"
                      placeholder="Year (e.g. 2021)"
                      value={edu.yearGraduated}
                      onChange={(e) => updateEducationEntry(idx, 'yearGraduated', e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger-soft btn-sm"
                    onClick={() => removeEducationEntry(idx)}
                    title="Remove education"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Career Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
