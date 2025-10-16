import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) =>
    api.post('/auth/register', data),
};

export const dealersAPI = {
  getAll: () => api.get('/dealers'),
  getById: (id: string) => api.get(`/dealers/${id}`),
  create: (data: any) => api.post('/dealers', data),
  update: (id: string, data: any) => api.put(`/dealers/${id}`, data),
};

export const techniciansAPI = {
  getAll: () => api.get('/technicians'),
  getById: (id: string) => api.get(`/technicians/${id}`),
  create: (data: any) => api.post('/technicians', data),
  update: (id: string, data: any) => api.put(`/technicians/${id}`, data),
};

export const claimsAPI = {
  getAll: (params?: any) => api.get('/claims', { params }),
  getById: (id: string) => api.get(`/claims/${id}`),
  create: (data: any) => api.post('/claims', data),
  update: (id: string, data: any) => api.put(`/claims/${id}`, data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/claims/${id}/status`, { status }),
};

export const repositoryAPI = {
  getAll: (params?: any) => api.get('/repository', { params }),
  getById: (id: string) => api.get(`/repository/${id}`),
};

export const ordersAPI = {
  getAll: (params?: any) => api.get('/orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  update: (id: string, data: any) => api.put(`/orders/${id}`, data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
};

export default api;
