const TOKEN_KEY = 'jobify_token';
const USER_KEY = 'jobify_user';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(path, options = {}) {
  const token = getStoredToken();
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`/api${path}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  me: () => request('/auth/me'),

  // Profile
  getProfile: () => request('/profile'),
  updateProfile: (payload) =>
    request('/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  // Jobs
  getJobs: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v);
    });
    const str = qs.toString();
    return request(`/jobs${str ? `?${str}` : ''}`);
  },

  getJob: (id) => request(`/jobs/${encodeURIComponent(id)}`),

  createJob: (payload) =>
    request('/jobs', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateJob: (id, payload) =>
    request(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteJob: (id) =>
    request(`/jobs/${id}`, {
      method: 'DELETE'
    }),

  reportJob: (jobId, payload) =>
    request(`/jobs/${jobId}/report`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Saved Jobs
  getSavedJobs: () => request('/saved-jobs'),
  saveJob: (payload) =>
    request('/saved-jobs', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateSavedJob: (id, payload) =>
    request(`/saved-jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  deleteSavedJob: (id) =>
    request(`/saved-jobs/${id}`, {
      method: 'DELETE'
    }),

  // Applications
  applyToJob: (jobId, formData) =>
    request(`/jobs/${jobId}/apply`, {
      method: 'POST',
      body: formData
    }),

  getMyApplications: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v);
    });
    const str = qs.toString();
    return request(`/my-applications${str ? `?${str}` : ''}`);
  },

  getApplication: (id) => request(`/applications/${id}`),

  updateApplication: (id, payload) =>
    request(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  addTimelineEvent: (id, payload) =>
    request(`/applications/${id}/timeline`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  toggleArchiveApplication: (id) =>
    request(`/applications/${id}/archive`, {
      method: 'PATCH'
    }),

  withdrawApplication: (id) =>
    request(`/applications/${id}`, {
      method: 'DELETE'
    }),

  getResumeDownloadUrl: (applicationId) => {
    const token = getStoredToken();
    return `/api/applications/${applicationId}/resume?token=${encodeURIComponent(token)}`;
  },

  // Reminders
  getReminders: () => request('/reminders'),
  createReminder: (payload) =>
    request('/reminders', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateReminder: (id, payload) =>
    request(`/reminders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  deleteReminder: (id) =>
    request(`/reminders/${id}`, {
      method: 'DELETE'
    }),

  // Documents
  getDocuments: () => request('/documents'),
  uploadDocument: (formData) =>
    request('/documents', {
      method: 'POST',
      body: formData
    }),
  updateDocument: (id, payload) =>
    request(`/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  deleteDocument: (id) =>
    request(`/documents/${id}`, {
      method: 'DELETE'
    }),
  getDocumentDownloadUrl: (docId) => {
    const token = getStoredToken();
    return `/api/documents/${docId}/download?token=${encodeURIComponent(token)}`;
  },

  // Interviews
  getInterviews: () => request('/interviews'),
  createInterview: (payload) =>
    request('/interviews', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateInterview: (id, payload) =>
    request(`/interviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  deleteInterview: (id) =>
    request(`/interviews/${id}`, {
      method: 'DELETE'
    }),

  // Calendar & Dashboard
  getCalendarEvents: () => request('/calendar/events'),
  getDashboardOverview: (range = 'all') => request(`/dashboard/overview?range=${range}`),

  // Analytics
  getAnalytics: (range = 'all') => request(`/analytics?range=${range}`),

  // AI Matching
  matchJob: (jobId) =>
    request(`/match-job/${jobId}`, {
      method: 'POST'
    }),

  // Admin
  getAdminStats: () => request('/admin/stats'),
  getAdminApplications: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v);
    });
    const str = qs.toString();
    return request(`/admin/applications${str ? `?${str}` : ''}`);
  },
  updateApplicationStatus: (id, payload) =>
    request(`/admin/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  getAdminReports: () => request('/admin/reports'),
  updateAdminReport: (id, payload) =>
    request(`/admin/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),

  // Export URLs
  getApplicationsExportUrl: () => {
    const token = getStoredToken();
    return `/api/export/applications?token=${encodeURIComponent(token)}`;
  },
  getSavedJobsExportUrl: () => {
    const token = getStoredToken();
    return `/api/export/saved-jobs?token=${encodeURIComponent(token)}`;
  }
};
