import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PerfilAcesso } from '../types';

export function RoleRoute({ perfis }: { perfis: PerfilAcesso[] }) {
  const { usuario } = useAuth();

  if (!usuario || !perfis.includes(usuario.perfil)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
