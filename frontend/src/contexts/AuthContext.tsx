import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { api } from '../services/api';
import { PerfilAcesso } from '../types';

type UsuarioAutenticado = {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilAcesso;
};

type LoginResponse = {
  token: string;
  usuario: UsuarioAutenticado;
};

type AuthContextValue = {
  token: string | null;
  usuario: UsuarioAutenticado | null;
  autenticado: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
};

const TOKEN_KEY = 'jsboy.token';
const USER_KEY = 'jsboy.usuario';

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser() {
  var raw = localStorage.getItem(USER_KEY);

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(() => readStoredUser());

  const value = useMemo<AuthContextValue>(() => ({
    token,
    usuario,
    autenticado: Boolean(token && usuario),
    async login(email, senha) {
      const response = await api.post<LoginResponse>('/auth/login', { email, senha });

      localStorage.setItem(TOKEN_KEY, response.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.usuario));
      setToken(response.data.token);
      setUsuario(response.data.usuario);
    },
    logout() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUsuario(null);
    },
  }), [token, usuario]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }

  return context;
}

