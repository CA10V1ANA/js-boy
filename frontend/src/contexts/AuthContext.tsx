import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import {
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  storeAuth,
  storeUser,
  UsuarioAutenticado,
} from '../services/authStorage';

type LoginResponse = {
  token: string;
  usuario: UsuarioAutenticado;
};

type AuthContextValue = {
  token: string | null;
  usuario: UsuarioAutenticado | null;
  autenticado: boolean;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(() => getStoredUser());
  const [carregando, setCarregando] = useState<boolean>(() => Boolean(getStoredToken()));

  // Ao abrir a aplicacao, se ha um token guardado, revalida-o contra o backend.
  // Um token expirado/invalido devolve 401 (tratado no interceptor) e a sessao e
  // limpa; um token valido rehidrata o usuario com dados frescos.
  useEffect(() => {
    if (!getStoredToken()) {
      setCarregando(false);
      return;
    }

    let ativo = true;

    api.get<UsuarioAutenticado>('/auth/me')
      .then((response) => {
        if (!ativo) {
          return;
        }
        storeUser(response.data);
        setUsuario(response.data);
      })
      .catch(() => {
        if (!ativo) {
          return;
        }
        clearStoredAuth();
        setToken(null);
        setUsuario(null);
      })
      .finally(() => {
        if (ativo) {
          setCarregando(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    token,
    usuario,
    autenticado: Boolean(token && usuario),
    carregando,
    async login(email, senha) {
      const response = await api.post<LoginResponse>('/auth/login', { email, senha });
      storeAuth(response.data.token, response.data.usuario);
      setToken(response.data.token);
      setUsuario(response.data.usuario);
    },
    logout() {
      clearStoredAuth();
      setToken(null);
      setUsuario(null);
    },
  }), [token, usuario, carregando]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }

  return context;
}
