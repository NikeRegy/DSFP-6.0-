import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Plus,
  ClipboardList,
  Briefcase,
  Sun,
  Moon,
  Bookmark,
  Bell,
  Video,
  FileText,
  CalendarDays,
  BarChart3,
  UserCheck,
  ShieldCheck,
  ArrowUpDown
} from 'lucide-react';
import { api, getStoredUser, getStoredToken, saveSession, clearSession } from './api';
import { getJobShareUrl, copyToClipboard } from './utils';

// Core Navigation & Components
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import JobCard from './components/JobCard';
import JobDetailModal from './components/JobDetailModal';
import ApplyModal from './components/ApplyModal';
import MyApplications from './components/MyApplications';
import ApplicationDetailModal from './components/ApplicationDetailModal';
import SaveJobModal from './components/SaveJobModal';
import ReportJobModal from './components/ReportJobModal';
import MatchModal from './components/MatchModal';
import SavedJobs from './components/SavedJobs';
import DashboardOverview from './components/DashboardOverview';
import RemindersView from './components/RemindersView';
import ReminderModal from './components/ReminderModal';
import DocumentsView from './components/DocumentsView';
import UploadDocModal from './components/UploadDocModal';
import InterviewsView from './components/InterviewsView';
import ScheduleInterviewModal from './components/ScheduleInterviewModal';
import CalendarView from './components/CalendarView';
import AnalyticsView from './components/AnalyticsView';
import CareerProfileView from './components/CareerProfileView';
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
  const [activeTab, setActiveTab] = useState(() => (getStoredUser()?.role === 'user' ? 'dashboard' : 'jobs'));
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('jobify_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('jobify_theme', theme);
  }, [theme]);

  // Job discovery state & filters
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [workModeFilter, setWorkModeFilter] = useState('All');
  const [employmentFilter, setEmploymentFilter] = useState('All');
  const [experienceFilter, setExperienceFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // User state entities
  const [myApplications, setMyApplications] = useState([]);
  const [showArchivedApps, setShowArchivedApps] = useState(false);
  const [savedJobs, setSavedJobs] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [dashboardOverview, setDashboardOverview] = useState(null);
  const [dashboardRange, setDashboardRange] = useState('all');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsRange, setAnalyticsRange] = useState('all');
  const [profile, setProfile] = useState(null);

  // Admin state entities
  const [adminJobs, setAdminJobs] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [adminApplications, setAdminApplications] = useState([]);
  const [adminReports, setAdminReports] = useState([]);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingApplyJob, setPendingApplyJob] = useState(null);
  const [detailJob, setDetailJob] = useState(null);
  const [applyJob, setApplyJob] = useState(null);
  const [postJobTarget, setPostJobTarget] = useState(undefined);
  const [inspectJob, setInspectJob] = useState(null);
  const [inspectAppItem, setInspectAppItem] = useState(null);
  const [saveJobTarget, setSaveJobTarget] = useState(null);
  const [reportJobTarget, setReportJobTarget] = useState(null);
  const [matchJobTarget, setMatchJobTarget] = useState(null);
  const [reminderModalTarget, setReminderModalTarget] = useState(undefined); // undefined = closed, null = new, object = edit
  const [uploadDocModalOpen, setUploadDocModalOpen] = useState(false);
  const [interviewModalTarget, setInterviewModalTarget] = useState(undefined); // undefined = closed, null = new, object = edit
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Loaders
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

  const loadUserApplications = useCallback(async (archived = false) => {
    try {
      const res = await api.getMyApplications({ archived: archived ? '1' : '0' });
      setMyApplications(res.applications || []);
    } catch {
      // ignore if unauthenticated
    }
  }, []);

  const loadSavedJobs = useCallback(async () => {
    try {
      const res = await api.getSavedJobs();
      setSavedJobs(res.savedJobs || []);
    } catch {
      // ignore
    }
  }, []);

  const loadReminders = useCallback(async () => {
    try {
      const res = await api.getReminders();
      setReminders(res.reminders || []);
    } catch {
      // ignore
    }
  }, []);

  const loadDocuments = useCallback(async () => {
    try {
      const res = await api.getDocuments();
      setDocuments(res.documents || []);
    } catch {
      // ignore
    }
  }, []);

  const loadInterviews = useCallback(async () => {
    try {
      const res = await api.getInterviews();
      setInterviews(res.interviews || []);
    } catch {
      // ignore
    }
  }, []);

  const loadCalendarEvents = useCallback(async () => {
    try {
      const res = await api.getCalendarEvents();
      setCalendarEvents(res.events || []);
    } catch {
      // ignore
    }
  }, []);

  const loadDashboardOverview = useCallback(async (range = 'all') => {
    try {
      const res = await api.getDashboardOverview(range);
      setDashboardOverview(res.overview || null);
    } catch {
      // ignore
    }
  }, []);

  const loadAnalytics = useCallback(async (range = 'all') => {
    try {
      const res = await api.getAnalytics(range);
      setAnalyticsData(res.analytics || null);
    } catch {
      // ignore
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const res = await api.getProfile();
      setProfile(res.profile || null);
    } catch {
      // ignore
    }
  }, []);

  const loadAdminData = useCallback(async () => {
    try {
      const [jobsRes, statsRes, appsRes, reportsRes] = await Promise.all([
        api.getJobs({ includeAll: '1' }),
        api.getAdminStats(),
        api.getAdminApplications(),
        api.getAdminReports()
      ]);
      setAdminJobs(jobsRes.jobs || []);
      setAdminStats(statsRes.stats || null);
      setAdminApplications(appsRes.applications || []);
      setAdminReports(reportsRes.reports || []);
    } catch (err) {
      showToast(err.message);
    }
  }, [showToast]);

  const refreshAllUserData = useCallback(async () => {
    if (!user || user.role !== 'user') return;
    await Promise.all([
      loadUserApplications(showArchivedApps),
      loadSavedJobs(),
      loadReminders(),
      loadDocuments(),
      loadInterviews(),
      loadCalendarEvents(),
      loadDashboardOverview(dashboardRange),
      loadAnalytics(analyticsRange),
      loadProfile()
    ]);
  }, [
    user,
    showArchivedApps,
    dashboardRange,
    analyticsRange,
    loadUserApplications,
    loadSavedJobs,
    loadReminders,
    loadDocuments,
    loadInterviews,
    loadCalendarEvents,
    loadDashboardOverview,
    loadAnalytics,
    loadProfile
  ]);

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

  // Initialize session & deep linking
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

  // Load data according to role
  useEffect(() => {
    if (!user) {
      setMyApplications([]);
      setSavedJobs([]);
      setReminders([]);
      setDocuments([]);
      setInterviews([]);
      setCalendarEvents([]);
      setDashboardOverview(null);
      setAnalyticsData(null);
      setProfile(null);
      setAdminJobs([]);
      setAdminStats(null);
      setAdminApplications([]);
      setAdminReports([]);
      return;
    }
    if (user.role === 'admin') {
      loadAdminData();
    } else {
      refreshAllUserData();
    }
  }, [user, loadAdminData, refreshAllUserData]);

  // Re-fetch overview when date range changes
  useEffect(() => {
    if (user?.role === 'user') {
      loadDashboardOverview(dashboardRange);
    }
  }, [user, dashboardRange, loadDashboardOverview]);

  // Re-fetch analytics when range changes
  useEffect(() => {
    if (user?.role === 'user') {
      loadAnalytics(analyticsRange);
    }
  }, [user, analyticsRange, loadAnalytics]);

  // Handlers
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
      // fallback
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
        showToast('Signed in as Admin. Switch to a normal applicant account to apply for jobs.');
      }
      setPendingApplyJob(null);
    } else if (loggedUser.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('dashboard');
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
      showToast('Signed in as Admin — choose "Demo Normal User" to apply as an applicant.');
      return;
    }
    setApplyJob(job);
  }

  async function handleApplicationSubmitted(_application, token, newUser) {
    setApplyJob(null);
    if (token && newUser) {
      saveSession(token, newUser);
      setUser(newUser);
      showToast('Application submitted! Your tracker account is ready.');
    } else {
      showToast('Application submitted! Track its progress under Applications.');
    }
    await Promise.all([loadJobs(), refreshAllUserData()]);
  }

  async function handleWithdrawApplication(appItem) {
    const title = appItem.job ? appItem.job.title : 'this position';
    if (!window.confirm(`Withdraw your application for ${title}?`)) return;
    try {
      await api.withdrawApplication(appItem.id);
      showToast('Application withdrawn.');
      await Promise.all([loadJobs(), refreshAllUserData()]);
    } catch (err) {
      showToast(err.message);
    }
  }

  // Saved Jobs
  function handleOpenSaveJob(job) {
    if (!user) {
      setAuthModalOpen(true);
      showToast('Sign in to save and organize job vacancies.');
      return;
    }
    const existing = savedJobs.find((s) => s.jobId === job.id);
    setSaveJobTarget({ job, existing });
  }

  async function handleSavedJobDone() {
    setSaveJobTarget(null);
    showToast('Saved opportunities updated.');
    await Promise.all([loadJobs(), loadSavedJobs(), loadDashboardOverview(dashboardRange)]);
  }

  async function handleRemoveSaved(savedId) {
    try {
      await api.deleteSavedJob(savedId);
      showToast('Saved opportunity removed.');
      await Promise.all([loadJobs(), loadSavedJobs(), loadDashboardOverview(dashboardRange)]);
    } catch (err) {
      showToast(err.message);
    }
  }

  // Reminders
  async function handleSaveReminder(payload) {
    if (reminderModalTarget?.id) {
      await api.updateReminder(reminderModalTarget.id, payload);
      showToast('Reminder rescheduled.');
    } else {
      await api.createReminder(payload);
      showToast('New follow-up reminder set.');
    }
    setReminderModalTarget(undefined);
    await Promise.all([loadReminders(), loadDashboardOverview(dashboardRange), loadCalendarEvents()]);
  }

  async function handleToggleCompleteReminder(rem) {
    try {
      await api.updateReminder(rem.id, { completed: !rem.completed });
      showToast(rem.completed ? 'Reminder marked incomplete.' : 'Reminder completed!');
      await Promise.all([loadReminders(), loadDashboardOverview(dashboardRange)]);
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handleDeleteReminder(remId) {
    try {
      await api.deleteReminder(remId);
      showToast('Reminder deleted.');
      await Promise.all([loadReminders(), loadDashboardOverview(dashboardRange), loadCalendarEvents()]);
    } catch (err) {
      showToast(err.message);
    }
  }

  // Documents
  async function handleUploadDoc(formData) {
    await api.uploadDocument(formData);
    showToast('Document uploaded to your Document Hub.');
    setUploadDocModalOpen(false);
    await loadDocuments();
  }

  async function handleUpdateDoc(docId, payload) {
    try {
      await api.updateDocument(docId, payload);
      showToast('Document details updated.');
      await loadDocuments();
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handleDeleteDoc(docId) {
    if (!window.confirm('Delete this document? Applications already submitted will retain their copy.')) return;
    try {
      await api.deleteDocument(docId);
      showToast('Document removed.');
      await loadDocuments();
    } catch (err) {
      showToast(err.message);
    }
  }

  // Interviews
  async function handleSaveInterview(payload) {
    if (interviewModalTarget?.id) {
      await api.updateInterview(interviewModalTarget.id, payload);
      showToast('Interview details updated.');
    } else {
      await api.createInterview(payload);
      showToast('Interview recorded successfully.');
    }
    setInterviewModalTarget(undefined);
    await Promise.all([loadInterviews(), loadDashboardOverview(dashboardRange), loadCalendarEvents()]);
  }

  async function handleUpdateInterview(interviewId, payload) {
    try {
      await api.updateInterview(interviewId, payload);
      showToast('Interview updated.');
      await Promise.all([loadInterviews(), loadDashboardOverview(dashboardRange)]);
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handleDeleteInterview(interviewId) {
    if (!window.confirm('Delete this interview record?')) return;
    try {
      await api.deleteInterview(interviewId);
      showToast('Interview deleted.');
      await Promise.all([loadInterviews(), loadDashboardOverview(dashboardRange), loadCalendarEvents()]);
    } catch (err) {
      showToast(err.message);
    }
  }

  // Profile
  async function handleSaveProfile(payload) {
    const res = await api.updateProfile(payload);
    setProfile(res.profile);
    showToast('Career profile and preferences updated.');
  }

  // Admin Actions
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
    if (!window.confirm(`Delete "${job.title}" and all associated applications?`)) return;
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

  async function handleUpdateAdminReport(reportId, payload) {
    try {
      await api.updateAdminReport(reportId, payload);
      showToast('Report updated.');
      await loadAdminData();
    } catch (err) {
      showToast(err.message);
    }
  }

  // Discovery Filter Options
  const departments = useMemo(() => {
    const set = new Set(jobs.map((j) => j.department).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = jobs.filter((job) => {
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
      if (experienceFilter !== 'All' && job.experienceLevel !== experienceFilter) return false;
      return true;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'salary') return (b.salaryMax || 0) - (a.salaryMax || 0);
      if (sortBy === 'deadline') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      }
      return 0;
    });

    return list;
  }, [jobs, searchQuery, departmentFilter, workModeFilter, employmentFilter, experienceFilter, sortBy]);

  const pendingRemindersCount = useMemo(() => {
    return reminders.filter((r) => !r.completed).length;
  }, [reminders]);

  const upcomingInterviewsCount = useMemo(() => {
    const now = new Date();
    return interviews.filter((i) => i.status === 'Scheduled' && new Date(i.interviewDate) >= now).length;
  }, [interviews]);

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
        savedCount={savedJobs.length}
        remindersDueCount={pendingRemindersCount}
        interviewsCount={upcomingInterviewsCount}
      />

      <main className="container" style={{ paddingBottom: '3.5rem' }}>
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && user?.role === 'user' && (
          <DashboardOverview
            overview={dashboardOverview}
            range={dashboardRange}
            onRangeChange={setDashboardRange}
            onSelectTab={setActiveTab}
            onViewJob={handleOpenDetail}
            onInspectApplication={async (appItem) => {
              try {
                const res = await api.getApplication(appItem.id);
                setInspectAppItem(res.application);
              } catch {
                setInspectAppItem(appItem);
              }
            }}
          />
        )}

        {/* TAB 2: JOB OPENINGS / DISCOVERY */}
        {activeTab === 'jobs' && (
          <>
            <section className="hero-banner">
              <div>
                <div className="hero-eyebrow">
                  <Sparkles size={13} />
                  Career Opportunities &amp; Intelligence Hub
                </div>
                <h1 className="hero-title">Find your next role and track every milestone.</h1>
                <p className="hero-desc">
                  Explore verified vacancies, bookmark priority roles, run instant AI job-fit
                  assessments, and manage your entire application lifecycle from submission to offer.
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
                  <>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setActiveTab('dashboard')}
                    >
                      View Live Dashboard
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-accent"
                      onClick={() => setActiveTab('my-applications')}
                    >
                      <ClipboardList size={16} />
                      Track Applications ({myApplications.length})
                    </button>
                  </>
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
              <div className="input-wrap" style={{ flex: '1 1 240px' }}>
                <Search size={16} className="input-icon" />
                <input
                  className="input with-icon"
                  type="text"
                  placeholder="Search title, company, skills, location..."
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

              <select
                className="select"
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
                aria-label="Experience level filter"
              >
                <option value="All">All Experience</option>
                <option value="Entry">Entry Level</option>
                <option value="Junior">Junior</option>
                <option value="Mid">Mid Level</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead / Executive</option>
              </select>

              <select
                className="select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort by"
              >
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="salary">Sort: Highest Salary</option>
                <option value="deadline">Sort: Closing Soonest</option>
              </select>
            </section>

            <div className="section-header">
              <h2 className="section-title">Open Positions ({filteredJobs.length})</h2>
              {(searchQuery ||
                departmentFilter !== 'All' ||
                workModeFilter !== 'All' ||
                employmentFilter !== 'All' ||
                experienceFilter !== 'All' ||
                sortBy !== 'newest') && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setSearchQuery('');
                    setDepartmentFilter('All');
                    setWorkModeFilter('All');
                    setEmploymentFilter('All');
                    setExperienceFilter('All');
                    setSortBy('newest');
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>

            {loadingJobs ? (
              <div className="empty-state">
                <p>Loading open vacancies...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="empty-state">
                <Briefcase size={36} color="var(--primary-600)" />
                <h3>No matching job openings</h3>
                <p>Try broadening your search query or resetting filters.</p>
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
                    onSave={() => handleOpenSaveJob(job)}
                    onMatch={() => setMatchJobTarget(job)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* TAB 3: MY APPLICATIONS */}
        {activeTab === 'my-applications' && user?.role === 'user' && (
          <MyApplications
            applications={myApplications}
            onInspectApplication={async (appItem) => {
              try {
                const res = await api.getApplication(appItem.id);
                setInspectAppItem(res.application);
              } catch {
                setInspectAppItem(appItem);
              }
            }}
            onWithdraw={handleWithdrawApplication}
            onBrowseJobs={() => setActiveTab('jobs')}
            showArchived={showArchivedApps}
            onToggleArchived={(val) => {
              setShowArchivedApps(val);
              loadUserApplications(val);
            }}
          />
        )}

        {/* TAB 4: SAVED JOBS */}
        {activeTab === 'saved-jobs' && user?.role === 'user' && (
          <SavedJobs
            savedJobs={savedJobs}
            onEditSaved={(saved) => setSaveJobTarget({ job: saved.job, existing: saved })}
            onRemoveSaved={handleRemoveSaved}
            onApplyJob={handleRequestApply}
            onViewJob={handleOpenDetail}
            onBrowseJobs={() => setActiveTab('jobs')}
          />
        )}

        {/* TAB 5: INTERVIEW HUB */}
        {activeTab === 'interviews' && user?.role === 'user' && (
          <InterviewsView
            interviews={interviews}
            applications={myApplications}
            onNewInterview={() => setInterviewModalTarget(null)}
            onEditInterview={(item) => setInterviewModalTarget(item)}
            onUpdateInterview={handleUpdateInterview}
            onDeleteInterview={handleDeleteInterview}
            onViewApplication={async (appId) => {
              try {
                const res = await api.getApplication(appId);
                setInspectAppItem(res.application);
              } catch {
                showToast('Could not load application details');
              }
            }}
          />
        )}

        {/* TAB 6: FOLLOW-UP REMINDERS */}
        {activeTab === 'reminders' && user?.role === 'user' && (
          <RemindersView
            reminders={reminders}
            applications={myApplications}
            onNewReminder={() => setReminderModalTarget(null)}
            onToggleComplete={handleToggleCompleteReminder}
            onReschedule={(rem) => setReminderModalTarget(rem)}
            onDeleteReminder={handleDeleteReminder}
            onViewApplication={async (appId) => {
              try {
                const res = await api.getApplication(appId);
                setInspectAppItem(res.application);
              } catch {
                showToast('Could not load application record');
              }
            }}
          />
        )}

        {/* TAB 7: DOCUMENTS & CV HUB */}
        {activeTab === 'documents' && user?.role === 'user' && (
          <DocumentsView
            documents={documents}
            onUploadClick={() => setUploadDocModalOpen(true)}
            onDeleteDoc={handleDeleteDoc}
            onUpdateDoc={handleUpdateDoc}
          />
        )}

        {/* TAB 8: CALENDAR */}
        {activeTab === 'calendar' && user?.role === 'user' && (
          <CalendarView
            events={calendarEvents}
            onViewApplication={async (appId) => {
              try {
                const res = await api.getApplication(appId);
                setInspectAppItem(res.application);
              } catch {
                showToast('Could not load application details');
              }
            }}
            onViewJob={handleOpenDetail}
          />
        )}

        {/* TAB 9: ANALYTICS & INSIGHTS */}
        {activeTab === 'analytics' && user?.role === 'user' && (
          <AnalyticsView
            analytics={analyticsData}
            range={analyticsRange}
            onRangeChange={setAnalyticsRange}
          />
        )}

        {/* TAB 10: CAREER PROFILE */}
        {activeTab === 'profile' && user?.role === 'user' && (
          <CareerProfileView
            profile={profile}
            onSaveProfile={handleSaveProfile}
            showToast={showToast}
          />
        )}

        {/* TAB 11: ADMIN PORTAL */}
        {activeTab === 'admin' && user?.role === 'admin' && (
          <AdminDashboard
            jobs={adminJobs}
            stats={adminStats}
            allApplications={adminApplications}
            reports={adminReports}
            onOpenPostJob={() => setPostJobTarget(null)}
            onEditJob={(job) => setPostJobTarget(job)}
            onToggleJobStatus={handleToggleJobStatus}
            onDeleteJob={handleDeleteJob}
            onInspectApplicants={(job) => setInspectJob(job)}
            onUpdateApplication={handleAdminUpdateApplication}
            onUpdateReport={handleUpdateAdminReport}
            onShareJob={handleShareJob}
          />
        )}
      </main>

      {/* ALL MODALS */}
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
          onSave={() => handleOpenSaveJob(detailJob)}
          onMatch={() => setMatchJobTarget(detailJob)}
          onReport={() => setReportJobTarget(detailJob)}
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

      {inspectAppItem && (
        <ApplicationDetailModal
          application={inspectAppItem}
          onClose={() => setInspectAppItem(null)}
          onUpdated={async () => {
            await refreshAllUserData();
            const res = await api.getApplication(inspectAppItem.id);
            setInspectAppItem(res.application);
          }}
          onWithdraw={async (app) => {
            setInspectAppItem(null);
            await handleWithdrawApplication(app);
          }}
        />
      )}

      {saveJobTarget && (
        <SaveJobModal
          job={saveJobTarget.job}
          initialSaved={saveJobTarget.existing}
          onClose={() => setSaveJobTarget(null)}
          onSaved={handleSavedJobDone}
        />
      )}

      {reportJobTarget && (
        <ReportJobModal
          job={reportJobTarget}
          onClose={() => setReportJobTarget(null)}
          onSuccess={(msg) => {
            setReportJobTarget(null);
            showToast(msg || 'Thank you. Our moderation team will review this vacancy.');
          }}
        />
      )}

      {matchJobTarget && (
        <MatchModal
          job={matchJobTarget}
          onClose={() => setMatchJobTarget(null)}
          onApply={(job) => {
            setMatchJobTarget(null);
            handleRequestApply(job);
          }}
          onOpenProfile={() => {
            setMatchJobTarget(null);
            setActiveTab('profile');
          }}
        />
      )}

      {reminderModalTarget !== undefined && (
        <ReminderModal
          applications={myApplications}
          initialReminder={reminderModalTarget}
          onClose={() => setReminderModalTarget(undefined)}
          onSave={handleSaveReminder}
        />
      )}

      {uploadDocModalOpen && (
        <UploadDocModal
          onClose={() => setUploadDocModalOpen(false)}
          onUpload={handleUploadDoc}
        />
      )}

      {interviewModalTarget !== undefined && (
        <ScheduleInterviewModal
          applications={myApplications}
          initialInterview={interviewModalTarget}
          onClose={() => setInterviewModalTarget(undefined)}
          onSave={handleSaveInterview}
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
