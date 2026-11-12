import React, { useState } from 'react';
import { X, ShieldCheck, User } from 'lucide-react';
import { api } from '../api';

export default function AuthModal({ onClose, onSuccess, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res =
        mode === 'login'
          ? await api.login(email, password)
          : await api.register({ name, email, password, title });
      onSuccess(res.token, res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function quickLogin(demoEmail, demoPassword) {
    setError('');
    setLoading(true);
    try {
      const res = await api.login(demoEmail, demoPassword);
      onSuccess(res.token, res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <h2 className="modal-title">
            {mode === 'login' ? 'Sign In to Jobify' : 'Create Applicant Account'}
          </h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="demo-box">
            <div className="demo-box-title">One-Click Demo Access</div>
            <div className="demo-actions">
              <button
                type="button"
                className="btn btn-outline-accent btn-sm"
                disabled={loading}
                onClick={() => quickLogin('admin@jobify.io', 'admin123')}
              >
                <ShieldCheck size={15} />
                Demo Admin
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={loading}
                onClick={() => quickLogin('user@jobify.io', 'user123')}
              >
                <User size={15} />
                Demo Normal User
              </button>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <div className="field">
                  <label className="field-label">Full Name *</label>
                  <input
                    className="input"
                    type="text"
                    required
                    placeholder="e.g. Jordan Taylor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Current Role / Headline</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g. Frontend Developer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="field">
              <label className="field-label">Email Address *</label>
              <input
                className="input"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="field-label">Password *</label>
              <input
                className="input"
                type="password"
                required
                minLength={6}
                placeholder={mode === 'register' ? 'At least 6 characters' : 'Enter password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.4rem' }}
              disabled={loading}
            >
              {loading
                ? 'Please wait...'
                : mode === 'login'
                ? 'Sign In'
                : 'Create Account & Continue'}
            </button>
          </form>

          <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {mode === 'login' ? (
              <>
                New to Jobify?{' '}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--primary-500)', padding: '0 0.25rem' }}
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                >
                  Create an applicant account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--primary-500)', padding: '0 0.25rem' }}
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                >
                  Sign in instead
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

