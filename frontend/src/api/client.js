import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('skinora_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global 401 → redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('skinora_token');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;
