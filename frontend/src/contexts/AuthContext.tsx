import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import {
  clearStoredAuth, getStoredRefreshToken, getStoredToken, getStoredUser,
  storeAuth, storeUser, UsuarioAutenticado,
} from '../services/authStorage';

type LoginResponse = { token: string; refreshToken: string; usuario: UsuarioAutenticado };
type AuthContextValue = {
  token: string | null; usuario: UsuarioAutenticado | null; autenticado: boolean;
  carregando: boolean; login: (email: string, senha: string) => Promise<void>; logout: () => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(() => getStoredUser());
  const [carregando, setCarregando] = useState(() => Boolean(getStoredToken()));
  useEffect(() => {
    if (!getStoredToken()) { setCarregando(false); return; }
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
      storeAuth(response.data.token, response.data.refreshToken, response.data.usuario);
      setToken(response.data.token); setUsuario(response.data.usuario);
    },
    logout() {
      const refreshToken = getStoredRefreshToken();
      if (refreshToken) void api.post('/auth/logout', { refreshToken }).catch(() => undefined);
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
