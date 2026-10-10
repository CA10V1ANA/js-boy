import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PerfilAcesso } from '../types';
import { normalizePerfil } from './roleHome';

export function RoleRoute({ perfis, operacional = false }: { perfis: PerfilAcesso[]; operacional?: boolean }) {
  const { usuario } = useAuth();
  const allowed = perfis.map(normalizePerfil);

  if (!usuario || !allowed.includes(normalizePerfil(usuario.perfil)) || (operacional && usuario.perfil === 'PROPRIETARIO' && !usuario.vinculoOperacionalAtivo)) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
