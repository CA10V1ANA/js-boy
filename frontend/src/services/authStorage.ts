import { PerfilAcesso } from '../types';

// Fonte unica das chaves e do acesso ao armazenamento da sessao.
// Sem dependencias de api/React para poder ser usado por qualquer camada
// (interceptors, contexto, guards) sem risco de import circular.

export const TOKEN_KEY = 'jsboy.token';
export const USER_KEY = 'jsboy.usuario';

export type UsuarioAutenticado = {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilAcesso;
};

const perfis: PerfilAcesso[] = ['PROPRIETARIO', 'ENTREGADOR', 'CLIENTE', 'FUNCIONARIO'];

function isStoredUser(value: unknown): value is UsuarioAutenticado {
  if (!value || typeof value !== 'object') return false;
  const user = value as Partial<UsuarioAutenticado>;
  return typeof user.id === 'string'
    && typeof user.nome === 'string'
    && typeof user.email === 'string'
    && typeof user.perfil === 'string'
    && perfis.includes(user.perfil as PerfilAcesso);
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): UsuarioAutenticado | null {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredUser(parsed)) {
      localStorage.removeItem(USER_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function storeAuth(token: string, usuario: UsuarioAutenticado) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

export function storeUser(usuario: UsuarioAutenticado) {
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
