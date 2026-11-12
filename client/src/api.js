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

  applyToJob: (jobId, formData) =>
    request(`/jobs/${jobId}/apply`, {
      method: 'POST',
      body: formData
    }),

  getMyApplications: () => request('/my-applications'),

  withdrawApplication: (id) =>
    request(`/applications/${id}`, {
      method: 'DELETE'
    }),

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

  getResumeDownloadUrl: (applicationId) => {
    const token = getStoredToken();
    return `/api/applications/${applicationId}/resume?token=${encodeURIComponent(token)}`;
  }
};

