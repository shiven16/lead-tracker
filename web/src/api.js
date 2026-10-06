import axios from 'axios';

const api = axios.create({
  withCredentials: true,
  baseURL: import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api`
    : '/api',
});

export const getSession = () => api.get('/auth/session').then(res => res.data);
export const login = (credentials) => api.post('/auth/login', credentials).then(res => res.data);
export const logout = () => api.post('/auth/logout');
export const getJobs = (params) => api.get('/jobs', { params }).then(res => res.data);
export const getSummary = () => api.get('/summary').then(res => res.data);
export const getCallToday = () => api.get('/call-today').then(res => res.data);
export const createJob = (data) => api.post('/jobs', data).then(res => res.data);
export const updateJob = (id, data) => api.patch(`/jobs/${id}`, data).then(res => res.data);
export const addContact = (id, data) => api.post(`/jobs/${id}/contact`, data).then(res => res.data);

export default api;
