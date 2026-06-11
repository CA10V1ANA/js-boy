import { api } from './api';

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jsboy.token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

