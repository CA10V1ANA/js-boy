import axios from 'axios';

export function apiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  if (error.response?.status === 409) {
    return 'Os dados foram alterados por outra pessoa. Recarregue a pagina e tente novamente.';
  }
  const message = error.response?.data?.message;
  return typeof message === 'string' && message.trim() ? message : fallback;
}

export function idempotencyKey(prefix: string) {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}:${random}`;
}
