import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import './styles.css';
import './p1-vars.css';
import './p1.css';
import './p2.css';
import './price.css';
import './portal.css';
import './services/authToken';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientesPage } from './pages/ClientesPage';
import { EntregadoresPage } from './pages/EntregadoresPage';
import { EntregasPage } from './pages/EntregasPage';
import { MinhasEntregasPage } from './pages/MinhasEntregasPage';
import { ConfiguracaoPrecoPage } from './pages/ConfiguracaoPrecoPage';
import { PagamentosPage } from './pages/PagamentosPage';
import { RelatoriosPage } from './pages/RelatoriosPage';
import { ClientePortalPage } from './pages/ClientePortalPage';
import { AuditoriaPage } from './pages/AuditoriaPage';
import { UsuariosPage } from './pages/UsuariosPage';
import { ConfiguracaoEmpresaPage } from './pages/ConfiguracaoEmpresaPage';
import { RastreamentoPage } from './pages/RastreamentoPage';
import { PrivacidadePage } from './pages/PrivacidadePage';
import { RazaoFinanceiraPage } from './pages/RazaoFinanceiraPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRoute } from './routes/RoleRoute';
import { roleHomePath } from './routes/roleHome';
import { useAuth } from './contexts/AuthContext';
import {
  AboutPage, CompaniesPage, ContactPage, HowItWorksPage, LandingPage, PublicLayout, ServicesPage,
} from './pages/LandingPage';

function HomeRedirect() {
  const { usuario } = useAuth();
  return <Navigate to={usuario ? roleHomePath(usuario.perfil) : '/login'} replace />;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> }, { path: 'servicos', element: <ServicesPage /> },
      { path: 'como-funciona', element: <HowItWorksPage /> }, { path: 'para-empresas', element: <CompaniesPage /> },
      { path: 'sobre', element: <AboutPage /> }, { path: 'contato', element: <ContactPage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/rastrear/:token', element: <RastreamentoPage /> },
  {
    element: <ProtectedRoute />,
    children: [{
      element: <AppLayout />,
      children: [
        { path: '/app', element: <HomeRedirect /> },
        {
          element: <RoleRoute perfis={['PROPRIETARIO']} />,
          children: [
            { path: '/dashboard', element: <DashboardPage /> }, { path: '/clientes', element: <ClientesPage /> },
            { path: '/entregadores', element: <EntregadoresPage /> }, { path: '/entregas', element: <EntregasPage /> },
            { path: '/pagamentos', element: <PagamentosPage /> }, { path: '/relatorios', element: <RelatoriosPage /> },
            { path: '/auditoria', element: <AuditoriaPage /> }, { path: '/usuarios', element: <UsuariosPage /> },
            { path: '/configuracoes/preco', element: <ConfiguracaoPrecoPage /> },
            { path: '/configuracoes/empresa', element: <ConfiguracaoEmpresaPage /> },
            { path: '/privacidade', element: <PrivacidadePage /> },
            { path: '/financeiro', element: <RazaoFinanceiraPage /> },
          ],
        },
        {
          element: <RoleRoute perfis={['ENTREGADOR', 'FUNCIONARIO']} />,
          children: [{ path: '/minhas-entregas', element: <MinhasEntregasPage /> }],
        },
        {
          element: <RoleRoute perfis={['CLIENTE']} />,
          children: [
            { path: '/portal', element: <ClientePortalPage /> },
            { path: '/minha-conta', element: <Navigate to="/portal" replace /> },
          ],
        },
      ],
    }],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><ToastProvider><AuthProvider><RouterProvider router={router} /></AuthProvider></ToastProvider></React.StrictMode>,
);
