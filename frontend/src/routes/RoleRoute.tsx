import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PerfilAcesso } from '../types';
import { normalizePerfil } from './roleHome';

export function RoleRoute({ perfis }: { perfis: PerfilAcesso[] }) {
  const { usuario } = useAuth();
  const allowed = perfis.map(normalizePerfil);

  if (!usuario || !allowed.includes(normalizePerfil(usuario.perfil))) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
