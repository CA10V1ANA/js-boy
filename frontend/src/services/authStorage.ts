import { PerfilAcesso } from '../types';

export const TOKEN_KEY = 'jsboy.token';
export const REFRESH_KEY = 'jsboy.refresh';
export const USER_KEY = 'jsboy.usuario';

export type UsuarioAutenticado = {
  id: string; nome: string; email: string; perfil: PerfilAcesso;
};
const perfis: PerfilAcesso[] = ['PROPRIETARIO', 'ENTREGADOR', 'CLIENTE', 'FUNCIONARIO'];
function isStoredUser(value: unknown): value is UsuarioAutenticado {
  if (!value || typeof value !== 'object') return false;
  const user = value as Partial<UsuarioAutenticado>;
  return typeof user.id === 'string' && typeof user.nome === 'string'
    && typeof user.email === 'string' && typeof user.perfil === 'string'
    && perfis.includes(user.perfil as PerfilAcesso);
}
export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const getStoredRefreshToken = () => sessionStorage.getItem(REFRESH_KEY);
export function getStoredUser(): UsuarioAutenticado | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredUser(parsed)) { localStorage.removeItem(USER_KEY); return null; }
    return parsed;
  } catch { localStorage.removeItem(USER_KEY); return null; }
}
export function storeAuth(token: string, refreshToken: string, usuario: UsuarioAutenticado) {
  localStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}
export function updateStoredTokens(token: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(REFRESH_KEY, refreshToken);
}
export function storeUser(usuario: UsuarioAutenticado) {
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}
export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}
