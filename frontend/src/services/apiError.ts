import axios from 'axios';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export function extractApiError(error: unknown, fallback: string): ApiError {
  if (!axios.isAxiosError(error)) return { message: fallback };
  const data = error.response?.data;
  const message = typeof data?.message === 'string' && data.message.trim() ? data.message : fallback;
  const code = typeof data?.code === 'string' ? data.code : undefined;
  return { message, code, status: error.response?.status };
}

export function apiErrorMessage(error: unknown, fallback: string) {
  return extractApiError(error, fallback).message;
}

export function idempotencyKey(prefix: string) {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}:${random}`;
}

