import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300_000, // 5 minutes — AI processing can take 60-90s
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Store a reference to Clerk's getToken function.
 * This lets us fetch a FRESH token before every request,
 * eliminating the token-expiration problem during long AI calls.
 */
let _getToken: (() => Promise<string | null>) | null = null;

/**
 * Register Clerk's getToken so the request interceptor can use it.
 * Called once from AuthSync on mount.
 */
export function registerTokenProvider(getToken: () => Promise<string | null>) {
  _getToken = getToken;
}

/**
 * Clear the token provider on sign-out.
 */
export function clearTokenProvider() {
  _getToken = null;
  delete api.defaults.headers.common['Authorization'];
}

/**
 * Legacy setter — kept for compatibility but the interceptor is preferred.
 */
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

// ── Request interceptor: get a FRESH token before every request ──
api.interceptors.request.use(
  async (config) => {
    if (_getToken) {
      try {
        const token = await _getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.warn('[API] Failed to get fresh token:', err);
        // Fall through — use whatever's in defaults
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor for error handling ──
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Something went wrong';

    if (error.response?.status === 401) {
      console.warn('[API] 401 — token expired or invalid');
    }

    return Promise.reject(new Error(message));
  }
);

// ─── Resume API ──────────────────────────────────────────────

export const resumeApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  tailor: (data: { resumeText?: string; resumeId?: string; jdText: string; company?: string; jobTitle?: string }) =>
    api.post('/resume/tailor', data),

  getById: (id: string) => api.get(`/resume/${id}`),

  getHistory: (page = 1, limit = 20) =>
    api.get('/resume/history', { params: { page, limit } }),

  regenerate: (id: string, jdText: string) =>
    api.post(`/resume/${id}/regenerate`, { jdText }),

  download: (id: string, template: string) =>
    api.get(`/resume/${id}/download/${template}`, { responseType: 'blob' }),

  downloadATSReport: (id: string) =>
    api.get(`/resume/${id}/ats-report`, { responseType: 'blob' }),

  patch: (id: string, data: any) =>
    api.patch(`/resume/${id}`, data),

  delete: (id: string) => api.delete(`/resume/${id}`),
};

// ─── Job API ─────────────────────────────────────────────────

export const jobApi = {
  create: (data: { company: string; jobTitle: string; jdRaw: string; applicationUrl?: string; notes?: string }) =>
    api.post('/jobs', data),

  list: (page = 1, limit = 20, status?: string) =>
    api.get('/jobs', { params: { page, limit, status } }),

  getById: (id: string) => api.get(`/jobs/${id}`),

  updateStatus: (id: string, data: { applicationStatus: string; notes?: string }) =>
    api.patch(`/jobs/${id}/status`, data),

  update: (id: string, data: any) =>
    api.patch(`/jobs/${id}`, data),

  delete: (id: string) => api.delete(`/jobs/${id}`),

  getStats: () => api.get('/jobs/stats'),
};

// ─── Cover Letter API ────────────────────────────────────────

export const coverLetterApi = {
  generate: (data: {
    resumeId?: string;
    jobId?: string;
    resumeText?: string;
    jdText?: string;
    company?: string;
    jobTitle?: string;
    tone?: string;
  }) => api.post('/cover-letter/generate', data),

  update: (id: string, content: string) =>
    api.patch(`/cover-letter/${id}`, { content }),

  list: () => api.get('/cover-letter'),

  getById: (id: string) => api.get(`/cover-letter/${id}`),

  download: (id: string) =>
    api.get(`/cover-letter/${id}/download`, { responseType: 'blob' }),

  delete: (id: string) => api.delete(`/cover-letter/${id}`),
};

// ─── ATS API ─────────────────────────────────────────────────

export const atsApi = {
  getScore: (resumeId: string) => api.get(`/ats/score/${resumeId}`),

  getDashboardStats: () => api.get('/ats/dashboard-stats'),
};
