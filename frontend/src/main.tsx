import { CadastroClientePage } from './pages/CadastroClientePage';
import { VerificarEmailPage } from './pages/VerificarEmailPage';
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
import { EntregadorOverviewPage } from './pages/EntregadorOverviewPage';
import { ConversasPage } from './pages/ConversasPage';
import { NotificacoesPage } from './pages/NotificacoesPage';
import { EnderecosPage } from './pages/EnderecosPage';
import { MeuPerfilPage } from './pages/MeuPerfilPage';
import { ClientePagamentosPage } from './pages/ClientePagamentosPage';
import { AjudaPage } from './pages/AjudaPage';
import { MinhasEntregasPage } from './pages/MinhasEntregasPage';
import { MeuFaturamentoPage } from './pages/MeuFaturamentoPage';
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
import { PoliticaPrivacidadePage } from './pages/PoliticaPrivacidadePage';
import { EsqueciSenhaPage } from './pages/EsqueciSenhaPage';
import { RedefinirSenhaPage } from './pages/RedefinirSenhaPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRoute } from './routes/RoleRoute';
import { roleHomePath } from './routes/roleHome';
import { useAuth } from './contexts/AuthContext';
import {
  CompaniesPage, ContactPage, HowItWorksPage, LandingPage, PublicLayout, ServicesPage,
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
      { path: 'contato', element: <ContactPage /> },
      { path: 'politica-de-privacidade', element: <PoliticaPrivacidadePage /> },
    ],
  },
  { path: '/cadastro', element: <CadastroClientePage /> },
  { path: '/verificar-email', element: <VerificarEmailPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/esqueci-senha', element: <EsqueciSenhaPage /> },
  { path: '/redefinir-senha', element: <RedefinirSenhaPage /> },
  { path: '/rastrear/:token', element: <RastreamentoPage /> },
  {
    element: <ProtectedRoute />,
    children: [{
      element: <AppLayout />,
      children: [
        { path: '/app', element: <HomeRedirect /> },
        { path: '/conversas', element: <ConversasPage /> },
        { path: '/notificacoes', element: <NotificacoesPage /> },
        { path: '/ajuda', element: <AjudaPage /> },
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
          element: <RoleRoute perfis={['ENTREGADOR', 'FUNCIONARIO', 'PROPRIETARIO']} operacional />,
          children: [
            { path: '/operacional', element: <EntregadorOverviewPage /> },
            { path: '/operacional/ajuda', element: <AjudaPage /> },
            { path: '/operacional/conversas', element: <ConversasPage /> },
            { path: '/operacional/notificacoes', element: <NotificacoesPage /> },
            { path: '/meu-perfil', element: <MeuPerfilPage /> },
            { path: '/minhas-entregas', element: <MinhasEntregasPage /> },
            { path: '/meu-faturamento', element: <MeuFaturamentoPage /> },
          ],
        },
        {
          element: <RoleRoute perfis={['CLIENTE']} />,
          children: [
            { path: '/portal', element: <ClientePortalPage /> },
            { path: '/portal/entregas', element: <ClientePortalPage /> },
            { path: '/portal/conta', element: <ClientePortalPage /> },
            { path: '/portal/enderecos', element: <EnderecosPage /> },
            { path: '/portal/pagamentos', element: <ClientePagamentosPage /> },
            { path: '/minha-conta', element: <Navigate to="/portal/conta" replace /> },
          ],
        },
      ],
    }],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><ToastProvider><AuthProvider><RouterProvider router={router} /></AuthProvider></ToastProvider></React.StrictMode>,
);
