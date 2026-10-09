import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  clearStoredAuth, getStoredToken, getStoredUser, updateStoredTokens,
} from './authStorage';
import { emitToast } from './toastBus';

const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]']);

function apiBaseUrl() {
  const configured = import.meta.env.VITE_API_URL?.trim();
  const value = configured || (import.meta.env.DEV ? 'http://localhost:8080' : '');
  if (!value) throw new Error('VITE_API_URL deve ser configurada no build de produção.');
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('VITE_API_URL deve usar HTTP ou HTTPS.');
  const insecureRemoteProduction = import.meta.env.PROD
    && url.protocol !== 'https:'
    && !loopbackHosts.has(url.hostname);
  if (insecureRemoteProduction) throw new Error('VITE_API_URL deve usar HTTPS fora do ambiente local.');
  return url.toString().replace(/\/$/, '');
}

export const api = axios.create({
  baseURL: apiBaseUrl(),
  withCredentials: true,
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };
let refreshPromise: Promise<string> | null = null;
function authEndpoint(url?: string) {
  // /auth/me requires the current session, including renewal after a page reload.
  const path = url?.split('?')[0];
  return Boolean(path?.includes('/auth/')) && !path?.endsWith('/auth/me');
}

async function refreshAccessToken() {
  // If no user is stored, we don't have a session to refresh
  if (!getStoredUser()) throw new Error('Sessão sem renovação');
  
  const response = await axios.post<{ token: string }>(
    `${apiBaseUrl()}/auth/refresh`,
    {},
    {
      withCredentials: true,
      headers: { 'X-Correlation-ID': crypto.randomUUID() },
    }
  );
  
  updateStoredTokens(response.data.token);
  return response.data.token;
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token && !authEndpoint(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use((response) => response, async (reason: AxiosError<{ message?: string }>) => {
  const status = reason.response?.status;
  const config = reason.config as RetryConfig | undefined;
  
  // Try to refresh if we get a 401, we haven't retried yet, and we are not an auth endpoint, and we think we have a session
  if (status === 401 && config && !config._retry && !authEndpoint(config.url) && getStoredUser()) {
    config._retry = true;
    try {
      refreshPromise ??= refreshAccessToken().finally(() => { refreshPromise = null; });
      const token = await refreshPromise;
      config.headers.Authorization = `Bearer ${token}`;
      return api(config);
    } catch {
      clearStoredAuth();
      if (window.location.pathname !== '/login') window.location.assign('/login');
      return Promise.reject(reason);
    }
  }
  
  if (status === 401 && !authEndpoint(config?.url)) {
    clearStoredAuth();
    if (window.location.pathname !== '/login') window.location.assign('/login');
  }
  
  const message = reason.response?.data?.message || reason.message || 'Erro inesperado. Tente novamente mais tarde.';
  emitToast(message, 'error');
  return Promise.reject(reason);
});
