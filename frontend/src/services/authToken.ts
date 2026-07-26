import { api } from './api';
import { getStoredToken } from './authStorage';

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  config.headers['X-Correlation-ID'] = crypto.randomUUID();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
