import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import {
  clearStoredAuth, getStoredToken, getStoredUser,
  storeAuth, storeUser, UsuarioAutenticado,
} from '../services/authStorage';
import { clearFinancialIntents } from '../services/financialIntent';

type LoginResponse = { token: string; usuario: UsuarioAutenticado };
type AuthContextValue = {
  token: string | null; usuario: UsuarioAutenticado | null; autenticado: boolean;
  carregando: boolean; login: (email: string, senha: string) => Promise<void>; logout: () => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(() => getStoredUser());
  // If we have a user in localStorage, we assume they have an active session
  // and we try to hydrate the token from /auth/me (which will trigger a refresh if the token is null)
  const [carregando, setCarregando] = useState(() => Boolean(getStoredUser()));

  useEffect(() => {
    if (!getStoredUser()) { setCarregando(false); return; }
    let active = true;
    api.get<UsuarioAutenticado>('/auth/me').then((response) => {
      if (active) { storeUser(response.data); setUsuario(response.data); setToken(getStoredToken()); }
    }).catch(() => {
      if (active) { clearStoredAuth(); setToken(null); setUsuario(null); }
    }).finally(() => { if (active) setCarregando(false); });
    return () => { active = false; };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    token, usuario, autenticado: Boolean(token && usuario), carregando,
    async login(email, senha) {
      const response = await api.post<LoginResponse>('/auth/login', { email, senha });
      storeAuth(response.data.token, response.data.usuario);
      setToken(response.data.token); setUsuario(response.data.usuario);
    },
    logout() {
      // we don't need to pass the refresh token in the body anymore, the cookie handles it
      void api.post('/auth/logout').catch(() => undefined);
      clearFinancialIntents();
      clearStoredAuth(); setToken(null); setUsuario(null);
    },
  }), [token, usuario, carregando]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}
