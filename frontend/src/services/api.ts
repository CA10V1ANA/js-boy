import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  clearStoredAuth, getStoredRefreshToken, getStoredToken, updateStoredTokens,
} from './authStorage';
import { emitToast } from './toastBus';

function apiBaseUrl() {
  const configured = import.meta.env.VITE_API_URL?.trim();
  const value = configured || (import.meta.env.DEV ? 'http://localhost:8080' : '');
  if (!value) throw new Error('VITE_API_URL deve ser configurada no build de produção.');
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('VITE_API_URL deve usar HTTP ou HTTPS.');
  if (import.meta.env.PROD && url.protocol !== 'https:') throw new Error('VITE_API_URL deve usar HTTPS em produção.');
  return url.toString().replace(/\/$/, '');
}

export const api = axios.create({ baseURL: apiBaseUrl() });
type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };
let refreshPromise: Promise<string> | null = null;
function authEndpoint(url?: string) { return Boolean(url?.includes('/auth/')); }

async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) throw new Error('Sessão sem renovação');
  const response = await axios.post<{ token: string; refreshToken: string }>(
    `${apiBaseUrl()}/auth/refresh`, { refreshToken },
    { headers: { 'X-Correlation-ID': crypto.randomUUID() } },
  );
  updateStoredTokens(response.data.token, response.data.refreshToken);
  return response.data.token;
}

api.interceptors.response.use((response) => response, async (reason: AxiosError<{ message?: string }>) => {
  const status = reason.response?.status;
  const config = reason.config as RetryConfig | undefined;
  if (status === 401 && config && !config._retry && !authEndpoint(config.url) && getStoredRefreshToken()) {
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
