import {
  BarChart3, Bike, Building2, CreditCard, FileClock, Home, LogOut, MapPinned, Menu,
  Settings, ShieldCheck, Landmark, Sun, Truck, User, UserCog, Users, X,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { normalizePerfil } from '../routes/roleHome';
import { PerfilAcesso } from '../types';

const items: Array<{ to: string; label: string; icon: typeof Home; perfis: PerfilAcesso[] }> = [
  { to: '/dashboard', label: 'Visão geral', icon: Home, perfis: ['PROPRIETARIO'] },
  { to: '/entregas', label: 'Entregas', icon: Truck, perfis: ['PROPRIETARIO'] },
  { to: '/entregadores', label: 'Entregadores', icon: User, perfis: ['PROPRIETARIO'] },
  { to: '/clientes', label: 'Clientes', icon: Users, perfis: ['PROPRIETARIO'] },
  { to: '/pagamentos', label: 'Pagamentos', icon: CreditCard, perfis: ['PROPRIETARIO'] },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3, perfis: ['PROPRIETARIO'] },
  { to: '/auditoria', label: 'Auditoria', icon: FileClock, perfis: ['PROPRIETARIO'] },
  { to: '/usuarios', label: 'Usuários', icon: UserCog, perfis: ['PROPRIETARIO'] },
  { to: '/configuracoes/preco', label: 'Preços', icon: Settings, perfis: ['PROPRIETARIO'] },
  { to: '/configuracoes/empresa', label: 'Empresa', icon: Building2, perfis: ['PROPRIETARIO'] },
  { to: '/financeiro', label: 'Razão financeira', icon: Landmark, perfis: ['PROPRIETARIO'] },
  { to: '/privacidade', label: 'Privacidade', icon: ShieldCheck, perfis: ['PROPRIETARIO'] },
  { to: '/minhas-entregas', label: 'Painel operacional', icon: MapPinned, perfis: ['ENTREGADOR', 'FUNCIONARIO'] },
  { to: '/portal', label: 'Portal do cliente', icon: User, perfis: ['CLIENTE'] },
];

function iniciais(nome?: string) {
  const partes = (nome || '').trim().split(/\s+/);
  return ((partes[0]?.[0] || '') + (partes[1]?.[0] || '')).toUpperCase();
}
function saudacao() {
  const hora = new Date().getHours();
  return hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
}
function profileLabel(perfil?: PerfilAcesso) {
  if (perfil === 'PROPRIETARIO') return 'Proprietário';
  if (perfil === 'CLIENTE') return 'Cliente';
  return 'Entregador';
}

export function AppLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const visibleItems = items.filter((item) => usuario
    && item.perfis.map(normalizePerfil).includes(normalizePerfil(usuario.perfil)));
  const isDashboard = location.pathname.startsWith('/dashboard');
  const isCourierPortal = location.pathname.startsWith('/minhas-entregas');
  const isClientPortal = location.pathname.startsWith('/portal');
  const current = visibleItems.find((item) => location.pathname.startsWith(item.to));
  const title = isDashboard || isCourierPortal ? `${saudacao()}, ${(usuario?.nome || '').split(' ')[0]}.` : current?.label || 'JS BOY';
  const subtitle = isDashboard ? 'Visão geral da operação.' : isCourierPortal ? 'Rotas, clientes e comprovantes.' : isClientPortal ? 'Solicitações, acompanhamento e conta.' : 'Painel de entregas';

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="appShell">
      {menuOpen ? <button className="sidebarBackdrop" type="button" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} /> : null}
      <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <span className="brandMark"><Bike size={20} strokeWidth={2.7} /></span>
          <span><strong>JS BOY</strong><small>DESPACHO</small></span>
          <button className="sidebarClose" type="button" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}><X size={20} /></button>
        </div>
        <nav className="sideNav" aria-label="Menu principal">
          {visibleItems.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)}>
              <item.icon size={19} aria-hidden="true" /><span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sideUser">
          <span className="sideUserAvatar">{iniciais(usuario?.nome)}</span>
          <div style={{ minWidth: 0, flex: 1 }}><strong>{usuario?.nome}</strong><span>{profileLabel(usuario?.perfil)}</span></div>
          <button className="sideLogout" onClick={handleLogout} aria-label="Sair" title="Sair" type="button"><LogOut size={16} /></button>
        </div>
      </aside>
      <div className="contentArea">
        <header className="appHeader">
          <button className="iconButton" aria-label="Abrir menu" type="button" onClick={() => setMenuOpen(true)}><Menu size={22} /></button>
          <div className="appHeaderLeft">
            {isDashboard ? <span className="appHeaderSun"><Sun size={20} /></span> : null}
            <div style={{ minWidth: 0 }}><strong>{title}</strong><span>{subtitle}</span></div>
          </div>
          <div className="headerAvatarPill">
            <span className="headerAvatar">{iniciais(usuario?.nome)}</span>
            <button className="headerLogoutButton" type="button" onClick={handleLogout}><LogOut size={16} /><span>Sair</span></button>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
