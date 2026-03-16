import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Attach admin JWT to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response normalizer
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const msg = error.response?.data?.message || error.message || 'Network error';
    return Promise.reject(new Error(msg));
  }
);

// ─── Public ───────────────────────────────────────────────────────────
export const submitReport = (formData) =>
  api.post('/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getReportStatus = (anonId) =>
  api.get(`/reports/status/${anonId}`);

// ─── Admin ────────────────────────────────────────────────────────────
export const adminLogin = (credentials) =>
  api.post('/auth/login', credentials);

export const seedAdmin = () =>
  api.post('/admin/seed');

export const getAdminReports = (params) =>
  api.get('/admin/reports', { params });

export const getAdminReport = (id) =>
  api.get(`/admin/reports/${id}`);

export const updateReportStatus = (id, data) =>
  api.put(`/admin/reports/${id}`, data);

export const getAnalytics = () =>
  api.get('/admin/analytics');

export const exportPDF = (params) =>
  axios.get(`${API_BASE}/admin/reports/export/pdf`, {
    params,
    responseType: 'blob',
    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
  });

export default api;
