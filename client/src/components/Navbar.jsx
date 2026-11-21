import React from 'react';
import {
  Briefcase,
  LayoutDashboard,
  ClipboardList,
  Bookmark,
  CalendarDays,
  FileText,
  Video,
  Bell,
  BarChart3,
  UserCheck,
  ShieldCheck,
  Plus,
  LogIn,
  LogOut
} from 'lucide-react';

export default function Navbar({
  user,
  activeTab,
  onSelectTab,
  onOpenAuth,
  onLogout,
  onOpenPostJob,
  myAppCount,
  savedCount,
  remindersDueCount,
  interviewsCount
}) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand" onClick={() => onSelectTab(user?.role === 'user' ? 'dashboard' : 'jobs')} role="button" tabIndex={0}>
          <div className="brand-mark">
            <Briefcase size={20} />
          </div>
          <div>
            <span className="brand-title">Jobify</span>
            <span className="brand-sub">Career &amp; Application Intelligence</span>
          </div>
        </div>

        <nav className="nav-tabs" aria-label="Primary navigation" style={{ overflowX: 'auto', maxWidth: '100%' }}>
          {user && user.role === 'user' && (
            <button
              type="button"
              className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => onSelectTab('dashboard')}
            >
              <LayoutDashboard size={15} />
              Dashboard
            </button>
          )}

          <button
            type="button"
            className={`nav-tab ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => onSelectTab('jobs')}
          >
            <Briefcase size={15} />
            Job Openings
          </button>

          {user && user.role === 'user' && (
            <>
              <button
                type="button"
                className={`nav-tab ${activeTab === 'my-applications' ? 'active' : ''}`}
                onClick={() => onSelectTab('my-applications')}
              >
                <ClipboardList size={15} />
                Applications {myAppCount > 0 ? `(${myAppCount})` : ''}
              </button>

              <button
                type="button"
                className={`nav-tab ${activeTab === 'saved-jobs' ? 'active' : ''}`}
                onClick={() => onSelectTab('saved-jobs')}
              >
                <Bookmark size={15} />
                Saved {savedCount > 0 ? `(${savedCount})` : ''}
              </button>

              <button
                type="button"
                className={`nav-tab ${activeTab === 'interviews' ? 'active' : ''}`}
                onClick={() => onSelectTab('interviews')}
              >
                <Video size={15} />
                Interviews {interviewsCount > 0 ? `(${interviewsCount})` : ''}
              </button>

              <button
                type="button"
                className={`nav-tab ${activeTab === 'reminders' ? 'active' : ''}`}
                onClick={() => onSelectTab('reminders')}
              >
                <Bell size={15} />
                Reminders
                {remindersDueCount > 0 && <span className="nav-badge-pill">{remindersDueCount}</span>}
              </button>

              <button
                type="button"
                className={`nav-tab ${activeTab === 'documents' ? 'active' : ''}`}
                onClick={() => onSelectTab('documents')}
              >
                <FileText size={15} />
                Documents
              </button>

              <button
                type="button"
                className={`nav-tab ${activeTab === 'calendar' ? 'active' : ''}`}
                onClick={() => onSelectTab('calendar')}
              >
                <CalendarDays size={15} />
                Calendar
              </button>

              <button
                type="button"
                className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => onSelectTab('analytics')}
              >
                <BarChart3 size={15} />
                Analytics
              </button>

              <button
                type="button"
                className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => onSelectTab('profile')}
              >
                <UserCheck size={15} />
                Profile
              </button>
            </>
          )}

          {user && user.role === 'admin' && (
            <button
              type="button"
              className={`nav-tab ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => onSelectTab('admin')}
            >
              <ShieldCheck size={15} />
              Admin Portal
            </button>
          )}
        </nav>

        <div className="nav-right">
          {user && user.role === 'admin' && (
            <button type="button" className="btn btn-primary btn-sm" onClick={onOpenPostJob}>
              <Plus size={15} />
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
                <LogOut size={14} />
                Sign Out
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-primary btn-sm" onClick={onOpenAuth}>
              <LogIn size={15} />
              Sign In / Try Demo
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
