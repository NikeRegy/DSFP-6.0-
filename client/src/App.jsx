import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Sparkles, Plus, ClipboardList, Briefcase, Sun, Moon } from 'lucide-react';
import { api, getStoredUser, getStoredToken, saveSession, clearSession } from './api';
import { getJobShareUrl, copyToClipboard } from './utils';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import JobCard from './components/JobCard';
import JobDetailModal from './components/JobDetailModal';
import ApplyModal from './components/ApplyModal';
import MyApplications from './components/MyApplications';
import AdminDashboard from './components/AdminDashboard';
import PostJobModal from './components/PostJobModal';
import ApplicantsModal from './components/ApplicantsModal';

function getJobIdFromUrl() {
  const pathMatch = window.location.pathname.match(/^\/jobs\/([^/]+)\/?$/);
  if (pathMatch) return decodeURIComponent(pathMatch[1]);
  const params = new URLSearchParams(window.location.search);
  return params.get('job') || '';
}

export default function App() {
  const [user, setUser] = useState(() => getStoredUser());
  const [activeTab, setActiveTab] = useState('jobs');
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('jobify_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('jobify_theme', theme);
  }, [theme]);

  // Job board data & filters
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [workModeFilter, setWorkModeFilter] = useState('All');
  const [employmentFilter, setEmploymentFilter] = useState('All');

  // User applications
  const [myApplications, setMyApplications] = useState([]);

  // Admin data
  const [adminJobs, setAdminJobs] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [adminApplications, setAdminApplications] = useState([]);

  // Modals & notifications
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingApplyJob, setPendingApplyJob] = useState(null);
  const [detailJob, setDetailJob] = useState(null);
  const [applyJob, setApplyJob] = useState(null);
  const [postJobTarget, setPostJobTarget] = useState(undefined); // undefined = closed, null = new, object = edit
  const [inspectJob, setInspectJob] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const loadJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const res = await api.getJobs();
      setJobs(res.jobs || []);
      return res.jobs || [];
    } catch (err) {
      showToast(err.message);
      return [];
    } finally {
      setLoadingJobs(false);
    }
  }, [showToast]);

  const loadUserApplications = useCallback(async () => {
    try {
      const res = await api.getMyApplications();
      setMyApplications(res.applications || []);
    } catch {
      // ignore if logged out
    }
  }, []);

  const loadAdminData = useCallback(async () => {
    try {
      const [jobsRes, statsRes, appsRes] = await Promise.all([
        api.getJobs({ includeAll: '1' }),
        api.getAdminStats(),
        api.getAdminApplications()
      ]);
      setAdminJobs(jobsRes.jobs || []);
      setAdminStats(statsRes.stats || null);
      setAdminApplications(appsRes.applications || []);
    } catch (err) {
      showToast(err.message);
    }
  }, [showToast]);

  const openJobFromUrl = useCallback(
    async (loadedList = []) => {
      const targetId = getJobIdFromUrl();
      if (!targetId) {
        setDetailJob(null);
        return;
      }
      const match = loadedList.find((j) => j.id === targetId);
      if (match) {
        setActiveTab('jobs');
        setDetailJob(match);
        return;
      }
      try {
        const res = await api.getJob(targetId);
        if (res.job) {
          setActiveTab('jobs');
          setDetailJob(res.job);
        }
      } catch {
        showToast('Shared job link could not be found or is no longer open.');
      }
    },
    [showToast]
  );

  // Validate stored token on mount and resolve deep-linked job URL
  useEffect(() => {
    const token = getStoredToken();
    const init = async () => {
      if (token) {
        try {
          const res = await api.me();
          setUser(res.user);
          saveSession(token, res.user);
        } catch {
          clearSession();
          setUser(null);
        }
      }
      const loaded = await loadJobs();
      await openJobFromUrl(loaded);
    };
    init();
  }, [loadJobs, openJobFromUrl]);

  useEffect(() => {
    const onPopState = () => {
      openJobFromUrl(jobs);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [jobs, openJobFromUrl]);

  useEffect(() => {
    if (detailJob) {
      document.title = `${detailJob.title} at ${detailJob.company} — Jobify`;
    } else {
      document.title = 'Jobify — Job Tracking & Openings';
    }
  }, [detailJob]);

  useEffect(() => {
    if (!user) {
      setMyApplications([]);
      setAdminJobs([]);
      setAdminStats(null);
      setAdminApplications([]);
      return;
    }
    if (user.role === 'admin') {
      loadAdminData();
    } else {
      loadUserApplications();
    }
  }, [user, loadAdminData, loadUserApplications]);

  function handleOpenDetail(job) {
    setDetailJob(job);
    const targetUrl = `/jobs/${encodeURIComponent(job.id)}`;
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ jobId: job.id }, '', targetUrl);
    }
  }

  function handleCloseDetail() {
    setDetailJob(null);
    if (window.location.pathname !== '/' || window.location.search) {
      window.history.pushState({}, '', '/');
    }
  }

  async function handleShareJob(job) {
    const shareUrl = getJobShareUrl(job.id);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${job.title} at ${job.company}`,
          text: `Check out this ${job.title} opening (${job.location}) on Jobify`,
          url: shareUrl
        });
        return;
      }
    } catch {
      // User cancelled native share or share unsupported; fall back to clipboard copy
    }
    try {
      await copyToClipboard(shareUrl);
      showToast(`Copied share link for "${job.title}"!`);
    } catch {
      showToast(`Share link: ${shareUrl}`);
    }
  }

  function handleAuthSuccess(token, loggedUser) {
    saveSession(token, loggedUser);
    setUser(loggedUser);
    setAuthModalOpen(false);
    loadJobs();
    showToast(`Signed in as ${loggedUser.name} (${loggedUser.role === 'admin' ? 'Admin' : 'Applicant'})`);

    if (pendingApplyJob) {
      if (loggedUser.role === 'user') {
        setApplyJob(pendingApplyJob);
      } else {
        showToast('Signed in as Admin. Switch to a normal user account to apply for jobs.');
      }
      setPendingApplyJob(null);
    } else if (loggedUser.role === 'admin') {
      setActiveTab('admin');
    }
  }

  function handleLogout() {
    clearSession();
    setUser(null);
    setActiveTab('jobs');
    loadJobs();
    showToast('Signed out.');
  }

  function handleRequestApply(job) {
    handleCloseDetail();
    if (user?.role === 'admin') {
      setPendingApplyJob(job);
      setAuthModalOpen(true);
      showToast('Signed in as Admin — choose "Demo Normal User" or sign in as an applicant to apply.');
      return;
    }
    setApplyJob(job);
  }

  async function handleApplicationSubmitted(_application, token, newUser) {
    setApplyJob(null);
    if (token && newUser) {
      saveSession(token, newUser);
      setUser(newUser);
      showToast('Application submitted! Your tracker account is ready under My Applications.');
    } else {
      showToast('Application submitted! You can track its status in My Applications.');
    }
    await Promise.all([loadJobs(), loadUserApplications()]);
  }

  async function handleWithdrawApplication(appItem) {
    const title = appItem.job ? appItem.job.title : 'this position';
    if (!window.confirm(`Withdraw your application for ${title}?`)) return;
    try {
      await api.withdrawApplication(appItem.id);
      showToast('Application withdrawn.');
      await Promise.all([loadJobs(), loadUserApplications()]);
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handleJobSaved(_savedJob, isEditing) {
    setPostJobTarget(undefined);
    showToast(isEditing ? 'Job opening updated.' : 'New job opening published! Click Share to copy its link.');
    await Promise.all([loadJobs(), loadAdminData()]);
  }

  async function handleToggleJobStatus(job) {
    const nextStatus = job.status === 'Open' ? 'Closed' : 'Open';
    try {
      await api.updateJob(job.id, { status: nextStatus });
      showToast(`Job "${job.title}" marked as ${nextStatus}.`);
      await Promise.all([loadJobs(), loadAdminData()]);
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handleDeleteJob(job) {
    if (!window.confirm(`Delete "${job.title}" and all of its applications?`)) return;
    try {
      await api.deleteJob(job.id);
      showToast(`Deleted "${job.title}".`);
      await Promise.all([loadJobs(), loadAdminData()]);
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handleAdminUpdateApplication(appId, payload) {
    try {
      await api.updateApplicationStatus(appId, payload);
      showToast('Application updated.');
      await loadAdminData();
    } catch (err) {
      showToast(err.message);
    }
  }

  const departments = useMemo(() => {
    const set = new Set(jobs.map((j) => j.department).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return jobs.filter((job) => {
      if (
        q &&
        !job.title.toLowerCase().includes(q) &&
        !job.company.toLowerCase().includes(q) &&
        !job.department.toLowerCase().includes(q) &&
        !job.location.toLowerCase().includes(q) &&
        !job.summary.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (departmentFilter !== 'All' && job.department !== departmentFilter) return false;
      if (workModeFilter !== 'All' && job.workMode !== workModeFilter) return false;
      if (employmentFilter !== 'All' && job.employmentType !== employmentFilter) return false;
      return true;
    });
  }, [jobs, searchQuery, departmentFilter, workModeFilter, employmentFilter]);

  return (
    <div>
      <Navbar
        user={user}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenPostJob={() => setPostJobTarget(null)}
        myAppCount={myApplications.length}
      />

      <main className="container">
        {activeTab === 'jobs' && (
          <>
            <section className="hero-banner">
              <div>
                <div className="hero-eyebrow">
                  <Sparkles size={13} />
                  Open Roles &amp; Live Tracking
                </div>
                <h1 className="hero-title">Find your next role and track every step.</h1>
                <p className="hero-desc">
                  Browse open positions posted by hiring admins, share direct job links, apply in
                  seconds, and follow real-time status updates from submission to offer.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                {!user && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setAuthModalOpen(true)}
                  >
                    Sign In / Try Demo
                  </button>
                )}
                {user?.role === 'user' && (
                  <button
                    type="button"
                    className="btn btn-outline-accent"
                    onClick={() => setActiveTab('my-applications')}
                  >
                    <ClipboardList size={16} />
                    Track My Applications ({myApplications.length})
                  </button>
                )}
                {user?.role === 'admin' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setPostJobTarget(null)}
                  >
                    <Plus size={16} />
                    Post New Job Opening
                  </button>
                )}
              </div>
            </section>

            <section className="filter-bar" aria-label="Filter job openings">
              <div className="input-wrap">
                <Search size={16} className="input-icon" />
                <input
                  className="input with-icon"
                  type="text"
                  placeholder="Search by job title, skill, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="select"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                aria-label="Department filter"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept === 'All' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>

              <select
                className="select"
                value={workModeFilter}
                onChange={(e) => setWorkModeFilter(e.target.value)}
                aria-label="Work mode filter"
              >
                <option value="All">All Work Modes</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>

              <select
                className="select"
                value={employmentFilter}
                onChange={(e) => setEmploymentFilter(e.target.value)}
                aria-label="Employment type filter"
              >
                <option value="All">All Job Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </section>

            <div className="section-header">
              <h2 className="section-title">Open Positions ({filteredJobs.length})</h2>
              {(searchQuery ||
                departmentFilter !== 'All' ||
                workModeFilter !== 'All' ||
                employmentFilter !== 'All') && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setSearchQuery('');
                    setDepartmentFilter('All');
                    setWorkModeFilter('All');
                    setEmploymentFilter('All');
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>

            {loadingJobs ? (
              <div className="empty-state">
                <p>Loading open jobs...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="empty-state">
                <Briefcase size={32} color="var(--primary-600)" />
                <h3>No matching job openings</h3>
                <p>Try adjusting your search or filter criteria.</p>
              </div>
            ) : (
              <div className="jobs-grid">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    user={user}
                    onViewDetails={handleOpenDetail}
                    onApply={handleRequestApply}
                    onShare={handleShareJob}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'my-applications' && user?.role === 'user' && (
          <MyApplications
            applications={myApplications}
            onWithdraw={handleWithdrawApplication}
            onBrowseJobs={() => setActiveTab('jobs')}
          />
        )}

        {activeTab === 'admin' && user?.role === 'admin' && (
          <AdminDashboard
            jobs={adminJobs}
            stats={adminStats}
            allApplications={adminApplications}
            onOpenPostJob={() => setPostJobTarget(null)}
            onEditJob={(job) => setPostJobTarget(job)}
            onToggleJobStatus={handleToggleJobStatus}
            onDeleteJob={handleDeleteJob}
            onInspectApplicants={(job) => setInspectJob(job)}
            onUpdateApplication={handleAdminUpdateApplication}
            onShareJob={handleShareJob}
          />
        )}
      </main>

      {authModalOpen && (
        <AuthModal
          onClose={() => {
            setAuthModalOpen(false);
            setPendingApplyJob(null);
          }}
          onSuccess={handleAuthSuccess}
        />
      )}

      {detailJob && (
        <JobDetailModal
          job={detailJob}
          user={user}
          onClose={handleCloseDetail}
          onApply={handleRequestApply}
          onShare={handleShareJob}
        />
      )}

      {applyJob && (
        <ApplyModal
          job={applyJob}
          user={user}
          onClose={() => setApplyJob(null)}
          onSuccess={handleApplicationSubmitted}
          onSwitchToAuth={() => {
            setPendingApplyJob(applyJob);
            setApplyJob(null);
            setAuthModalOpen(true);
          }}
        />
      )}

      {postJobTarget !== undefined && (
        <PostJobModal
          job={postJobTarget}
          onClose={() => setPostJobTarget(undefined)}
          onSaved={handleJobSaved}
        />
      )}

      {inspectJob && (
        <ApplicantsModal
          job={inspectJob}
          onClose={() => setInspectJob(null)}
          onUpdated={loadAdminData}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}

      <button
        type="button"
        className="theme-toggle-fab"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
      >
        <span className="theme-toggle-dot">
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </span>
        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
      </button>
    </div>
  );
}
