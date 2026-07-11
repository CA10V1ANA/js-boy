// Fonte unica das chaves e do acesso ao armazenamento da sessao.
// Sem dependencias de api/React para poder ser usado por qualquer camada
// (interceptors, contexto, guards) sem risco de import circular.

export const TOKEN_KEY = 'jsboy.token';
export const USER_KEY = 'jsboy.usuario';

export type UsuarioAutenticado = {
  id: string;
  nome: string;
  email: string;
  perfil: 'PROPRIETARIO' | 'ENTREGADOR' | 'FUNCIONARIO';
};

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): UsuarioAutenticado | null {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as UsuarioAutenticado;
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
