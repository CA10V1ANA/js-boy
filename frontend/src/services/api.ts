import axios from 'axios';
import { clearStoredAuth, getStoredToken } from './authStorage';
import { emitToast } from './toastBus';

function apiBaseUrl() {
  const configured = import.meta.env.VITE_API_URL?.trim();
  const value = configured || (import.meta.env.DEV ? 'http://localhost:8080' : '');

  if (!value) {
    throw new Error('VITE_API_URL deve ser configurada no build de producao.');
  }

  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('VITE_API_URL deve usar HTTP ou HTTPS.');
  }
  if (import.meta.env.PROD && url.protocol !== 'https:') {
    throw new Error('VITE_API_URL deve usar HTTPS em producao.');
  }
  return url.toString().replace(/\/$/, '');
}

export const api = axios.create({
  baseURL: apiBaseUrl(),
});

function isLoginRequest(url?: string) {
  return Boolean(url && url.includes('/auth/login'));
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status: number | undefined = error.response?.status;
    const requestUrl: string | undefined = error.config?.url;

    // Token expirado ou invalido: encerra a sessao e volta ao login.
    // Nao dispara para a propria tela de login (credenciais erradas nao sao sessao expirada).
    if (status === 401 && !isLoginRequest(requestUrl)) {
      const tinhaSessao = Boolean(getStoredToken());
      clearStoredAuth();

      if (tinhaSessao && window.location.pathname !== '/login') {
        emitToast('Sua sessao expirou. Faca login novamente.', 'info');
        window.location.assign('/login');
        return Promise.reject(error);
      }
    }

    const message: string = error.response?.data?.message
      || error.message
      || 'Erro inesperado. Tente novamente mais tarde.';
    emitToast(message, 'error');
    return Promise.reject(error);
  },
);
