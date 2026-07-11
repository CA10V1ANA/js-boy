import axios from 'axios';
import { clearStoredAuth, getStoredToken } from './authStorage';
import { emitToast } from './toastBus';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
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
