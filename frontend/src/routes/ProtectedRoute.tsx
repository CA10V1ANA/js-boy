import { message, useLocale } from '../i18n';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute() {
  useLocale();
  const { autenticado, carregando } = useAuth();
  const location = useLocation();

  // Enquanto o token guardado esta sendo revalidado (/auth/me), evita
  // redirecionar para o login e piscar a tela indevidamente.
  if (carregando) {
    return <div className="routeLoading">{message("rota.protegida.carregando")}</div>;
  }

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

