import React from 'react';
import { Briefcase, ClipboardList, ShieldCheck, LogIn, LogOut, Plus } from 'lucide-react';

export default function Navbar({
  user,
  activeTab,
  onSelectTab,
  onOpenAuth,
  onLogout,
  onOpenPostJob,
  myAppCount
}) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand" onClick={() => onSelectTab('jobs')} role="button" tabIndex={0}>
          <div className="brand-mark">
            <Briefcase size={20} />
          </div>
          <div>
            <span className="brand-title">Jobify</span>
            <span className="brand-sub">Job Tracking &amp; Openings</span>
          </div>
        </div>

        <nav className="nav-tabs" aria-label="Primary navigation">
          <button
            type="button"
            className={`nav-tab ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => onSelectTab('jobs')}
          >
            <Briefcase size={16} />
            Job Openings
          </button>

          {user && user.role === 'user' && (
            <button
              type="button"
              className={`nav-tab ${activeTab === 'my-applications' ? 'active' : ''}`}
              onClick={() => onSelectTab('my-applications')}
            >
              <ClipboardList size={16} />
              My Applications {myAppCount > 0 ? `(${myAppCount})` : ''}
            </button>
          )}

          {user && user.role === 'admin' && (
            <button
              type="button"
              className={`nav-tab ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => onSelectTab('admin')}
            >
              <ShieldCheck size={16} />
              Admin Portal
            </button>
          )}
        </nav>

        <div className="nav-right">
          {user && user.role === 'admin' && (
            <button type="button" className="btn btn-primary btn-sm" onClick={onOpenPostJob}>
              <Plus size={16} />
              Post Job
            </button>
          )}

          {user ? (
            <>
              <div className="user-pill">
                <span>{user.name}</span>
                <span className={`role-chip ${user.role === 'admin' ? '' : 'taupe'}`}>
                  {user.role === 'admin' ? 'Admin' : 'Applicant'}
                </span>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={onLogout}>
                <LogOut size={15} />
                Sign Out
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-primary btn-sm" onClick={onOpenAuth}>
              <LogIn size={16} />
              Sign In / Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

