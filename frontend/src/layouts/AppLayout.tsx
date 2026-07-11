import {
  BarChart3,
  Bell,
  ChevronDown,
  CreditCard,
  Home,
  LogOut,
  MapPinned,
  Menu,
  Package,
  Search,
  Settings,
  Sun,
  Truck,
  User,
  Users,
} from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const items = [
  { to: '/dashboard', label: 'Visao geral', icon: Home, perfis: ['PROPRIETARIO', 'FUNCIONARIO'] },
  { to: '/entregas', label: 'Entregas', icon: Truck, perfis: ['PROPRIETARIO'] },
  { to: '/entregadores', label: 'Entregadores', icon: User, perfis: ['PROPRIETARIO'] },
  { to: '/clientes', label: 'Clientes', icon: Users, perfis: ['PROPRIETARIO', 'FUNCIONARIO'] },
  { to: '/pagamentos', label: 'Pagamentos', icon: CreditCard, perfis: ['PROPRIETARIO'] },
  { to: '/relatorios', label: 'Relatorios', icon: BarChart3, perfis: ['PROPRIETARIO'] },
  { to: '/minhas-entregas', label: 'Minhas entregas', icon: MapPinned, perfis: ['ENTREGADOR'] },
  { to: '/configuracoes/preco', label: 'Configuracoes', icon: Settings, perfis: ['PROPRIETARIO'] },
];

const headerBySection: Record<string, [string, string]> = {
  '/entregas': ['Entregas', 'Acompanhe e gerencie todas as entregas.'],
  '/entregadores': ['Entregadores', 'Cadastro, disponibilidade e acesso da equipe.'],
  '/clientes': ['Clientes', 'Empresas e destinatarios que solicitam entregas.'],
  '/pagamentos': ['Pagamentos', 'Historico de recebimentos e comprovantes.'],
  '/relatorios': ['Relatorios', 'Desempenho da operacao no periodo.'],
  '/minhas-entregas': ['Minhas entregas', 'Entregas designadas para voce.'],
  '/configuracoes/preco': ['Configuracoes', 'Tarifas, veiculos e preferencias do sistema.'],
};

function iniciais(nome?: string) {
  const partes = (nome || '').trim().split(/\s+/);
  return ((partes[0]?.[0] || '') + (partes[1]?.[0] || '')).toUpperCase();
}

function saudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function AppLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const visibleItems = items.filter((item) => usuario && item.perfis.includes(usuario.perfil));

  const isDashboard = location.pathname.startsWith('/dashboard');
  const primeiroNome = (usuario?.nome || '').trim().split(/\s+/)[0];
  const section = Object.keys(headerBySection).find((path) => location.pathname.startsWith(path));
  const [titulo, subtitulo] = isDashboard
    ? [`${saudacao()}, ${primeiroNome}.`, 'Operacao funcionando normalmente.']
    : (section ? headerBySection[section] : ['JS BOY', 'Painel de despacho']);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brandMark">
            <Package size={20} />
          </span>
          <span>
            <strong>JS BOY</strong>
            <small>DESPACHO</small>
          </span>
        </div>

        <nav className="sideNav" aria-label="Menu principal">
          {visibleItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              <item.icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sideUser">
          <span className="sideUserAvatar">{iniciais(usuario?.nome)}</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <strong>{usuario?.nome}</strong>
            <span>{usuario?.perfil === 'PROPRIETARIO' ? 'Administrador' : usuario?.perfil === 'FUNCIONARIO' ? 'Funcionario' : 'Entregador'}</span>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Sair"
            title="Sair"
            style={{ border: 'none', background: 'transparent', color: '#6e695e', cursor: 'pointer', padding: 4 }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="contentArea">
        <header className="appHeader">
          <button className="iconButton" aria-label="Abrir menu">
            <Menu size={22} />
          </button>
          <div className="appHeaderLeft">
            {isDashboard ? (
              <span className="appHeaderSun"><Sun size={20} /></span>
            ) : null}
            <div style={{ minWidth: 0 }}>
              <strong>{titulo}</strong>
              <span>{subtitulo}</span>
            </div>
          </div>
          <div className="headerSearch">
            <Search size={16} color="#ABA89B" />
            <span>Buscar entregas, clientes…</span>
            <kbd>⌘K</kbd>
          </div>
          <button className="headerBell" aria-label="Notificacoes" type="button">
            <Bell size={18} />
          </button>
          <div className="headerAvatarPill">
            <span className="headerAvatar">{iniciais(usuario?.nome)}</span>
            <ChevronDown size={15} color="#8A8578" />
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
