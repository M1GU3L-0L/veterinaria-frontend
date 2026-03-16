import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

// ⚠️ Usar sessionStorage — igual que AuthContext
api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token');
  console.log('Token en sessionStorage:', token);
  console.log('URL:', config.url);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    console.error('API Error:', err.response?.status, err.config?.url);
    return Promise.reject(err);
  }
);

export default api;