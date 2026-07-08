import axios from 'axios';
import { emitToast } from './toastBus';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message: string = error.response?.data?.message
      || error.message
      || 'Erro inesperado. Tente novamente mais tarde.';
    emitToast(message, 'error');
    return Promise.reject(error);
  },
);

