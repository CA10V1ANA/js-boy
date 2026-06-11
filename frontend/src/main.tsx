import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import './styles.css';
import './services/authToken';
import { AuthProvider } from './contexts/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientesPage } from './pages/ClientesPage';
import { EntregadoresPage } from './pages/EntregadoresPage';
import { EntregasPage } from './pages/EntregasPage';
import { MinhasEntregasPage } from './pages/MinhasEntregasPage';
import { ConfiguracaoPrecoPage } from './pages/ConfiguracaoPrecoPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import {
  AboutPage,
  CompaniesPage,
  ContactPage,
  HowItWorksPage,
  LandingPage,
  PublicLayout,
  ServicesPage,
} from './pages/LandingPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'servicos', element: <ServicesPage /> },
      { path: 'como-funciona', element: <HowItWorksPage /> },
      { path: 'para-empresas', element: <CompaniesPage /> },
      { path: 'sobre', element: <AboutPage /> },
      { path: 'contato', element: <ContactPage /> },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/clientes', element: <ClientesPage /> },
          { path: '/entregadores', element: <EntregadoresPage /> },
          { path: '/entregas', element: <EntregasPage /> },
          { path: '/minhas-entregas', element: <MinhasEntregasPage /> },
          { path: '/configuracoes/preco', element: <ConfiguracaoPrecoPage /> },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);
